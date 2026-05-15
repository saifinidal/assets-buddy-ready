import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/loose";

export type AuditMeta = Record<string, unknown> | null | undefined;

/**
 * Records a sensitive admin/agent action to public.audit_logs via the
 * SECURITY DEFINER `log_admin_action` RPC. Fire-and-forget — failures are
 * logged to the console but never block the calling UI flow.
 */
export function useAuditLog() {
  return useCallback(
    async (
      action: string,
      summary: string,
      opts?: { targetType?: string; targetId?: string | null; metadata?: AuditMeta }
    ) => {
      try {
        const { error } = await supabase.rpc("log_admin_action", {
          _action: action,
          _summary: summary,
          _target_type: opts?.targetType ?? undefined,
          _target_id: opts?.targetId ? String(opts.targetId) : undefined,
          _metadata: (opts?.metadata as any) ?? null,
        });
        if (error) console.warn("[audit] log failed:", error.message);
      } catch (err) {
        console.warn("[audit] log threw:", err);
      }
    },
    []
  );
}

export interface AuditLogRow {
  id: string;
  created_at: string;
  actor_profile_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  summary: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
}
