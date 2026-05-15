import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  TrendingUp, TrendingDown, Trophy, Target, BarChart3, Clock,
  Dices, RefreshCw, History as HistoryIcon, CheckCircle2, XCircle, Megaphone, Ban, Loader2,
} from "lucide-react";

interface Bet {
  id: string;
  match_event: string;
  selection: string;
  bet_type: string;
  odds: number;
  stake: number;
  result: string;
  profit: number;
  created_at: string;
}

const filterOptions = [
  { id: "all", label: "All", icon: HistoryIcon },
  { id: "pending", label: "Open", icon: Clock },
  { id: "won", label: "Won", icon: CheckCircle2 },
  { id: "lost", label: "Lost", icon: XCircle },
  { id: "void", label: "Void", icon: RefreshCw },
  { id: "cancelled", label: "Cancelled", icon: Ban },
] as const;

// Compute potential winnings (gross payout) and profit-on-win
function getPotential(bet: { bet_type: string; stake: number; odds: number }) {
  const stake = Number(bet.stake) || 0;
  const odds = Number(bet.odds) || 1;
  if (bet.bet_type === "lay") {
    // Lay: profit-on-win = stake; risk = stake*(odds-1)
    return { profit: stake, payout: stake + stake * (odds - 1) };
  }
  // Back: profit-on-win = stake*(odds-1); payout = stake*odds
  const profit = stake * (odds - 1);
  return { profit, payout: stake + profit };
}

type FilterId = (typeof filterOptions)[number]["id"];

const BetHistory = () => {
  const { currentUser, isLoggedIn, loading: authLoading, refreshProfile } = useAuth();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const cancelBet = async (betId: string) => {
    if (!confirm("Cancel this bet? Your stake/liability will be refunded.")) return;
    setCancellingId(betId);
    try {
      const { data, error } = await supabase.rpc("cancel_bet" as any, { _bet_id: betId });
      if (error) throw error;
      const res = data as any;
      if (!res?.success) throw new Error(res?.error || "Cancel failed");
      toast({
        title: "Bet Cancelled",
        description: `Refunded ₹${Number(res.refund).toLocaleString()} to your balance`,
      });
      await refreshProfile();
      await fetchBets();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to cancel bet", variant: "destructive" });
    }
    setCancellingId(null);
  };

  const fetchBets = async () => {
    if (!currentUser?.profileId) return;
    const { data } = await supabase
      .from("bets")
      .select("*")
      .eq("profile_id", currentUser.profileId)
      .order("created_at", { ascending: false });
    setBets((data as any) || []);
    setLoading(false);
  };

  // Manual "Announce Results" — triggers settlement edge function
  const announceResults = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("annaexch-settle-results");
      if (error) throw error;
      const settled = (data as any)?.settled_count || 0;
      const voided = (data as any)?.voided_count || 0;
      if (settled || voided) {
        toast({
          title: "Results Announced ✅",
          description: `${settled} bets settled, ${voided} voided`,
        });
        await refreshProfile();
      } else {
        toast({ title: "No new results", description: "All settled bets are up to date" });
      }
      await fetchBets();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to fetch results", variant: "destructive" });
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (!currentUser?.profileId) return;
    fetchBets();

    // Realtime: when any of this user's bets is updated (e.g. settled), refresh list
    const channel = supabase
      .channel(`bets_${currentUser.profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bets",
          filter: `profile_id=eq.${currentUser.profileId}`,
        },
        (payload) => {
          // If a bet was just settled, show toast
          if (
            payload.eventType === "UPDATE" &&
            (payload.old as any)?.result === "pending" &&
            (payload.new as any)?.result !== "pending"
          ) {
            const b = payload.new as any;
            if (b.result === "won") {
              toast({
                title: "🏆 Bet Won!",
                description: `${b.selection} @ ${b.odds} — +₹${Number(b.profit).toLocaleString()}`,
              });
              refreshProfile();
            } else if (b.result === "lost") {
              toast({
                title: "Bet Lost",
                description: `${b.selection} @ ${b.odds}`,
                variant: "destructive",
              });
            } else if (b.result === "void") {
              toast({ title: "Bet Voided", description: `${b.selection} — refunded` });
              refreshProfile();
            }
          }
          fetchBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.profileId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const settled = bets.filter((b) => b.result !== "pending");
  const won = bets.filter((b) => b.result === "won");
  const lost = bets.filter((b) => b.result === "lost");
  const totalPL = bets.reduce((s, b) => s + (Number(b.profit) || 0), 0);
  const totalStake = bets.reduce((s, b) => s + (Number(b.stake) || 0), 0);
  const winRate = settled.length > 0 ? Math.round((won.length / settled.length) * 100) : 0;

  const filtered = bets.filter((b) => filter === "all" || b.result === filter);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
              Bet History
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track all your bets and result announcements
            </p>
          </div>
          <button
            onClick={announceResults}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {refreshing ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Megaphone className="h-3.5 w-3.5" />
            )}
            {refreshing ? "Checking..." : "Announce Results"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
          {[
            {
              icon: BarChart3, label: "Total P&L",
              value: `${totalPL >= 0 ? "+" : ""}₹${totalPL.toLocaleString()}`,
              color: totalPL >= 0 ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]",
              iconBg: totalPL >= 0 ? "bg-[hsl(var(--live)/.1)]" : "bg-[hsl(var(--live-red)/.1)]",
              iconColor: totalPL >= 0 ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]",
            },
            {
              icon: Target, label: "Total Bets", value: bets.length.toString(),
              color: "text-foreground", iconBg: "bg-primary/10", iconColor: "text-primary",
            },
            {
              icon: Trophy, label: "Win Rate", value: `${winRate}%`,
              color: "text-[hsl(var(--highlight))]",
              iconBg: "bg-[hsl(var(--highlight)/.1)]",
              iconColor: "text-[hsl(var(--highlight))]",
            },
            {
              icon: Dices, label: "Total Staked", value: `₹${totalStake.toLocaleString()}`,
              color: "text-foreground", iconBg: "bg-accent/10", iconColor: "text-accent",
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.iconBg}`}>
                  <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className={`font-display text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Win/Loss Bar */}
        {settled.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-3.5 mb-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Win/Loss Ratio
              </p>
              <span className="text-[10px] text-muted-foreground">
                {won.length}W · {lost.length}L
              </span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary">
              <div className="bg-[hsl(var(--live))] transition-all" style={{ width: `${winRate}%` }} />
              <div className="bg-[hsl(var(--live-red))] transition-all" style={{ width: `${100 - winRate}%` }} />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {filterOptions.map((opt) => {
            const count =
              opt.id === "all" ? bets.length : bets.filter((b) => b.result === opt.id).length;
            return (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`touch-target shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                  filter === opt.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <opt.icon className="h-3 w-3" />
                {opt.label}
                <span className="text-[9px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Bet List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Dices className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No bets found</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              {filter === "all" ? "Place your first bet to see it here" : `No ${filter} bets`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((bet) => (
              <div
                key={bet.id}
                className="rounded-xl border border-border bg-card p-3.5 hover:bg-secondary/20 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {bet.match_event}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          bet.bet_type === "back"
                            ? "bg-[hsl(var(--back)/.15)] text-[hsl(var(--back))] border border-[hsl(var(--back)/.25)]"
                            : "bg-[hsl(var(--lay)/.15)] text-[hsl(var(--lay))] border border-[hsl(var(--lay)/.25)]"
                        }`}
                      >
                        {bet.bet_type}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {bet.selection} @{" "}
                        <span className="font-bold text-foreground">{bet.odds}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">
                      Stake ₹{Number(bet.stake).toLocaleString()}
                    </p>
                    {bet.result === "won" && (
                      <p className="text-sm font-bold text-[hsl(var(--live))] flex items-center gap-1 justify-end">
                        <TrendingUp className="h-3.5 w-3.5" />+₹
                        {Number(bet.profit).toLocaleString()}
                      </p>
                    )}
                    {bet.result === "lost" && (
                      <p className="text-sm font-bold text-[hsl(var(--live-red))] flex items-center gap-1 justify-end">
                        <TrendingDown className="h-3.5 w-3.5" />-₹
                        {Math.abs(Number(bet.profit)).toLocaleString()}
                      </p>
                    )}
                    {bet.result === "pending" && (
                      <div className="flex flex-col items-end gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--highlight)/.25)] bg-[hsl(var(--highlight)/.1)] px-2 py-0.5 text-[9px] font-bold text-[hsl(var(--highlight))]">
                          <Clock className="h-2.5 w-2.5" /> OPEN
                        </span>
                        <p className="text-[10px] font-bold text-[hsl(var(--live))] flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Win ₹{getPotential(bet).profit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    {bet.result === "void" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                        <RefreshCw className="h-2.5 w-2.5" /> VOID
                      </span>
                    )}
                    {bet.result === "cancelled" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                        <Ban className="h-2.5 w-2.5" /> CANCELLED
                      </span>
                    )}
                  </div>
                </div>
                {bet.result === "pending" && (
                  <div className="flex items-center justify-between gap-2 mb-2 rounded-lg bg-secondary/40 px-2.5 py-1.5">
                    <div className="text-[10px] text-muted-foreground">
                      Potential payout:{" "}
                      <span className="font-bold text-foreground">
                        ₹{getPotential(bet).payout.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      onClick={() => cancelBet(bet.id)}
                      disabled={cancellingId === bet.id}
                      className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--live-red)/.3)] bg-[hsl(var(--live-red)/.1)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--live-red))] hover:bg-[hsl(var(--live-red)/.2)] transition-colors disabled:opacity-50"
                    >
                      {cancellingId === bet.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Ban className="h-3 w-3" />
                      )}
                      Cancel
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground">
                    {bet.created_at
                      ? new Date(bet.created_at).toLocaleString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : ""}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/60">
                    ID: {bet.id.slice(0, 8)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default BetHistory;
