import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/loose";
import {
  TrendingUp, TrendingDown, Loader2, RefreshCw, Clock, History as HistoryIcon,
} from "lucide-react";

interface CasinoSession {
  id: string;
  game_uid: string;
  game_name: string;
  provider_name: string;
  balance_before: number;
  balance_after: number | null;
  net_change: number | null;
  status: string;
  opened_at: string;
  closed_at: string | null;
}

const fmt = (n: number | null | undefined) =>
  `₹${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export function CasinoHistoryPanel() {
  const { currentUser, isLoggedIn } = useAuth();
  const [sessions, setSessions] = useState<CasinoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "win" | "loss" | "open">("all");

  const fetchSessions = async () => {
    if (!currentUser?.profileId) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("casino_sessions")
      .select("*")
      .eq("profile_id", currentUser.profileId)
      .order("opened_at", { ascending: false })
      .limit(200);
    setSessions((data as any) || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (!currentUser?.profileId) return;
    fetchSessions();

    const channel = supabase
      .channel(`casino_sessions_panel_${currentUser.profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "casino_sessions",
          filter: `profile_id=eq.${currentUser.profileId}`,
        },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.profileId]);

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
        <HistoryIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Login to see your casino history
        </p>
      </div>
    );
  }

  // Exclude sessions where balance_after is 0 or null (incomplete/abandoned)
  const validSessions = sessions.filter(
    (s) => s.balance_after != null && Number(s.balance_after) > 0
  );

  const totalNet = validSessions.reduce((s, x) => s + (Number(x.net_change) || 0), 0);
  const wins = validSessions.filter((s) => Number(s.net_change) > 0).length;
  const losses = validSessions.filter((s) => Number(s.net_change) < 0).length;

  const filtered = sessions.filter((s) => {
    if (filter === "all") return true;
    if (filter === "open") return s.status === "open";
    if (filter === "win")
      return s.balance_after != null && Number(s.balance_after) > 0 && Number(s.net_change) > 0;
    if (filter === "loss")
      return s.balance_after != null && Number(s.balance_after) > 0 && Number(s.net_change) < 0;
    return true;
  });

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <HistoryIcon className="h-3.5 w-3.5 text-primary" />
          Game Sessions
        </h2>
        <button
          onClick={() => {
            setRefreshing(true);
            fetchSessions();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[10px] font-bold text-foreground hover:bg-secondary/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
            Net P&amp;L
          </p>
          <p
            className={`text-sm font-bold ${
              totalNet >= 0
                ? "text-[hsl(var(--live))]"
                : "text-[hsl(var(--live-red))]"
            }`}
          >
            {totalNet >= 0 ? "+" : ""}
            {fmt(totalNet)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
            Sessions
          </p>
          <p className="text-sm font-bold text-foreground">{sessions.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
            W / L
          </p>
          <p className="text-sm font-bold text-foreground">
            <span className="text-[hsl(var(--live))]">{wins}</span>
            <span className="text-muted-foreground"> / </span>
            <span className="text-[hsl(var(--live-red))]">{losses}</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-2 flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {[
          { id: "all", label: "All" },
          { id: "win", label: "Wins" },
          { id: "loss", label: "Losses" },
          { id: "open", label: "Open" },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id as any)}
            className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
              filter === opt.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <HistoryIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-medium text-muted-foreground">
            No casino sessions yet
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            Launch a game to start tracking
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((s) => {
            const net = Number(s.net_change) || 0;
            const isOpen = s.status === "open";
            const positive = net > 0;
            const negative = net < 0;

            return (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-card p-2.5"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {s.game_name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                        {s.provider_name}
                      </span>
                      {isOpen ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-[hsl(var(--highlight)/.25)] bg-[hsl(var(--highlight)/.1)] px-1.5 py-0 text-[8px] font-bold text-[hsl(var(--highlight))]">
                          <Clock className="h-2 w-2" /> OPEN
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted-foreground">
                          Closed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {isOpen ? (
                      <p className="text-[9px] font-bold text-muted-foreground">
                        In Progress
                      </p>
                    ) : (
                      <p
                        className={`text-xs font-bold flex items-center gap-0.5 justify-end ${
                          positive
                            ? "text-[hsl(var(--live))]"
                            : negative
                            ? "text-[hsl(var(--live-red))]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {positive && <TrendingUp className="h-3 w-3" />}
                        {negative && <TrendingDown className="h-3 w-3" />}
                        {positive ? "+" : ""}
                        {fmt(net)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 rounded-md bg-secondary/40 px-2 py-1.5">
                  <div>
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">
                      Balance In
                    </p>
                    <p className="text-[11px] font-bold text-foreground">
                      {fmt(s.balance_before)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold uppercase text-muted-foreground">
                      Balance Out
                    </p>
                    <p className="text-[11px] font-bold text-foreground">
                      {s.balance_after != null ? fmt(s.balance_after) : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-border/50">
                  <p className="text-[9px] text-muted-foreground">
                    {new Date(s.opened_at).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {s.closed_at && (
                      <>
                        {" → "}
                        {new Date(s.closed_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
