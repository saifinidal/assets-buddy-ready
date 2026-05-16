import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: CORS });

async function getBalance(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? Number(data.balance || 0) : null;
}

export const Route = createFileRoute("/api/public/callback")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      // Balance check
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get("action");
        const userId = url.searchParams.get("userid") || url.searchParams.get("user_id");

        if (action !== "get_balance" || !userId) {
          return json({ code: 1, msg: "Missing or invalid params" }, 400);
        }

        try {
          const bal = await getBalance(userId);
          if (bal === null) return json({ code: 1, msg: "Player not found" }, 404);
          return json({ balance: bal.toFixed(2) });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "DB error";
          return json({ code: 1, msg }, 500);
        }
      },

      // Bet/Win update
      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try {
          body = await request.json();
        } catch {
          return json({ code: 1, msg: "Invalid JSON" }, 400);
        }

        const userId = String(body.user_id || body.userid || "");
        const bet = Number(body.bet_amount || 0);
        const win = Number(body.win_amount || 0);
        const gameName = String(body.game_name || "");
        const provider = String(body.provider || "");

        if (!userId) return json({ code: 1, msg: "Missing user_id" }, 400);
        if (!Number.isFinite(bet) || !Number.isFinite(win) || bet < 0 || win < 0) {
          return json({ code: 1, msg: "Invalid amounts" }, 400);
        }

        const net = win - bet;

        try {
          const current = await getBalance(userId);
          if (current === null) return json({ code: 1, msg: "Player not found" }, 404);

          if (net < 0 && current < Math.abs(net)) {
            return json({ code: 1, msg: "Insufficient balance" }, 400);
          }

          const newBalance = current + net;

          const { error: updErr } = await supabaseAdmin
            .from("profiles")
            .update({ balance: newBalance })
            .eq("id", userId);
          if (updErr) throw updErr;

          // Best-effort transaction log (ignore if table absent)
          try {
            await (supabaseAdmin as any).from("casino_transactions").insert({
              profile_id: userId,
              bet_amount: bet,
              win_amount: win,
              net_amount: net,
              balance_after: newBalance,
              game_name: gameName,
              provider_name: provider,
            });
          } catch {
            /* table optional */
          }

          return json({ code: 0, balance: newBalance.toFixed(2) });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "DB error";
          return json({ code: 1, msg }, 500);
        }
      },
    },
  },
});
