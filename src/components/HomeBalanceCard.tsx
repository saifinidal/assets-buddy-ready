import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Plus, ArrowDownToLine, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/loose";
import { useCurrency } from "@/hooks/useSystemControls";

export function HomeBalanceCard() {
  const { isLoggedIn, currentUser, refreshProfile } = useAuth();
  const { symbol, format } = useCurrency();
  const [pulsing, setPulsing] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Realtime subscribe to this user's profile balance
  useEffect(() => {
    if (!currentUser?.profileId) return;
    const channel = supabase
      .channel(`profile_balance_${currentUser.profileId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${currentUser.profileId}`,
        },
        () => {
          setPulsing(true);
          refreshProfile();
          setTimeout(() => setPulsing(false), 1200);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.profileId, refreshProfile]);

  if (!isLoggedIn || !currentUser) return null;

  const balance = Number(currentUser.balance) || 0;

  return (
    <div className="px-3 py-2">
      <div
        className={`relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/8 to-accent/10 p-4 transition-all ${
          pulsing ? "ring-2 ring-primary/60 shadow-lg" : ""
        }`}
      >
        {/* Decorative blur blob */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/20 blur-2xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Live Balance
              </p>
              <button
                onClick={() => setHidden((h) => !h)}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={hidden ? "Show balance" : "Hide balance"}
              >
                {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                onClick={() => {
                  setPulsing(true);
                  refreshProfile();
                  setTimeout(() => setPulsing(false), 800);
                }}
                className="ml-auto text-muted-foreground hover:text-primary transition-colors"
                aria-label="Refresh balance"
              >
                <RefreshCw className={`h-3 w-3 ${pulsing ? "animate-spin" : ""}`} />
              </button>
            </div>
            <p className="font-display text-2xl md:text-3xl font-bold text-foreground leading-none break-all">
              {hidden ? `${symbol} ••••••` : format(balance, { decimals: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1.5 truncate">
              {currentUser.name} · ID {currentUser.id}
            </p>
          </div>
        </div>

        <div className="relative mt-3 flex gap-2">
          <Link
            to="/wallet"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors min-w-0"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Deposit</span>
          </Link>
          <Link
            to="/wallet"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary transition-colors min-w-0"
          >
            <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">Withdraw</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
