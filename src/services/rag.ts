import 'server-only';
import { z } from 'zod';
import type { ServerClient } from './matching';
import { loadCitizenFacts, loadCitizenDocumentInventory, getPersonalizedOpportunities } from './matching';
import { extractedFactsSchema, type ExtractedFacts } from './gemini';

export interface CitizenRAGKnowledgeBase {
  citizen: {
    id: string;
    name: string;
    relationship: string;
    age: number | null;
    dob: string | null;
    gender: string | null;
    maritalStatus: string | null;
    categoryTags: string[];
    state: string | null;
    district: string | null;
    pinCode: string | null;
    familyIncomeInr: number | null;
    employmentStatus: string | null;
    highestEducation: string | null;
    class10Percentage: number | null;
    class12Percentage: number | null;
    operatesLand: boolean | null;
  };
  documents: {
    ready: string[];
    missing: string[];
    inProgress: string[];
  };
  schemes: {
    eligible: Array<{
      id: string;
      name: string;
      nameBn: string | null;
      slug: string;
      jurisdiction: string;
      state: string | null;
      benefit: string | null;
      ministry: string | null;
      portalUrl: string | null;
      isFullyReady: boolean;
      missingDocuments: string[];
      readyDocuments: string[];
    }>;
    needsInfo: Array<{
      id: string;
      name: string;
      slug: string;
      benefit: string | null;
      missingFields: string[];
    }>;
    ineligible: Array<{
      id: string;
      name: string;
      slug: string;
      jurisdiction: string;
      state: string | null;
      benefit: string | null;
      failedReasons: string[];
    }>;
  };
  otherFamilyMembers: Array<{
    id: string;
    name: string;
    relationship: string;
  }>;
}

export interface RAGAnswerResult {
  reply: string;
  facts?: ExtractedFacts | null;
  suggestedFollowUps?: string[];
  referencedSchemes?: Array<{
    name: string;
    slug: string;
    status: 'eligible' | 'needs_documents' | 'ineligible' | 'unknown';
    portalUrl?: string | null;
    benefit?: string | null;
  }>;
}

/**
 * Builds the complete citizen RAG knowledge base for the active citizen profile.
 */
export async function buildCitizenRAGKnowledgeBase(
  supabase: ServerClient,
  citizenId: string,
): Promise<CitizenRAGKnowledgeBase | null> {
  try {
    const [
      facts,
      inventory,
      opportunities,
      profileRes,
      docInventoryRes,
      eduRes,
    ] = await Promise.all([
      loadCitizenFacts(supabase, citizenId),
      loadCitizenDocumentInventory(supabase, citizenId),
      getPersonalizedOpportunities(supabase, citizenId),
      supabase
        .from('citizen_profiles')
        .select('id, display_name, relationship_to_owner, category_tags, owner_user_id')
        .eq('id', citizenId)
        .maybeSingle(),
      supabase
        .from('citizen_document_inventory')
        .select(`
          status,
          document_code,
          document_types (name)
        `)
        .eq('citizen_id', citizenId),
      supabase
        .from('education_records')
        .select('*')
        .eq('citizen_id', citizenId),
    ]);

    if (!profileRes.data) return null;

    // Load other family members owned by same user
    const otherMembersRes = await supabase
      .from('citizen_profiles')
      .select('id, display_name, relationship_to_owner')
      .eq('owner_user_id', profileRes.data.owner_user_id)
      .neq('id', citizenId);

    const otherFamilyMembers = (otherMembersRes.data ?? []).map((m: any) => ({
      id: m.id,
      name: m.display_name,
      relationship: m.relationship_to_owner,
    }));

    // Document categories
    const readyDocs: string[] = [];
    const missingDocs: string[] = [];
    const inProgressDocs: string[] = [];

    (docInventoryRes.data ?? []).forEach((row: any) => {
      const docName = row.document_types?.name ?? row.document_code;
      if (row.status === 'available') readyDocs.push(docName);
      else if (row.status === 'missing') missingDocs.push(docName);
      else if (row.status === 'in_progress') inProgressDocs.push(docName);
    });

    // Highest education
    let highestEdu: string | null = null;
    const eduRecords = eduRes.data ?? [];
    if (eduRecords.length > 0) {
      const hasUg = eduRecords.some((e: any) => e.level === 'undergraduate');
      const has12 = eduRecords.some((e: any) => e.level === 'class_12');
      const has10 = eduRecords.some((e: any) => e.level === 'class_10');
      if (hasUg) highestEdu = 'Undergraduate / College';
      else if (has12) highestEdu = 'Higher Secondary (Class 12)';
      else if (has10) highestEdu = 'Secondary (Class 10)';
    }

    // Process eligible schemes
    const eligible = opportunities.likelyEligible.map((opp) => {
      const missing = opp.documentReadiness.missingMandatoryDocuments.map(
        (d) => d.requirement.documentName,
      );
      const ready = opp.documentReadiness.items
        .filter((i) => i.isReady)
        .map((i) => i.requirement.documentName);
      return {
        id: opp.schemeId,
        name: opp.schemeName,
        nameBn: opp.schemeNameBn,
        slug: opp.schemeSlug,
        jurisdiction: opp.jurisdiction,
        state: opp.state ?? null,
        benefit: opp.benefitSummary ?? opp.shortDescription,
        ministry: opp.ministryLabel,
        portalUrl: opp.portalUrl,
        isFullyReady: opp.documentReadiness.isFullyReady,
        missingDocuments: missing,
        readyDocuments: ready,
      };
    });

    // Process schemes needing more information
    const needsInfo = opportunities.needsMoreInfo.map((opp) => ({
      id: opp.schemeId,
      name: opp.schemeName,
      slug: opp.schemeSlug,
      benefit: opp.benefitSummary ?? opp.shortDescription,
      missingFields: opp.assessment.missingFields,
    }));

    // Process ineligible schemes with specific reasons
    const ineligible = opportunities.likelyIneligible.map((opp) => {
      const reasons: string[] = [];

      // Check state jurisdiction mismatch
      const citizenState = (facts.state as string)?.trim().toLowerCase();
      const schemeState = opp.state?.trim().toLowerCase();
      if (opp.jurisdiction === 'state' && schemeState && citizenState && schemeState !== citizenState) {
        reasons.push(
          `State jurisdiction requirement: Scheme is specific to ${opp.state}, whereas citizen's registered state is ${facts.state ?? 'unknown'}.`,
        );
      }

      // Check failed rule traces
      (opp.assessment.traces ?? [])
        .filter((t) => t.result === 'FAIL')
        .forEach((t) => {
          if (t.explanation) {
            reasons.push(t.explanation);
          } else {
            const expVal = JSON.stringify(t.expectedValue);
            const actVal = t.actualValue !== undefined && t.actualValue !== null ? JSON.stringify(t.actualValue) : 'Not provided';
            reasons.push(
              `Criterion '${t.field}' failed: expected ${t.op} ${expVal}, but profile has ${actVal}.`,
            );
          }
        });

      if (reasons.length === 0) {
        reasons.push('Does not meet specific demographic or criteria conditions for this scheme.');
      }

      return {
        id: opp.schemeId,
        name: opp.schemeName,
        slug: opp.schemeSlug,
        jurisdiction: opp.jurisdiction,
        state: opp.state ?? null,
        benefit: opp.benefitSummary ?? opp.shortDescription,
        failedReasons: reasons,
      };
    });

    const citizenData: CitizenRAGKnowledgeBase = {
      citizen: {
        id: citizenId,
        name: profileRes.data.display_name,
        relationship: profileRes.data.relationship_to_owner,
        age: facts.age ?? null,
        dob: (facts.date_of_birth as string) ?? null,
        gender: (facts.gender as string) ?? null,
        maritalStatus: (facts.marital_status as string) ?? null,
        categoryTags: profileRes.data.category_tags ?? [],
        state: (facts.state as string) ?? null,
        district: (facts.district as string) ?? null,
        pinCode: (facts.pin_code as string) ?? null,
        familyIncomeInr: (facts.family_annual_income_inr as number) ?? (facts.annual_income_inr as number) ?? null,
        employmentStatus: (facts.employment_status as string) ?? null,
        highestEducation: highestEdu,
        class10Percentage: (facts.class_10_percentage as number) ?? null,
        class12Percentage: (facts.class_12_percentage as number) ?? null,
        operatesLand: (facts.operates_land as boolean) ?? null,
      },
      documents: {
        ready: readyDocs,
        missing: missingDocs,
        inProgress: inProgressDocs,
      },
      schemes: {
        eligible,
        needsInfo,
        ineligible,
      },
      otherFamilyMembers,
    };

    return citizenData;
  } catch (err) {
    console.error('buildCitizenRAGKnowledgeBase error:', err);
    return null;
  }
}

/**
 * Serializes the knowledge base into a structured Markdown text block for the LLM prompt.
 */
export function formatRAGKnowledgeBaseForPrompt(kb: CitizenRAGKnowledgeBase): string {
  const c = kb.citizen;
  const incomeStr = c.familyIncomeInr ? `₹${c.familyIncomeInr.toLocaleString('en-IN')}` : 'Not specified';
  const ageStr = c.age ? `${c.age} years (DOB: ${c.dob ?? 'N/A'})` : 'Not specified';
  const tagsStr = c.categoryTags.length > 0 ? c.categoryTags.join(', ') : 'None marked';

  const readyDocsStr = kb.documents.ready.length > 0 ? kb.documents.ready.join(', ') : 'None currently marked available';
  const missingDocsStr = kb.documents.missing.length > 0 ? kb.documents.missing.join(', ') : 'None explicitly marked missing';
  const inProgDocsStr = kb.documents.inProgress.length > 0 ? kb.documents.inProgress.join(', ') : 'None in progress';

  const eligibleList = kb.schemes.eligible
    .map((s) => {
      const docStatus = s.isFullyReady
        ? '✓ ALL DOCUMENTS READY TO APPLY'
        : `⚠️ MISSING DOCUMENTS: ${s.missingDocuments.join(', ')}`;
      const portal = s.portalUrl ? ` | Portal: ${s.portalUrl}` : '';
      return `- **${s.name}** [${s.jurisdiction.toUpperCase()}${s.state ? ` - ${s.state}` : ''}]: Benefit: ${s.benefit ?? 'Standard benefits'}. Status: ${docStatus}${portal}`;
    })
    .join('\n');

  const ineligibleList = kb.schemes.ineligible
    .slice(0, 15) // Top 15 to stay within prompt token budget
    .map((s) => {
      const reasons = s.failedReasons.map((r) => `  * ${r}`).join('\n');
      return `- **${s.name}**:\n${reasons}`;
    })
    .join('\n');

  const needsInfoList = kb.schemes.needsInfo
    .slice(0, 8)
    .map((s) => `- **${s.name}**: Needs info on [${s.missingFields.join(', ')}]`)
    .join('\n');

  const otherMembersStr = kb.otherFamilyMembers.length > 0
    ? kb.otherFamilyMembers.map((m) => `${m.name} (${m.relationship})`).join(', ')
    : 'No other registered family members';

  return `=== ACTIVE CITIZEN PROFILE CONTEXT (BENEFICIARY) ===
- Full Name: ${c.name}
- Household Relationship: ${c.relationship.toUpperCase()}
- Age: ${ageStr}
- Gender: ${c.gender ?? 'Not specified'}
- Marital Status: ${c.maritalStatus ?? 'Not specified'}
- State of Residence: ${c.state ?? 'Not specified'} | District: ${c.district ?? 'Not specified'} | PIN: ${c.pinCode ?? 'N/A'}
- Category & Identity Tags: ${tagsStr}
- Family Annual Income: ${incomeStr}
- Employment Status: ${c.employmentStatus ?? 'Not specified'}
- Education: ${c.highestEducation ?? 'Not specified'}${c.class12Percentage ? ` (Class 12: ${c.class12Percentage}%)` : ''}${c.class10Percentage ? ` (Class 10: ${c.class10Percentage}%)` : ''}
- Operates Agricultural Land: ${c.operatesLand ? 'Yes' : 'No / Not marked'}

=== DOCUMENT POSSESSION INVENTORY ===
- Ready / Available: ${readyDocsStr}
- Missing Documents: ${missingDocsStr}
- In Progress: ${inProgDocsStr}

=== OTHER REGISTERED FAMILY MEMBERS IN HOUSEHOLD ===
${otherMembersStr}

=== DETERMINISTIC SCHEME EVALUATION (GROUND TRUTH RULES) ===
## LIKELY ELIGIBLE SCHEMES (${kb.schemes.eligible.length} total)
${eligibleList || 'No eligible schemes identified with current profile.'}

## INELIGIBLE SCHEMES & EXACT FAILURE REASONS (${kb.schemes.ineligible.length} total)
${ineligibleList || 'None.'}

## SCHEMES REQUIRING MORE PROFILE INFO
${needsInfoList || 'None.'}
`;
}

/**
 * Intelligent Deterministic RAG Synthesizer.
 * Used when Gemini API key is missing or offline, answering with 100% precision from ground-truth data.
 */
export function answerWithDeterministicRAG(
  query: string,
  kb: CitizenRAGKnowledgeBase,
): RAGAnswerResult {
  const q = query.toLowerCase().trim();
  const c = kb.citizen;
  const isBn = /[ঀ-৿]/.test(query);

  // Referenced schemes accumulator
  const referencedSchemes: RAGAnswerResult['referencedSchemes'] = [];

  // Check if query is asking for eligible schemes
  const isEligibleQuery =
    q.includes('eligible') ||
    q.includes('qualify') ||
    q.includes('schemes can i apply') ||
    q.includes('what schemes') ||
    q.includes('which schemes') ||
    q.includes('opportunities') ||
    q.includes('matches') ||
    q.includes('সুবিধা') ||
    q.includes('যোগ্য') ||
    q.includes('প্রকল্প');

  // Check if query is asking "why not eligible" for a scheme
  const isWhyIneligibleQuery =
    q.includes('why not') ||
    q.includes('why am i not') ||
    q.includes('not eligible') ||
    q.includes('ineligible') ||
    q.includes('rejected') ||
    q.includes('কেন যোগ্য নই') ||
    q.includes('অযোগ্য');

  // Check if query is asking for document requirements
  const isDocumentQuery =
    q.includes('document') ||
    q.includes('doc') ||
    q.includes('certificate') ||
    q.includes('missing') ||
    q.includes('নথি') ||
    q.includes('কাগজপত্র');

  // Check if query mentions a specific scheme
  const allSchemesCombined = [
    ...kb.schemes.eligible.map((s) => ({ ...s, status: s.isFullyReady ? ('eligible' as const) : ('needs_documents' as const) })),
    ...kb.schemes.ineligible.map((s) => ({ ...s, status: 'ineligible' as const, isFullyReady: false, missingDocuments: [], readyDocuments: [] })),
    ...kb.schemes.needsInfo.map((s) => ({ ...s, status: 'unknown' as const, jurisdiction: 'unknown', state: null, isFullyReady: false, missingDocuments: [], readyDocuments: [] })),
  ];

  // Distinctive scheme scoring to avoid generic word collisions (e.g. "scholarship", "yojana")
  const STOPWORDS = new Set([
    'scheme',
    'schemes',
    'yojana',
    'scholarship',
    'scholarships',
    'prakalpa',
    'pradhan',
    'mantri',
    'state',
    'central',
    'government',
    'bengal',
    'india',
  ]);

  let bestScheme: (typeof allSchemesCombined)[number] | null = null;
  let bestScore = 0;

  for (const s of allSchemesCombined) {
    let score = 0;
    const sName = s.name.toLowerCase();
    const sSlug = s.slug.toLowerCase();

    if (q.includes(sSlug)) score += 15;
    if (q.includes(sName)) score += 20;

    // Distinctive slug tokens (e.g. "svmcm", "ladki-bahin", "annapurna")
    const slugParts = sSlug.split(/[-_]+/).filter((p) => !STOPWORDS.has(p) && p.length > 2);
    for (const p of slugParts) {
      if (q.includes(p)) score += 5;
    }

    // Distinctive name words (e.g. "vivekananda", "aikyashree", "kanyashree", "annapurna")
    const nameWords = sName.split(/[\s\-(),]+/).filter((w) => !STOPWORDS.has(w) && w.length > 3);
    for (const w of nameWords) {
      if (q.includes(w)) score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestScheme = s;
    }
  }

  const matchedSpecificScheme = bestScore >= 3 ? bestScheme : null;

  // Check if query mentions another family member
  const mentionedMember = kb.otherFamilyMembers.find((m) =>
    q.includes(m.name.toLowerCase()) || q.includes(m.relationship.toLowerCase()),
  );

  let reply = '';
  const suggestedFollowUps: string[] = [];

  // 1. Specific Ineligibility Query ("Why am I not eligible for X?")
  if (isWhyIneligibleQuery && matchedSpecificScheme) {
    const inel = kb.schemes.ineligible.find((s) => s.id === matchedSpecificScheme.id);
    if (inel) {
      referencedSchemes.push({
        name: inel.name,
        slug: inel.slug,
        status: 'ineligible',
        benefit: inel.benefit,
      });

      reply = `### Why ${c.name} is Currently Not Eligible for **${inel.name}**\n\n`;
      reply += `Based on deterministic evaluation against verified official gazette rules, the profile does not qualify due to the following specific criteria:\n\n`;
      inel.failedReasons.forEach((r) => {
        reply += `* ❌ **${r}**\n`;
      });
      reply += `\n**What you can do:** If any of these facts have changed (e.g. recent exam marks, residence, or family circumstances), you can update them in the profile tabs or tell me here to re-evaluate your eligibility.`;

      suggestedFollowUps.push('What schemes am I eligible for?');
      suggestedFollowUps.push('What documents do I need to prepare?');
    } else {
      const elig = kb.schemes.eligible.find((s) => s.id === matchedSpecificScheme.id);
      if (elig) {
        referencedSchemes.push({
          name: elig.name,
          slug: elig.slug,
          status: elig.isFullyReady ? 'eligible' : 'needs_documents',
          portalUrl: elig.portalUrl,
          benefit: elig.benefit,
        });

        if (elig.isFullyReady) {
          reply = `Good news! **${c.name} is actually ELIGIBLE** for **${elig.name}**, and all mandatory documents are marked ready.\n\n`;
          reply += `* **Benefit:** ${elig.benefit ?? 'Standard government entitlements'}\n`;
          if (elig.portalUrl) {
            reply += `* **Official Portal:** [Apply at ${elig.portalUrl}](${elig.portalUrl})\n`;
          }
        } else {
          reply = `**${c.name} meets the eligibility rules** for **${elig.name}**, but you are short on documents:\n\n`;
          reply += `* ⚠️ **Missing Documents:** ${elig.missingDocuments.join(', ')}\n\n`;
          reply += `Once you obtain and mark these documents as available, you can proceed to apply on the official portal!`;
        }
      }
    }
  }

  // 2. Specific Scheme Document / Detail Query
  else if (matchedSpecificScheme && (isDocumentQuery || q.includes('how to apply') || q.includes('portal'))) {
    const elig = kb.schemes.eligible.find((s) => s.id === matchedSpecificScheme.id);
    referencedSchemes.push({
      name: matchedSpecificScheme.name,
      slug: matchedSpecificScheme.slug,
      status: elig ? (elig.isFullyReady ? 'eligible' : 'needs_documents') : 'ineligible',
      portalUrl: (matchedSpecificScheme as any).portalUrl,
      benefit: matchedSpecificScheme.benefit,
    });

    reply = `### Document Requirements & Application for **${matchedSpecificScheme.name}**\n\n`;
    if (elig) {
      reply += `**Status for ${c.name}:** ✅ Rules Passed (${elig.isFullyReady ? 'Ready to Apply' : 'Action Required on Documents'})\n`;
      reply += `* **Benefit:** ${elig.benefit ?? 'Standard entitlements'}\n`;
      if (elig.readyDocuments.length > 0) {
        reply += `* **Documents Ready in Your Profile:** ${elig.readyDocuments.join(', ')}\n`;
      }
      if (elig.missingDocuments.length > 0) {
        reply += `* **Missing Documents Needed:** ${elig.missingDocuments.join(', ')}\n`;
      }
      if (elig.portalUrl) {
        reply += `\n**Official Portal:** [${elig.portalUrl}](${elig.portalUrl})\n`;
      }
    } else {
      reply += `**Note:** ${c.name} is currently evaluated as not meeting all demographic or state eligibility criteria for this scheme.\n`;
    }

    suggestedFollowUps.push(`Why am I not eligible for other schemes?`);
    suggestedFollowUps.push('Show all schemes I can apply for');
  }

  // 3. Asking about another family member
  else if (mentionedMember) {
    reply = `### Beneficiary Profile: **${mentionedMember.name}** (${mentionedMember.relationship.toUpperCase()})\n\n`;
    reply += `You are currently viewing the assistant context for **${c.name} (${c.relationship})**.\n\n`;
    reply += `To see personalized scheme evaluations, document checklists, and benefits specifically tailored for **${mentionedMember.name}**, you can switch the active profile from the top-bar dropdown ` +
      `**[USER: ${c.name.toUpperCase()} (${c.relationship.toUpperCase()})]** or click below.\n\n` +
      `Each family member receives an independent, deterministic eligibility evaluation based on their own age, gender, occupation, and documents.`;

    suggestedFollowUps.push(`What schemes is ${c.name} eligible for?`);
    suggestedFollowUps.push(`What documents are ready for ${c.name}?`);
  }

  // 4. Eligible Schemes Overview Query ("What schemes am I eligible for?")
  else if (isEligibleQuery || q.includes('what can i apply') || q.includes('show schemes')) {
    const readyToApply = kb.schemes.eligible.filter((s) => s.isFullyReady);
    const actionRequired = kb.schemes.eligible.filter((s) => !s.isFullyReady);

    reply = `### Personalized Schemes for **${c.name}** (${c.relationship.toUpperCase()})\n\n`;
    reply += `Evaluating profile: State: **${c.state ?? 'All-India'}**, Category Tags: **${c.categoryTags.length > 0 ? c.categoryTags.join(', ') : 'General'}**, Annual Income: **${c.familyIncomeInr ? `₹${c.familyIncomeInr.toLocaleString('en-IN')}` : 'Not provided'}**.\n\n`;

    if (readyToApply.length > 0) {
      reply += `#### 🟢 Ready to Apply Now (${readyToApply.length} schemes)\n`;
      readyToApply.forEach((s) => {
        referencedSchemes.push({
          name: s.name,
          slug: s.slug,
          status: 'eligible',
          portalUrl: s.portalUrl,
          benefit: s.benefit,
        });
        const portalLink = s.portalUrl ? ` • [Official Portal ↗](${s.portalUrl})` : '';
        reply += `* **${s.name}** (${s.jurisdiction === 'central' ? 'Central' : s.state})\n  * Benefit: ${s.benefit ?? 'Government assistance'}${portalLink}\n`;
      });
      reply += '\n';
    }

    if (actionRequired.length > 0) {
      reply += `#### 🟡 Eligible - Action Required on Documents (${actionRequired.length} schemes)\n`;
      reply += `You meet the eligibility criteria, but need to arrange the following documents:\n`;
      actionRequired.slice(0, 6).forEach((s) => {
        referencedSchemes.push({
          name: s.name,
          slug: s.slug,
          status: 'needs_documents',
          portalUrl: s.portalUrl,
          benefit: s.benefit,
        });
        reply += `* **${s.name}**\n  * Missing: **${s.missingDocuments.join(', ')}**\n  * Benefit: ${s.benefit ?? 'Standard entitlement'}\n`;
      });
      reply += '\n';
    }

    if (readyToApply.length === 0 && actionRequired.length === 0) {
      reply += `No schemes currently match 100% of the criteria with the current profile details. You can add more profile details like annual family income, student marks, or category tags (e.g. ST, Widow, Farmer, Elder) to unlock matching welfare schemes.`;
    }

    suggestedFollowUps.push('What documents am I missing?');
    suggestedFollowUps.push('Why am I not eligible for some schemes?');
  }

  // 5. General Document Inventory Query
  else if (isDocumentQuery) {
    reply = `### Document Readiness Summary for **${c.name}**\n\n`;
    reply += `* **Documents Marked Available (${kb.documents.ready.length}):** ${kb.documents.ready.join(', ') || 'None yet'}\n`;
    reply += `* **Documents Missing (${kb.documents.missing.length}):** ${kb.documents.missing.join(', ') || 'None explicitly marked'}\n`;
    if (kb.documents.inProgress.length > 0) {
      reply += `* **In Progress (${kb.documents.inProgress.length}):** ${kb.documents.inProgress.join(', ')}\n`;
    }

    // Collect all missing documents across eligible schemes
    const missingDocsSet = new Set<string>();
    kb.schemes.eligible.forEach((s) => {
      s.missingDocuments.forEach((d) => missingDocsSet.add(d));
    });

    if (missingDocsSet.size > 0) {
      reply += `\n#### 📋 Priority Documents to Arrange:\n`;
      Array.from(missingDocsSet).forEach((d) => {
        reply += `* **${d}** — required for one or more of your eligible schemes.\n`;
      });
      reply += `\n*Note: PRAPTI never collects identity numbers or scans. Once you receive these certificates from your local BDO, SDO, or Gram Panchayat, simply toggle their status to 'Available' in your profile.*`;
    }

    suggestedFollowUps.push('Show schemes I am eligible for');
    suggestedFollowUps.push('How do I apply for these schemes?');
  }

  // 6. Default Fallback & Conversational Assistance
  else {
    reply = `Hello! I am your **PRAPTI AI Benefits Companion**, currently assisting **${c.name}** (${c.relationship.toUpperCase()}).\n\n` +
      `I have complete context on your profile, documents, and verified government schemes:\n` +
      `* **Active Profile:** ${c.name} (Registered in ${c.state ?? 'All-India'})\n` +
      `* **Category Tags:** ${c.categoryTags.length > 0 ? c.categoryTags.join(', ') : 'None marked'}\n` +
      `* **Schemes Matched:** ${kb.schemes.eligible.length} eligible schemes (${kb.schemes.eligible.filter((s) => s.isFullyReady).length} ready to apply immediately)\n` +
      `* **Document Readiness:** ${kb.documents.ready.length} documents available\n\n` +
      `How can I help you today? You can ask me:\n` +
      `1. *"What schemes am I eligible for?"*\n` +
      `2. *"Why am I not eligible for [Scheme Name]?"*\n` +
      `3. *"What documents do I need to prepare?"*\n` +
      `4. Or describe your personal circumstances to update your profile.`;

    suggestedFollowUps.push('What schemes am I eligible for?');
    suggestedFollowUps.push('What documents do I need to prepare?');
    suggestedFollowUps.push('Why am I not eligible for some schemes?');
  }

  // Check if user text contains extractable profile facts
  const extracted = fallbackExtractFacts(query);
  const hasExtractedData = Boolean(
    extracted.age ||
      extracted.gender ||
      extracted.maritalStatus ||
      extracted.state ||
      extracted.familyAnnualIncomeInr ||
      extracted.employmentStatus ||
      extracted.class10Percentage ||
      extracted.class12Percentage ||
      extracted.operatesAgriculturalLand,
  );

  return {
    reply,
    facts: hasExtractedData ? extracted : null,
    suggestedFollowUps,
    referencedSchemes,
  };
}

/**
 * Regex fact extractor helper for fallback.
 */
function fallbackExtractFacts(text: string): ExtractedFacts {
  const lower = text.toLowerCase();
  const facts: ExtractedFacts = {
    assistantReply: 'Extracted details from your message.',
    documentsMentioned: [],
  };

  const ageMatch = text.match(/\b([1-9][0-9])\s*(?:years?|yrs?|বছর)\b/i) || text.match(/\bage\s*(?:is|:)?\s*([1-9][0-9])\b/i);
  if (ageMatch && ageMatch[1]) facts.age = parseInt(ageMatch[1], 10);

  if (/female|woman|girl|মহিলা|মেয়ে/i.test(lower)) facts.gender = 'female';
  else if (/male|man|boy|পুরুষ|ছেলে/i.test(lower)) facts.gender = 'male';

  if (/unmarried|single|never married|অবিবাহিত/i.test(lower)) facts.maritalStatus = 'never_married';
  else if (/widow|widowed|বিধবা/i.test(lower)) facts.maritalStatus = 'widowed';
  else if (/married|বিবাহিত/i.test(lower)) facts.maritalStatus = 'married';

  if (/west bengal|bengal|wb|পশ্চিমবঙ্গ/i.test(lower)) facts.state = 'West Bengal';
  else if (/maharashtra/i.test(lower)) facts.state = 'Maharashtra';
  else if (/rajasthan/i.test(lower)) facts.state = 'Rajasthan';
  else if (/karnataka/i.test(lower)) facts.state = 'Karnataka';
  else if (/tamil nadu/i.test(lower)) facts.state = 'Tamil Nadu';

  const lakhMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac|লাখ)/i);
  if (lakhMatch && lakhMatch[1]) {
    facts.familyAnnualIncomeInr = Math.round(parseFloat(lakhMatch[1]) * 100000);
  }

  if (/student|college|school|university|ছাত্র|ছাত্রী/i.test(lower)) facts.employmentStatus = 'student';
  else if (/unemployed|jobseeker|বেকার/i.test(lower)) facts.employmentStatus = 'unemployed';
  else if (/retired|অবসরপ্রাপ্ত/i.test(lower)) facts.employmentStatus = 'retired';
  else if (/employed|job|চাকরিজীবী/i.test(lower)) facts.employmentStatus = 'employed';

  const percentMatch = text.match(/([0-9]{2}(?:\.[0-9]+)?)\s*%/);
  if (percentMatch && percentMatch[1]) {
    const val = parseFloat(percentMatch[1]);
    if (/class 12|12th|hs|উচ্চমাধ্যমিক/i.test(lower)) facts.class12Percentage = val;
    else facts.class10Percentage = val;
  }

  if (/farmer|agriculture|cultivat|জমি|কৃষক/i.test(lower)) {
    facts.operatesAgriculturalLand = true;
  }

  return facts;
}

/**
 * Main RAG Query Processor:
 * Context-aware AI Benefits Companion using Gemini when key is present,
 * with seamless fallback to deterministic RAG reasoning engine.
 */
export async function executeRAGQuery(params: {
  userMessage: string;
  citizenId: string;
  supabase: ServerClient;
  conversationHistory?: Array<{ sender: 'user' | 'assistant'; text: string }>;
}): Promise<RAGAnswerResult> {
  const { userMessage, citizenId, supabase, conversationHistory = [] } = params;

  // 1. Build knowledge base for the active citizen
  const kb = await buildCitizenRAGKnowledgeBase(supabase, citizenId);
  if (!kb) {
    return {
      reply: 'Could not load citizen profile facts. Please ensure you are signed in and try again.',
      facts: null,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    // Return deterministic RAG synthesis
    return answerWithDeterministicRAG(userMessage, kb);
  }

  // 2. Format knowledge base prompt for Gemini
  const contextPrompt = formatRAGKnowledgeBaseForPrompt(kb);

  const SYSTEM_INSTRUCTIONS = `You are PRAPTI's AI Citizen Benefits Companion.
PRAPTI is a citizen-first welfare portal for Indian citizens across Central and State schemes (West Bengal, Maharashtra, Rajasthan, Karnataka, Tamil Nadu, Delhi, Uttar Pradesh, Telangana).

CRITICAL DOMAIN RULES:
1. You have been provided with the verified, deterministic profile, document readiness, and rule evaluation traces of the ACTIVE CITIZEN (${kb.citizen.name}, relationship: ${kb.citizen.relationship}).
2. GROUND ALL ANSWERS in the provided context:
   - When asked what schemes they are eligible for, cite their ELIGIBLE SCHEMES, distinguishing between those ready to apply vs. those needing documents. Include monetary benefits and portal links.
   - When asked why they are NOT eligible for a scheme, explain the EXACT failed criteria (e.g. academic marks below threshold, state mismatch, age/gender restriction, operates no land) based on the rule evaluation traces.
   - When asked what documents they need, compare the scheme requirements against their ready documents and missing documents.
   - When asked about other family members, reference who is in the household and explain that they can switch profiles using the top bar to inspect that member's specific schemes.
3. If the user mentions new personal details (age, income, percentage marks, occupation, land, state, or documents), extract them into structured JSON fields.
4. Output valid JSON in the exact schema:
{
  "reply": "Your rich, formatted markdown answer to the citizen (warm, helpful, professional, supporting English or Bengali as queried)",
  "extractedFacts": {
    "age": number | null,
    "gender": "female" | "male" | "other" | null,
    "maritalStatus": "never_married" | "married" | "widowed" | "divorced" | null,
    "state": string | null,
    "district": string | null,
    "familyAnnualIncomeInr": number | null,
    "employmentStatus": "employed" | "unemployed" | "student" | "retired" | "agricultural_worker" | null,
    "class10Percentage": number | null,
    "class12Percentage": number | null,
    "operatesAgriculturalLand": boolean | null
  },
  "suggestedFollowUps": ["Question 1", "Question 2"],
  "referencedSchemes": [
    { "name": "Scheme Name", "slug": "scheme-slug", "status": "eligible" | "needs_documents" | "ineligible" | "unknown", "benefit": "₹...", "portalUrl": "https://..." }
  ]
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const historyParts = conversationHistory.slice(-4).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_INSTRUCTIONS}\n\n${contextPrompt}` }],
          },
          {
            role: 'model',
            parts: [{ text: JSON.stringify({ reply: `Understood. I have loaded the full profile context and scheme evaluations for ${kb.citizen.name} (${kb.citizen.relationship}). How can I assist?` }) }],
          },
          ...historyParts,
          {
            role: 'user',
            parts: [{ text: `User query: "${userMessage}"` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      console.warn('Gemini RAG API returned status', res.status, 'falling back to deterministic RAG');
      return answerWithDeterministicRAG(userMessage, kb);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return answerWithDeterministicRAG(userMessage, kb);
    }

    const parsed = JSON.parse(candidateText);
    const factsParsed = parsed.extractedFacts ? extractedFactsSchema.safeParse({ ...parsed.extractedFacts, assistantReply: parsed.reply }) : null;

    const hasNewFacts = factsParsed?.success && Boolean(
      factsParsed.data.age ||
        factsParsed.data.gender ||
        factsParsed.data.maritalStatus ||
        factsParsed.data.state ||
        factsParsed.data.familyAnnualIncomeInr ||
        factsParsed.data.employmentStatus ||
        factsParsed.data.class10Percentage ||
        factsParsed.data.class12Percentage ||
        factsParsed.data.operatesAgriculturalLand,
    );

    return {
      reply: parsed.reply || 'Here is your benefits information.',
      facts: hasNewFacts ? factsParsed?.data : null,
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [],
      referencedSchemes: Array.isArray(parsed.referencedSchemes) ? parsed.referencedSchemes : [],
    };
  } catch (err) {
    console.error('executeRAGQuery with Gemini failed, falling back:', err);
    return answerWithDeterministicRAG(userMessage, kb);
  }
}
