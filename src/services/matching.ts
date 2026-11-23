import { createHash } from 'crypto';
import type { createSupabaseServerClient } from '@/lib/supabase/server';
import { compileCitizenFacts, type RawCitizenData } from '@/domain/eligibility/facts';
import { evaluateScheme } from '@/domain/eligibility/evaluator';
import { evaluateDocumentReadiness } from '@/domain/eligibility/readiness';
import type {
  FactDictionary,
  SchemeAssessmentResult,
  DocumentReadinessResult,
  SchemeRuleWithSource,
  SchemeDocumentRequirement,
  CitizenDocumentStatus,
  EligibilityOutcome,
} from '@/domain/eligibility/types';
import type { RuleNode } from '@/lib/validation/scheme';

export type ServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export interface MatchedSchemeOpportunity {
  schemeId: string;
  schemeSlug: string;
  schemeName: string;
  schemeNameBn: string | null;
  ministryLabel: string | null;
  category: string;
  jurisdiction: string;
  state?: string | null;
  portalUrl: string | null;
  shortDescription: string | null;
  benefitSummary: string | null;
  versionId: string;
  versionNumber: number;
  assessment: SchemeAssessmentResult;
  documentReadiness: DocumentReadinessResult;
  isSaved?: boolean;
  tags?: string[];
}

export interface PersonalizedOpportunities {
  likelyEligible: MatchedSchemeOpportunity[];
  needsMoreInfo: MatchedSchemeOpportunity[];
  likelyIneligible: MatchedSchemeOpportunity[];
  cannotAssess: MatchedSchemeOpportunity[];
  totalPublishedCount: number;
}

/**
 * Loads all profile data for a citizen and compiles the FactDictionary.
 */
export async function loadCitizenFacts(
  supabase: ServerClient,
  citizenId: string,
): Promise<FactDictionary> {
  const [
    profileRes,
    personalRes,
    addressRes,
    financeRes,
    empRes,
    eduRes,
    agriRes,
    docRes,
  ] = await Promise.all([
    supabase.from('citizen_profiles').select('id, full_name, is_minor, category_tags').eq('id', citizenId).maybeSingle(),
    supabase.from('citizen_personal_details').select('*').eq('citizen_id', citizenId).maybeSingle(),
    supabase.from('citizen_addresses').select('*').eq('citizen_id', citizenId),
    supabase.from('citizen_financial_profiles').select('*').eq('citizen_id', citizenId).maybeSingle(),
    supabase.from('citizen_employment_profiles').select('*').eq('citizen_id', citizenId).maybeSingle(),
    supabase.from('education_records').select('*').eq('citizen_id', citizenId),
    supabase.from('citizen_agricultural_profiles').select('*').eq('citizen_id', citizenId).maybeSingle(),
    supabase
      .from('citizen_document_inventory')
      .select('status, document_code')
      .eq('citizen_id', citizenId),
  ]);

  const rawDocs = (docRes.data ?? []).map((row: any) => ({
    document_code: row.document_code,
    status: row.status,
  }));

  const rawData: RawCitizenData = {
    profile: profileRes.data,
    personal: personalRes.data,
    addresses: addressRes.data,
    financial: financeRes.data,
    employment: empRes.data,
    education: eduRes.data,
    agriculture: agriRes.data,
    documents: rawDocs,
  };

  return compileCitizenFacts(rawData);
}

/**
 * Loads citizen's document inventory statuses.
 */
export async function loadCitizenDocumentInventory(
  supabase: ServerClient,
  citizenId: string,
): Promise<CitizenDocumentStatus[]> {
  const { data } = await supabase
    .from('citizen_document_inventory')
    .select('document_code, status')
    .eq('citizen_id', citizenId);

  return (data ?? []).map((row: any) => ({
    documentTypeId: row.document_code,
    documentCode: row.document_code ?? '',
    status: row.status,
  }));
}

/**
 * Computes a hash of the citizen facts to detect if a cached assessment is stale.
 */
export function hashFacts(facts: FactDictionary): string {
  const serialized = JSON.stringify(facts, Object.keys(facts).sort());
  return createHash('sha256').update(serialized).digest('hex').slice(0, 16);
}

/**
 * Loads published schemes, executes deterministic rule evaluation and document readiness
 * against the citizen's compiled facts, and persists the assessment records.
 */
export async function getPersonalizedOpportunities(
  supabase: ServerClient,
  citizenId: string,
): Promise<PersonalizedOpportunities> {
  const [facts, inventory, schemesRes, savedRes] = await Promise.all([
    loadCitizenFacts(supabase, citizenId),
    loadCitizenDocumentInventory(supabase, citizenId),
    supabase
      .from('schemes')
      .select(`
        id,
        slug,
        name,
        name_bn,
        ministry_label,
        category,
        jurisdiction,
        state,
        portal_url,
        short_description,
        tags,
        current_version_id,
        scheme_versions!schemes_current_version_fk (
          id,
          version_number,
          summary_en,
          benefit_summary_en,
          scheme_rules (
            id,
            rule_kind,
            rule_json,
            clause_reference,
            source_id,
            scheme_sources (
              id,
              title
            )
          ),
          scheme_documents (
            id,
            document_code,
            is_mandatory,
            notes_en,
            document_types (
              code,
              name,
              category
            )
          )
        )
      `)
      .eq('status', 'published')
      .not('current_version_id', 'is', null),
    supabase.from('saved_schemes').select('scheme_id').eq('citizen_id', citizenId),
  ]);

  const savedSchemeIds = new Set((savedRes.data ?? []).map((s: any) => s.scheme_id));
  const factsSnapshotHash = hashFacts(facts);

  const likelyEligible: MatchedSchemeOpportunity[] = [];
  const needsMoreInfo: MatchedSchemeOpportunity[] = [];
  const likelyIneligible: MatchedSchemeOpportunity[] = [];
  const cannotAssess: MatchedSchemeOpportunity[] = [];

  const schemes = schemesRes.data ?? [];

  for (const scheme of schemes as any[]) {
    const version = scheme.scheme_versions;
    if (!version) continue;

    // Compile rules
    const rules: SchemeRuleWithSource[] = (version.scheme_rules ?? []).map((r: any) => ({
      id: r.id,
      ruleKind: r.rule_kind,
      ruleJson: r.rule_json as RuleNode,
      clauseReference: r.clause_reference,
      sourceId: r.source_id,
      sourceTitle: r.scheme_sources?.title,
    }));

    // Compile document requirements
    const docRequirements: SchemeDocumentRequirement[] = (version.scheme_documents ?? []).map(
      (d: any) => ({
        id: d.id,
        documentTypeId: d.document_code,
        documentCode: d.document_code ?? d.document_types?.code ?? '',
        documentName: d.document_types?.name ?? d.document_code ?? '',
        category: d.document_types?.category ?? 'general',
        isMandatory: d.is_mandatory,
        notesEn: d.notes_en,
      }),
    );

    // Evaluate rules deterministically
    const assessment = evaluateScheme(rules, facts);

    // Evaluate document readiness
    const readiness = evaluateDocumentReadiness(docRequirements, inventory);

    // State jurisdiction enforcement:
    // Central schemes are applicable regardless of state.
    // State schemes are applicable ONLY if citizen resides in that specific state.
    const isStateScheme = (scheme.jurisdiction ?? 'state') === 'state';
    const isStateMismatch =
      isStateScheme &&
      Boolean(scheme.state) &&
      Boolean(facts.state) &&
      (facts.state as string).trim().toLowerCase() !== (scheme.state as string).trim().toLowerCase();

    // If citizen state is known and doesn't match the state scheme, mark as ineligible
    let effectiveOutcome = assessment.outcome;
    if (isStateMismatch) {
      effectiveOutcome = 'likely_ineligible';
    }

    const opp: MatchedSchemeOpportunity = {
      schemeId: scheme.id,
      schemeSlug: scheme.slug,
      schemeName: scheme.name,
      schemeNameBn: scheme.name_bn,
      ministryLabel: scheme.ministry_label,
      category: scheme.category ?? 'general',
      jurisdiction: scheme.jurisdiction ?? 'state',
      state: scheme.state ?? null,
      portalUrl: scheme.portal_url,
      shortDescription: scheme.short_description,
      benefitSummary: version.benefit_summary_en,
      versionId: version.id,
      versionNumber: version.version_number,
      assessment: {
        ...assessment,
        outcome: effectiveOutcome,
      },
      documentReadiness: readiness,
      isSaved: savedSchemeIds.has(scheme.id),
      tags: scheme.tags ?? [],
    };

    switch (effectiveOutcome) {
      case 'likely_eligible':
        likelyEligible.push(opp);
        break;
      case 'needs_more_info':
        // Only include in needsMoreInfo if not a state mismatch
        if (!isStateMismatch) {
          needsMoreInfo.push(opp);
        }
        break;
      case 'likely_ineligible':
        likelyIneligible.push(opp);
        break;
      case 'cannot_assess':
        cannotAssess.push(opp);
        break;
    }

    // Persist assessment async / fire-and-forget
    supabase
      .from('eligibility_assessments')
      .upsert(
        {
          citizen_id: citizenId,
          scheme_version_id: version.id,
          outcome: assessment.outcome,
          profile_snapshot_hash: factsSnapshotHash,
          rules_engine_version: '1.0.0',
          evaluated_at: new Date().toISOString(),
        },
        { onConflict: 'citizen_id, scheme_version_id' },
      )
      .then(() => {});
  }

  return {
    likelyEligible,
    needsMoreInfo,
    likelyIneligible,
    cannotAssess,
    totalPublishedCount: schemes.length,
  };
}

/**
 * Loads a single scheme with full details, rules, sources, documents, and application steps.
 */
export async function getSchemeDetail(
  supabase: ServerClient,
  schemeId: string,
  citizenId?: string | null,
) {
  const { data: scheme, error } = await supabase
    .from('schemes')
    .select(`
      id,
      slug,
      name,
      name_bn,
      ministry_label,
      category,
      jurisdiction,
      state,
      portal_url,
      short_description,
      status,
      current_version_id,
      scheme_versions!schemes_current_version_fk (
        id,
        version_number,
        summary_en,
        summary_bn,
        benefit_summary_en,
        benefit_summary_bn,
        application_deadline,
        scheme_sources (
          id,
          title,
          url,
          source_type,
          verified_at
        ),
        scheme_rules (
          id,
          rule_kind,
          rule_json,
          clause_reference,
          source_id
        ),
        scheme_documents (
          id,
          document_code,
          is_mandatory,
          notes_en,
          document_types (
            code,
            name,
            category
          )
        ),
        scheme_application_steps (
          id,
          step_order,
          title_en,
          title_bn,
          body_en,
          body_bn
        )
      )
    `)
    .eq('id', schemeId)
    .maybeSingle();

  if (error || !scheme) {
    return null;
  }

  let assessment: SchemeAssessmentResult | null = null;
  let documentReadiness: DocumentReadinessResult | null = null;
  let isSaved = false;

  const version = (scheme as any).scheme_versions;
  if (citizenId && version) {
    const [facts, inventory, savedRes] = await Promise.all([
      loadCitizenFacts(supabase, citizenId),
      loadCitizenDocumentInventory(supabase, citizenId),
      supabase.from('saved_schemes').select('id').eq('citizen_id', citizenId).eq('scheme_id', schemeId).maybeSingle(),
    ]);

    isSaved = Boolean(savedRes.data);

    const rules: SchemeRuleWithSource[] = (version.scheme_rules ?? []).map((r: any) => ({
      id: r.id,
      ruleKind: r.rule_kind,
      ruleJson: r.rule_json as RuleNode,
      clauseReference: r.clause_reference,
      sourceId: r.source_id,
    }));

    const docRequirements: SchemeDocumentRequirement[] = (version.scheme_documents ?? []).map(
      (d: any) => ({
        id: d.id,
        documentTypeId: d.document_code,
        documentCode: d.document_code ?? d.document_types?.code ?? '',
        documentName: d.document_types?.name ?? d.document_code ?? '',
        category: d.document_types?.category ?? 'general',
        isMandatory: d.is_mandatory,
        notesEn: d.notes_en,
      }),
    );

    assessment = evaluateScheme(rules, facts);
    documentReadiness = evaluateDocumentReadiness(docRequirements, inventory);
  }

  return {
    scheme,
    version,
    assessment,
    documentReadiness,
    isSaved,
  };
}

