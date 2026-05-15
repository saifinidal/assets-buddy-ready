import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/loose";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Spribe is a TRANSFER wallet — balance lives at THRVEX during play.
 * This hook silently calls `spribe-withdraw` to pull any remaining
 * Spribe balance back into the user's main wallet on:
 *   - every route change (debounced via session cooldown)
 *   - app mount (login/refresh)
 *
 * It also exposes `pullSpribeBalance()` for explicit calls (e.g. before
 * launching a JILI/seamless game, or when closing the Spribe player).
 */
const COOLDOWN_MS = 15_000; // don't hammer THRVEX more than once per 15s

export function useSpribeBalanceSync() {
  const { isLoggedIn, currentUser, refreshProfile } = useAuth();
  const location = useLocation();
  const lastPullRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);

  const pullSpribeBalance = useCallback(
    async (opts: { force?: boolean } = {}) => {
      if (!isLoggedIn || !currentUser) return;
      if (inFlightRef.current) return;
      const now = Date.now();
      if (!opts.force && now - lastPullRef.current < COOLDOWN_MS) return;

      inFlightRef.current = true;
      lastPullRef.current = now;
      try {
        const { error } = await supabase.functions.invoke("spribe-withdraw", {
          body: {},
        });
        if (!error) {
          // Give callback a moment to credit the withdrawn balance
          await new Promise((r) => setTimeout(r, 700));

          // Fetch latest balance from DB
          const { data: prof } = await supabase
            .from("profiles")
            .select("balance")
            .eq("id", currentUser.profileId)
            .maybeSingle();
          const balanceAfter = Number(prof?.balance || 0);

          // Close any OPEN Spribe sessions for this user
          const { data: openRows } = await supabase
            .from("casino_sessions")
            .select("id, balance_before")
            .eq("profile_id", currentUser.profileId)
            .eq("provider_name", "Spribe")
            .eq("status", "open");

          if (openRows && openRows.length > 0) {
            await Promise.all(
              openRows.map((row: any) =>
                supabase
                  .from("casino_sessions")
                  .update({
                    balance_after: balanceAfter,
                    net_change: balanceAfter - Number(row.balance_before || 0),
                    status: "closed",
                    closed_at: new Date().toISOString(),
                  })
                  .eq("id", row.id)
              )
            );
          }

          // Refresh local balance from context
          await refreshProfile();
        }
      } catch (e) {
        // Silent — non-critical background sync
        console.debug("Spribe balance sync skipped:", e);
      } finally {
        inFlightRef.current = false;
      }
    },
    [isLoggedIn, currentUser, refreshProfile]
  );

  // Run on route change (skip while inside the Spribe player itself)
  useEffect(() => {
    if (!isLoggedIn) return;
    // Don't pull while user is actively in the Spribe game iframe
    if (location.pathname === "/play") return;
    pullSpribeBalance();
  }, [location.pathname, isLoggedIn, pullSpribeBalance]);

  return { pullSpribeBalance };
}
