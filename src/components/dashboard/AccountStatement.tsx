import { ArrowDownCircle, ArrowUpCircle, Trophy, Minus, Search, FileText, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface StatementEntry {
  id: string;
  description: string;
  type: string;
  credit: number;
  debit: number;
  balance: number;
  created_at: string;
}

const filterOptions = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
  { id: "bet", label: "Bets" },
  { id: "bonus", label: "Bonus" },
] as const;

type FilterId = (typeof filterOptions)[number]["id"];

function getTypeIcon(type: string) {
  switch (type) {
    case "deposit": return <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--live))]" />;
    case "withdrawal": return <ArrowUpCircle className="h-4 w-4 text-[hsl(var(--live-red))]" />;
    case "bet_win": return <Trophy className="h-4 w-4 text-[hsl(var(--live))]" />;
    case "bet_loss": return <Minus className="h-4 w-4 text-[hsl(var(--live-red))]" />;
    default: return <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--highlight))]" />;
  }
}

function getTypeBadge(type: string) {
  const styles: Record<string, string> = {
    deposit: "bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))] border-[hsl(var(--live)/.2)]",
    withdrawal: "bg-[hsl(var(--live-red)/.1)] text-[hsl(var(--live-red))] border-[hsl(var(--live-red)/.2)]",
    bet_win: "bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))] border-[hsl(var(--live)/.2)]",
    bet_loss: "bg-[hsl(var(--live-red)/.1)] text-[hsl(var(--live-red))] border-[hsl(var(--live-red)/.2)]",
    bonus: "bg-[hsl(var(--highlight)/.1)] text-[hsl(var(--highlight))] border-[hsl(var(--highlight)/.2)]",
  };
  return styles[type] || "bg-secondary text-muted-foreground border-border";
}

export function AccountStatement({ profileId, transactions }: { profileId?: string; transactions: StatementEntry[] }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((entry) => {
    const matchesFilter = filter === "all" || (filter === "bet" ? (entry.type === "bet_win" || entry.type === "bet_loss") : entry.type === filter);
    const matchesSearch = !search || entry.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalCredit = filtered.reduce((s, e) => s + (e.credit || 0), 0);
  const totalDebit = filtered.reduce((s, e) => s + (e.debit || 0), 0);
  const netFlow = totalCredit - totalDebit;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--live))]" />
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Credit</p>
          </div>
          <p className="font-display text-lg font-bold text-[hsl(var(--live))]">+₹{totalCredit.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-[hsl(var(--live-red))]" />
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Debit</p>
          </div>
          <p className="font-display text-lg font-bold text-[hsl(var(--live-red))]">-₹{totalDebit.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Net</p>
          </div>
          <p className={`font-display text-lg font-bold ${netFlow >= 0 ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]"}`}>
            {netFlow >= 0 ? "+" : ""}₹{netFlow.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 rounded-xl border-2 text-sm"
          />
        </div>
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
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_90px] gap-1 bg-secondary/50 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground border-b border-border">
          <span>Description</span>
          <span className="text-right">Credit</span>
          <span className="text-right">Debit</span>
          <span className="text-right">Balance</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
            </div>
          )}
          {filtered.map((entry) => (
            <div key={entry.id} className="grid grid-cols-[1fr_80px_80px_90px] gap-1 px-4 py-3 items-center hover:bg-secondary/20 transition-colors group">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 group-hover:bg-secondary transition-colors shrink-0">
                  {getTypeIcon(entry.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">{entry.description}</p>
                    <span className={`shrink-0 inline-flex rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase ${getTypeBadge(entry.type)}`}>
                      {entry.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {entry.created_at ? new Date(entry.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
              <p className={`text-xs font-bold text-right tabular-nums ${(entry.credit || 0) > 0 ? "text-[hsl(var(--live))]" : "text-muted-foreground/40"}`}>
                {(entry.credit || 0) > 0 ? `+₹${entry.credit.toLocaleString()}` : "—"}
              </p>
              <p className={`text-xs font-bold text-right tabular-nums ${(entry.debit || 0) > 0 ? "text-[hsl(var(--live-red))]" : "text-muted-foreground/40"}`}>
                {(entry.debit || 0) > 0 ? `-₹${entry.debit.toLocaleString()}` : "—"}
              </p>
              <p className="text-xs font-bold text-foreground text-right tabular-nums">₹{(entry.balance || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
          </div>
        )}
        {filtered.map((entry) => (
          <div key={entry.id} className="rounded-xl border border-border bg-card p-3.5 hover:bg-secondary/20 transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 shrink-0">
                {getTypeIcon(entry.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{entry.description}</p>
                  <span className={`shrink-0 inline-flex rounded-md border px-1.5 py-0.5 text-[8px] font-bold uppercase ${getTypeBadge(entry.type)}`}>
                    {entry.type.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {entry.created_at ? new Date(entry.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/50">
              <div className="flex gap-4">
                <div>
                  <p className="text-[8px] font-bold uppercase text-muted-foreground">Credit</p>
                  <p className={`text-xs font-bold tabular-nums ${(entry.credit || 0) > 0 ? "text-[hsl(var(--live))]" : "text-muted-foreground/40"}`}>
                    {(entry.credit || 0) > 0 ? `+₹${entry.credit.toLocaleString()}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] font-bold uppercase text-muted-foreground">Debit</p>
                  <p className={`text-xs font-bold tabular-nums ${(entry.debit || 0) > 0 ? "text-[hsl(var(--live-red))]" : "text-muted-foreground/40"}`}>
                    {(entry.debit || 0) > 0 ? `-₹${entry.debit.toLocaleString()}` : "—"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold uppercase text-muted-foreground">Balance</p>
                <p className="text-sm font-bold text-foreground tabular-nums">₹{(entry.balance || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
