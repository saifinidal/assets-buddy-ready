import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/loose";

/**
 * Tracks a casino game session: balance before launch, balance after game closes,
 * and the net change. Stored in `casino_sessions` table.
 */
export function useCasinoSession() {
  const sessionIdRef = useRef<string | null>(null);

  const openSession = useCallback(
    async (params: {
      profileId: string;
      gameUid: string;
      gameName: string;
      providerName: string;
      balanceBefore: number;
    }) => {
      try {
        const { data, error } = await supabase
          .from("casino_sessions")
          .insert({
            profile_id: params.profileId,
            game_uid: params.gameUid,
            game_name: params.gameName,
            provider_name: params.providerName,
            balance_before: params.balanceBefore,
            status: "open",
          })
          .select("id")
          .single();
        if (error) throw error;
        sessionIdRef.current = data.id;
        return data.id;
      } catch (e) {
        console.error("openSession failed:", e);
        return null;
      }
    },
    []
  );

  const closeSession = useCallback(
    async (params: { profileId: string; balanceAfter: number }) => {
      const id = sessionIdRef.current;
      if (!id) return;
      try {
        // Read balance_before from row to compute net
        const { data: row } = await supabase
          .from("casino_sessions")
          .select("balance_before")
          .eq("id", id)
          .maybeSingle();
        const before = Number(row?.balance_before || 0);
        const after = Number(params.balanceAfter || 0);
        await supabase
          .from("casino_sessions")
          .update({
            balance_after: after,
            net_change: after - before,
            status: "closed",
            closed_at: new Date().toISOString(),
          })
          .eq("id", id);
      } catch (e) {
        console.error("closeSession failed:", e);
      } finally {
        sessionIdRef.current = null;
      }
    },
    []
  );

  return { openSession, closeSession };
}
