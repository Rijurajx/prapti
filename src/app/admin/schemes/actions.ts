'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdministrator } from '@/lib/admin/guard';
import { recordAdminAudit, type AdminServerClient } from '@/lib/admin/audit';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  idSchema,
  publishSchema,
  reviewSchema,
  ruleSchema,
  schemeDraftSchema,
  sourceSchema,
  type IdInput,
  type PublishInput,
  type ReviewInput,
  type RuleInput,
  type SchemeDraftInput,
  type SourceInput,
} from '@/lib/validation/scheme';
import {
  canEditVersion,
  canPublishVersion,
  canRetireVersion,
  nextVersionNumber,
  type VersionSnapshot,
  type VersionStatus,
} from '@/lib/schemes/versioning';

export type ActionResult = { ok: true } | { ok: false; error: string };
export type IdResult = { ok: true; id: string } | { ok: false; error: string };
export type AddSourceInput = { schemeVersionId: string; source: SourceInput };
export type AddRuleInput = RuleInput & { schemeVersionId: string };

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const CHECK_INPUT_ERROR = 'Check the details and try again';
const LOCKED_ERROR = 'This version is locked';
const DRAFT_ONLY_ERROR = 'Only a draft can be submitted for review';
const ADMIN_PATH = '/admin/schemes';

const addSourceSchema = z.object({ schemeVersionId: z.string().uuid(), source: sourceSchema });
const addRuleSchema = ruleSchema.extend({ schemeVersionId: z.string().uuid() });
const versionIdSchema = z.string().uuid();

type VersionRow = {
  id: string;
  scheme_id: string;
  version_number: number;
  status: VersionStatus;
  published_at: string | null;
};
const VERSION_COLUMNS = 'id, scheme_id, version_number, status, published_at';

type AdminContext = { ok: true; supabase: AdminServerClient; userId: string } | { ok: false; error: string };
type LoadedVersion = { ok: true; row: VersionRow } | { ok: false; error: string };

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? CHECK_INPUT_ERROR;
}

/** Runs the administrator check first; the user id is taken from the session, never from input. */
async function adminContext(): Promise<AdminContext> {
  const guard = await requireAdministrator();
  if (!guard.ok) return guard;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: GENERIC_ERROR };
  return { ok: true, supabase, userId: guard.userId };
}

function toSnapshot(row: VersionRow): VersionSnapshot {
  return {
    status: row.status,
    versionNumber: row.version_number,
    schemeId: row.scheme_id,
    publishedAt: row.published_at ? new Date(row.published_at) : null,
  };
}

async function loadVersion(supabase: AdminServerClient, versionId: string): Promise<LoadedVersion> {
  const { data, error } = await supabase
    .from('scheme_versions')
    .select(VERSION_COLUMNS)
    .eq('id', versionId)
    .maybeSingle();
  if (error) {
    console.error('loadVersion failed', error.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const row = data as VersionRow | null;
  if (!row) return { ok: false, error: 'Scheme version not found' };
  return { ok: true, row };
}

/** Appends the audit row and refreshes the admin pages after a successful write. */
async function afterWrite(
  supabase: AdminServerClient,
  userId: string,
  action: string,
  targetTable: string,
  targetId: string | null,
): Promise<void> {
  await recordAdminAudit(supabase, { actorUserId: userId, action, targetTable, targetId });
  revalidatePath(ADMIN_PATH, 'layout');
}

export async function createSchemeDraft(input: SchemeDraftInput): Promise<IdResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = schemeDraftSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { supabase, userId } = guard;

  const { data: scheme, error: schemeError } = await supabase
    .from('schemes')
    .insert({ slug: parsed.data.slug, name: parsed.data.name, status: 'draft' })
    .select('id')
    .single();
  if (schemeError || !scheme) {
    console.error('createSchemeDraft failed', schemeError?.code);
    return {
      ok: false,
      error: schemeError?.code === '23505' ? 'That slug is already in use' : GENERIC_ERROR,
    };
  }
  const schemeId = (scheme as { id: string }).id;

  // Not covered by a database trigger; a failure here leaves a scheme without a version.
  const { data: version, error: versionError } = await supabase
    .from('scheme_versions')
    .insert({ scheme_id: schemeId, version_number: 1, status: 'draft' })
    .select('id')
    .single();
  if (versionError || !version) {
    console.error('createSchemeDraft failed', versionError?.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const versionId = (version as { id: string }).id;

  const { error: pointerError } = await supabase
    .from('schemes')
    .update({ current_version_id: versionId })
    .eq('id', schemeId);
  if (pointerError) {
    console.error('createSchemeDraft failed', pointerError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  await afterWrite(supabase, userId, 'scheme.create_draft', 'schemes', schemeId);
  return { ok: true, id: schemeId };
}

export async function createNewVersion(schemeId: string): Promise<IdResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = idSchema.safeParse({ id: schemeId });
  if (!parsed.success) return { ok: false, error: 'Unknown scheme' };
  const { supabase, userId } = guard;

  const { data: rows, error: listError } = await supabase
    .from('scheme_versions')
    .select(VERSION_COLUMNS)
    .eq('scheme_id', parsed.data.id)
    .order('version_number', { ascending: false });
  if (listError) {
    console.error('createNewVersion failed', listError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const versions = (rows ?? []) as VersionRow[];
  const latest = versions[0];
  if (latest && canEditVersion(toSnapshot(latest))) {
    return { ok: false, error: 'Finish the current draft first' };
  }

  const { data: created, error: insertError } = await supabase
    .from('scheme_versions')
    .insert({
      scheme_id: parsed.data.id,
      version_number: nextVersionNumber(versions.map((v) => v.version_number)),
      status: 'draft',
    })
    .select('id')
    .single();
  if (insertError || !created) {
    console.error('createNewVersion failed', insertError?.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const newId = (created as { id: string }).id;

  const { error: pointerError } = await supabase
    .from('schemes')
    .update({ current_version_id: newId })
    .eq('id', parsed.data.id);
  if (pointerError) {
    console.error('createNewVersion failed', pointerError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  await afterWrite(supabase, userId, 'scheme.new_version', 'scheme_versions', newId);
  return { ok: true, id: newId };
}

export async function addSource(input: AddSourceInput): Promise<ActionResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = addSourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { supabase, userId } = guard;
  const { schemeVersionId, source } = parsed.data;

  const version = await loadVersion(supabase, schemeVersionId);
  if (!version.ok) return version;
  if (!canEditVersion(toSnapshot(version.row))) return { ok: false, error: LOCKED_ERROR };

  const { data: created, error } = await supabase
    .from('scheme_sources')
    .insert({
      scheme_version_id: schemeVersionId,
      source_type: source.sourceType,
      title: source.title,
      url: source.url,
      published_on: source.publishedOn,
      verified_by_user_id: null,
      verified_at: null,
    })
    .select('id')
    .single();
  if (error || !created) {
    console.error('addSource failed', error?.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  await afterWrite(supabase, userId, 'scheme.add_source', 'scheme_sources', (created as { id: string }).id);
  return { ok: true };
}

export async function verifySource(input: IdInput): Promise<ActionResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Unknown source' };
  const { supabase, userId } = guard;

  const { data: source, error: sourceError } = await supabase
    .from('scheme_sources')
    .select('id, scheme_version_id, verified_at')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (sourceError) {
    console.error('verifySource failed', sourceError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const row = source as { id: string; scheme_version_id: string; verified_at: string | null } | null;
  if (!row) return { ok: false, error: 'Source not found' };
  if (row.verified_at) return { ok: false, error: 'This source is already verified' };

  const version = await loadVersion(supabase, row.scheme_version_id);
  if (!version.ok) return version;
  if (!canEditVersion(toSnapshot(version.row))) return { ok: false, error: LOCKED_ERROR };

  const { data: updated, error: updateError } = await supabase
    .from('scheme_sources')
    .update({ verified_by_user_id: userId, verified_at: new Date().toISOString() })
    .eq('id', row.id)
    .is('verified_at', null)
    .select('id');
  if (updateError) {
    console.error('verifySource failed', updateError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!updated || updated.length === 0) return { ok: false, error: 'This source is already verified' };

  await afterWrite(supabase, userId, 'scheme.verify_source', 'scheme_sources', row.id);
  return { ok: true };
}

export async function addRule(input: AddRuleInput): Promise<ActionResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = addRuleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { supabase, userId } = guard;
  const { schemeVersionId, ruleKind, ruleJson, sourceId, clauseReference } = parsed.data;

  const version = await loadVersion(supabase, schemeVersionId);
  if (!version.ok) return version;
  if (!canEditVersion(toSnapshot(version.row))) return { ok: false, error: LOCKED_ERROR };

  // A rule must cite a source attached to this same version.
  const { data: source, error: sourceError } = await supabase
    .from('scheme_sources')
    .select('id')
    .eq('id', sourceId)
    .eq('scheme_version_id', schemeVersionId)
    .maybeSingle();
  if (sourceError) {
    console.error('addRule failed', sourceError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!source) return { ok: false, error: 'Choose a source from this version' };

  const { data: created, error } = await supabase
    .from('scheme_rules')
    .insert({
      scheme_version_id: schemeVersionId,
      rule_kind: ruleKind,
      rule_json: ruleJson,
      source_id: sourceId,
      clause_reference: clauseReference,
    })
    .select('id')
    .single();
  if (error || !created) {
    console.error('addRule failed', error?.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  await afterWrite(supabase, userId, 'scheme.add_rule', 'scheme_rules', (created as { id: string }).id);
  return { ok: true };
}

export async function submitForReview(schemeVersionId: string): Promise<ActionResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = versionIdSchema.safeParse(schemeVersionId);
  if (!parsed.success) return { ok: false, error: 'Unknown version' };
  const { supabase, userId } = guard;

  const version = await loadVersion(supabase, parsed.data);
  if (!version.ok) return version;
  if (version.row.status !== 'draft') return { ok: false, error: DRAFT_ONLY_ERROR };

  const { data: moved, error: moveError } = await supabase
    .from('scheme_versions')
    .update({ status: 'in_review' })
    .eq('id', parsed.data)
    .eq('status', 'draft')
    .select('id');
  if (moveError) {
    console.error('submitForReview failed', moveError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  if (!moved || moved.length === 0) return { ok: false, error: DRAFT_ONLY_ERROR };

  const { error: schemeError } = await supabase
    .from('schemes')
    .update({ status: 'in_review' })
    .eq('id', version.row.scheme_id);
  if (schemeError) {
    console.error('submitForReview failed', schemeError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  await afterWrite(supabase, userId, 'scheme.submit_review', 'scheme_versions', parsed.data);
  return { ok: true };
}

export async function reviewVersion(input: ReviewInput): Promise<ActionResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { supabase, userId } = guard;
  const { schemeVersionId, decision, comment } = parsed.data;

  const version = await loadVersion(supabase, schemeVersionId);
  if (!version.ok) return version;
  if (version.row.status !== 'in_review') {
    return { ok: false, error: 'Only a version in review can be reviewed' };
  }

  const { error: eventError } = await supabase.from('scheme_review_events').insert({
    scheme_version_id: schemeVersionId,
    reviewer_user_id: userId,
    decision,
    comment,
  });
  if (eventError) {
    console.error('reviewVersion failed', eventError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  if (decision !== 'approved') {
    const { error: versionError } = await supabase
      .from('scheme_versions')
      .update({ status: 'draft' })
      .eq('id', schemeVersionId)
      .eq('status', 'in_review');
    const { error: schemeError } = await supabase
      .from('schemes')
      .update({ status: 'draft' })
      .eq('id', version.row.scheme_id);
    if (versionError || schemeError) {
      console.error('reviewVersion failed', versionError?.code ?? schemeError?.code);
      return { ok: false, error: GENERIC_ERROR };
    }
  }

  await afterWrite(supabase, userId, 'scheme.review', 'scheme_versions', schemeVersionId);
  return { ok: true };
}

export async function publishVersion(input: PublishInput): Promise<ActionResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { supabase, userId } = guard;
  const id = parsed.data.schemeVersionId;

  const version = await loadVersion(supabase, id);
  if (!version.ok) return version;

  const { data: sourceRows, error: sourceError } = await supabase
    .from('scheme_sources')
    .select('verified_at')
    .eq('scheme_version_id', id);
  const { count: ruleCount, error: ruleError } = await supabase
    .from('scheme_rules')
    .select('id', { count: 'exact', head: true })
    .eq('scheme_version_id', id);
  if (sourceError || ruleError) {
    console.error('publishVersion failed', sourceError?.code ?? ruleError?.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const sources = (sourceRows ?? []) as { verified_at: string | null }[];

  const gate = canPublishVersion({
    status: version.row.status,
    sourceCount: sources.length,
    unverifiedSourceCount: sources.filter((s) => s.verified_at === null).length,
    ruleCount: ruleCount ?? 0,
  });
  if (!gate.ok) return { ok: false, error: gate.reason };

  // Retire any previously published version first; the trigger allows published -> retired only.
  const { error: retireError } = await supabase
    .from('scheme_versions')
    .update({ status: 'retired' })
    .eq('scheme_id', version.row.scheme_id)
    .eq('status', 'published')
    .neq('id', id);
  if (retireError) {
    console.error('publishVersion failed', retireError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  const { error: publishError } = await supabase
    .from('scheme_versions')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'in_review');
  if (publishError) {
    console.error('publishVersion failed', publishError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  const { error: schemeError } = await supabase
    .from('schemes')
    .update({ status: 'published', current_version_id: id })
    .eq('id', version.row.scheme_id);
  if (schemeError) {
    console.error('publishVersion failed', schemeError.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  await afterWrite(supabase, userId, 'scheme.publish', 'scheme_versions', id);
  return { ok: true };
}

export async function retireScheme(input: IdInput): Promise<ActionResult> {
  const guard = await adminContext();
  if (!guard.ok) return guard;
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Unknown scheme' };
  const { supabase, userId } = guard;
  const schemeId = parsed.data.id;

  const { data: scheme, error: schemeError } = await supabase
    .from('schemes')
    .select('id, current_version_id')
    .eq('id', schemeId)
    .maybeSingle();
  if (schemeError) {
    console.error('retireScheme failed', schemeError.code);
    return { ok: false, error: GENERIC_ERROR };
  }
  const row = scheme as { id: string; current_version_id: string | null } | null;
  if (!row) return { ok: false, error: 'Scheme not found' };
  if (!row.current_version_id) return { ok: false, error: 'This scheme has no current version' };

  const version = await loadVersion(supabase, row.current_version_id);
  if (!version.ok) return version;
  if (!canRetireVersion(toSnapshot(version.row))) {
    return { ok: false, error: 'Only a published version can be retired' };
  }

  const { error: versionError } = await supabase
    .from('scheme_versions')
    .update({ status: 'retired' })
    .eq('id', version.row.id)
    .eq('status', 'published');
  const { error: updateError } = await supabase.from('schemes').update({ status: 'retired' }).eq('id', schemeId);
  if (versionError || updateError) {
    console.error('retireScheme failed', versionError?.code ?? updateError?.code);
    return { ok: false, error: GENERIC_ERROR };
  }

  await afterWrite(supabase, userId, 'scheme.retire', 'schemes', schemeId);
  return { ok: true };
}
