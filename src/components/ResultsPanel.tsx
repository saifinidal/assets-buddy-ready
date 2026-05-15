import { RefreshCw, AlertCircle, Trophy } from "lucide-react";
import { useResultsList, type ResultsSport, type ResultItem } from "@/hooks/useResultsList";

/**
 * Decide the winner from two cricket-style score strings like "146/7" vs "70/10".
 * Returns 1 for team1 win, 2 for team2 win, 0 for tie/unknown.
 * Compares runs (the number before "/"). Higher runs wins.
 */
function decideCricketWinner(r1: string, r2: string): 0 | 1 | 2 {
  const parse = (s: string): number | null => {
    if (!s) return null;
    const m = s.match(/^(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };
  const a = parse(r1);
  const b = parse(r2);
  if (a == null || b == null) return 0;
  if (a > b) return 1;
  if (b > a) return 2;
  return 0;
}

/**
 * Decide soccer/tennis winner from numeric scores.
 */
function decideSimpleWinner(r1: string, r2: string): 0 | 1 | 2 {
  const a = parseInt(r1, 10);
  const b = parseInt(r2, 10);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  if (a > b) return 1;
  if (b > a) return 2;
  return 0;
}

function splitTeams(eventName: string): [string, string] {
  const parts = eventName.split(/\s+v\s+/i);
  return [(parts[0] || "").trim(), (parts[1] || "").trim()];
}

function ResultRow({ item, sport }: { item: ResultItem; sport: ResultsSport }) {
  const [team1, team2] = splitTeams(item.eventName);
  const winner =
    sport === "cricket"
      ? decideCricketWinner(item.resultItem1, item.resultItem2)
      : decideSimpleWinner(item.resultItem1, item.resultItem2);

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-secondary/30 px-3 py-1.5">
        <span className="text-[10px] font-medium text-muted-foreground truncate">
          {item.eventDate}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-bold text-highlight">
          <Trophy className="h-3 w-3" />
          FINAL
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span
            className={`flex-1 text-sm font-semibold truncate ${
              winner === 1 ? "text-live" : "text-foreground"
            }`}
          >
            {team1}
            {winner === 1 && <span className="ml-1 text-[10px] font-bold">✓</span>}
          </span>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {item.resultItem1}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`flex-1 text-sm font-semibold truncate ${
              winner === 2 ? "text-live" : "text-foreground"
            }`}
          >
            {team2}
            {winner === 2 && <span className="ml-1 text-[10px] font-bold">✓</span>}
          </span>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {item.resultItem2}
          </span>
        </div>
        {winner === 0 && (
          <div className="mt-1 text-[10px] text-muted-foreground italic">Tie / Pending</div>
        )}
      </div>
    </div>
  );
}

export function ResultsPanel({ sport }: { sport: ResultsSport }) {
  const { data, loading, error, refetch } = useResultsList(sport);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Live results — auto-updating
        </span>
        <button
          onClick={refetch}
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Refresh results"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>API Error: {error}</span>
        </div>
      )}

      {loading && data.today.length === 0 && data.yesterday.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : data.today.length === 0 && data.yesterday.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-3">🏆</span>
          <p className="text-sm font-medium text-muted-foreground">No results available</p>
        </div>
      ) : (
        <>
          {data.today.length > 0 && (
            <>
              <div className="mb-2 mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-live animate-pulse-live" />
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Today
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground">
                  ({data.today.length})
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {data.today.map((it, idx) => (
                  <ResultRow key={`today-${idx}`} item={it} sport={sport} />
                ))}
              </div>
            </>
          )}
          {data.yesterday.length > 0 && (
            <>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
                  Yesterday
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground">
                  ({data.yesterday.length})
                </span>
              </div>
              <div className="space-y-2">
                {data.yesterday.map((it, idx) => (
                  <ResultRow key={`yest-${idx}`} item={it} sport={sport} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
