import type { createSupabaseServerClient } from '@/lib/supabase/server';

export type AdminServerClient = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export type AdminAuditInput = {
  actorUserId: string;
  action: string;
  targetTable: string;
  targetId: string | null;
};

/**
 * Appends one row to admin_audit_logs. Records what kind of change was made and by whom;
 * never the values written.
 */
export async function recordAdminAudit(supabase: AdminServerClient, input: AdminAuditInput): Promise<void> {
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: input.actorUserId,
    action: input.action,
    target_table: input.targetTable,
    target_id: input.targetId,
  });
  if (error) {
    console.error('recordAdminAudit failed', error.code);
  }
}
