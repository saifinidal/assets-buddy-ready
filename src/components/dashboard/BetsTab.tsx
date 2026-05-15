import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Trophy, Target, BarChart3, Clock, Dices, ExternalLink } from "lucide-react";

interface Bet {
  id: string;
  match: string;
  selection: string;
  odds: number;
  stake: number;
  type: string;
  result: string;
  profit: number;
  date: string;
}

interface BetsTabProps {
  bets: Bet[];
  totalPL: number;
}

const filterOptions = [
  { id: "all", label: "All Bets" },
  { id: "pending", label: "Pending" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
] as const;

type FilterId = (typeof filterOptions)[number]["id"];

export function BetsTab({ bets, totalPL }: BetsTabProps) {
  const [filter, setFilter] = useState<FilterId>("all");

  const settledBets = bets.filter((b) => b.result !== "pending");
  const winRate = settledBets.length > 0
    ? Math.round((settledBets.filter((b) => b.result === "won").length / settledBets.length) * 100)
    : 0;
  const totalStake = bets.reduce((s, b) => s + (b.stake || 0), 0);
  const wonCount = bets.filter(b => b.result === "won").length;
  const lostCount = bets.filter(b => b.result === "lost").length;

  const filtered = bets.filter((b) => {
    if (filter === "all") return true;
    return b.result === filter;
  });

  return (
    <div className="space-y-5">
      {/* Quick link to full history page */}
      <div className="flex justify-end">
        <Link
          to="/bet-history"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/15 transition-colors"
        >
          Open Full History <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          {
            icon: BarChart3,
            label: "Total P&L",
            value: `${totalPL >= 0 ? "+" : ""}₹${totalPL.toLocaleString()}`,
            color: totalPL >= 0 ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]",
            iconBg: totalPL >= 0 ? "bg-[hsl(var(--live)/.1)]" : "bg-[hsl(var(--live-red)/.1)]",
            iconColor: totalPL >= 0 ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]",
          },
          {
            icon: Target,
            label: "Total Bets",
            value: bets.length.toString(),
            color: "text-foreground",
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
          },
          {
            icon: Trophy,
            label: "Win Rate",
            value: `${winRate}%`,
            color: "text-[hsl(var(--highlight))]",
            iconBg: "bg-[hsl(var(--highlight)/.1)]",
            iconColor: "text-[hsl(var(--highlight))]",
          },
          {
            icon: Dices,
            label: "Total Staked",
            value: `₹${totalStake.toLocaleString()}`,
            color: "text-foreground",
            iconBg: "bg-accent/10",
            iconColor: "text-accent",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-3.5 hover:border-border/80 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            <p className={`font-display text-lg font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Win/Loss Mini Bar */}
      {settledBets.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Win/Loss Ratio</p>
            <span className="text-[10px] text-muted-foreground">{wonCount}W · {lostCount}L</span>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary">
            <div className="bg-[hsl(var(--live))] rounded-l-full transition-all" style={{ width: `${winRate}%` }} />
            <div className="bg-[hsl(var(--live-red))] rounded-r-full transition-all" style={{ width: `${100 - winRate}%` }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              filter === opt.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Bet List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Dices className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No bets found</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              {filter === "all" ? "Place your first bet to see it here" : `No ${filter} bets yet`}
            </p>
          </div>
        )}
        {filtered.map((bet) => (
          <div
            key={bet.id}
            className="rounded-xl border border-border bg-card p-3.5 hover:bg-secondary/20 hover:border-border/80 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{bet.match}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      bet.type === "back"
                        ? "bg-[hsl(var(--back)/.15)] text-[hsl(var(--back))] border border-[hsl(var(--back)/.25)]"
                        : "bg-[hsl(var(--lay)/.15)] text-[hsl(var(--lay))] border border-[hsl(var(--lay)/.25)]"
                    }`}
                  >
                    {bet.type}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {bet.selection} @ <span className="font-bold text-foreground">{bet.odds}</span>
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Stake ₹{bet.stake.toLocaleString()}</p>
                {bet.result === "won" && (
                  <p className="text-sm font-bold text-[hsl(var(--live))] flex items-center gap-1 justify-end">
                    <TrendingUp className="h-3.5 w-3.5" />+₹{bet.profit.toLocaleString()}
                  </p>
                )}
                {bet.result === "lost" && (
                  <p className="text-sm font-bold text-[hsl(var(--live-red))] flex items-center gap-1 justify-end">
                    <TrendingDown className="h-3.5 w-3.5" />-₹{Math.abs(bet.profit).toLocaleString()}
                  </p>
                )}
                {bet.result === "pending" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--highlight)/.25)] bg-[hsl(var(--highlight)/.1)] px-2 py-0.5 text-[9px] font-bold text-[hsl(var(--highlight))]">
                    <Clock className="h-2.5 w-2.5" /> OPEN
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground">
                {bet.date ? new Date(bet.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
              </p>
              <p className="text-[9px] font-mono text-muted-foreground/60">ID: {bet.id.slice(0, 8)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
