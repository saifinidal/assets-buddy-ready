import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSystemControls } from "@/hooks/useSystemControls";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  useSkyExchMatches,
  type SkySport,
  type SkyEvent,
} from "@/hooks/useSkyExchMatches";
import { useMarketOdds, type MarketOddsRow } from "@/hooks/useMarketOdds";
import { useResultsEventNames } from "@/hooks/useResultsEventNames";
import { formatMatchTimeLabel } from "@/lib/matchTime";
import { ResultsPanel } from "@/components/ResultsPanel";

const sportTabs: { id: SkySport; label: string; icon: string }[] = [
  { id: "cricket", label: "Cricket", icon: "🏏" },
  { id: "soccer", label: "Football", icon: "⚽" },
  { id: "tennis", label: "Tennis", icon: "🎾" },
];

type ViewTab = "matches" | "results";

const AnnaExch = () => {
  const [sport, setSport] = useState<SkySport>("cricket");
  const [view, setView] = useState<ViewTab>("matches");
  const [expanded, setExpanded] = useState<number | null>(null);
  const { events, loading, error, refetch } = useSkyExchMatches(sport);

  // Show all events from the API. The results API is only used later by the
  // settlement function — not as a display gate (real matches don't appear in
  // results until they finish, but should still be listed for betting).
  const visible = events;

  // Single chronological list (matches the AnnaExch public listing):
  // In-Play first, then upcoming sorted by openDate ascending.
  const sorted = [...visible].sort((a, b) => {
    if (a.isInPlay !== b.isInPlay) return a.isInPlay ? -1 : 1;
    const ta = a.openDate ? new Date(a.openDate).getTime() : 0;
    const tb = b.openDate ? new Date(b.openDate).getTime() : 0;
    return ta - tb;
  });
  const inPlayCount = sorted.filter((e) => e.isInPlay).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-3 py-3 md:px-6 md:py-4 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-live animate-pulse-live" />
            <h1 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
              AnnaExch Live
            </h1>
            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {inPlayCount} LIVE
            </span>
          </div>
          <button
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={refetch}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Sport tabs */}
        <div className="mb-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {sportTabs.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSport(s.id);
                setExpanded(null);
              }}
              className={`touch-target flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-semibold transition-colors ${
                sport === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* View toggle: Matches | Results */}
        <div className="mb-3 flex gap-1 rounded-md bg-secondary/50 p-1 w-fit">
          {(["matches", "results"] as ViewTab[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`touch-target px-4 py-2 text-xs font-bold uppercase tracking-wide rounded transition-colors ${
                view === v
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "matches" ? "Matches" : "Results"}
            </button>
          ))}
        </div>

        {view === "results" ? (
          <ResultsPanel sport={sport as "cricket" | "tennis" | "soccer"} />
        ) : (
          <>
            {error && (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>API Error: {error}</span>
              </div>
            )}

            {loading && events.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">🏟️</span>
                <p className="text-sm font-medium text-muted-foreground">
                  No matches available
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sorted.map((ev) => (
                  <EventRow
                    key={ev.id}
                    event={ev}
                    sport={sport}
                    expanded={expanded === ev.id}
                    onToggle={() => setExpanded(expanded === ev.id ? null : ev.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

function SectionHeader({
  label,
  count,
  live,
}: {
  label: string;
  count: number;
  live?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      {live && <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />}
      <h2 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
        {label}
      </h2>
      <span className="text-[10px] font-bold text-muted-foreground">({count})</span>
    </div>
  );
}

function EventRow({
  event,
  sport,
  expanded,
  onToggle,
}: {
  event: SkyEvent;
  sport: SkySport;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 bg-secondary/30 px-3 py-1.5 text-left min-w-0"
      >
        <span className="flex-1 min-w-0 text-[10px] font-medium text-muted-foreground truncate">
          {event.competitionName}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {event.hasBookmaker && (
            <span className="rounded bg-highlight/15 px-1.5 py-0.5 text-[9px] font-bold text-highlight">
              BM
            </span>
          )}
          {event.hasFancy && (
            <span className="rounded bg-live/15 px-1.5 py-0.5 text-[9px] font-bold text-live">
              F
            </span>
          )}
          {event.isInPlay ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-live-red">
              <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatMatchTimeLabel(event.openDate)}</span>
          )}
        </div>
      </button>

      <div className="px-3 py-2 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
          <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">{event.team1}</span>
          <span className="text-xs text-muted-foreground shrink-0">vs</span>
          <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate text-right">
            {event.team2}
          </span>
        </div>

        {expanded && (
          <OddsPanel eventId={event.id} event={event} />
        )}
      </div>
    </div>
  );
}

function OddsPanel({
  eventId,
  event,
}: {
  eventId: number;
  event: SkyEvent;
}) {
  const { selections, loading } = useMarketOdds(eventId);
  const marketName = "Match Odds";

  const [picked, setPicked] = useState<{
    sel: MarketOddsRow;
    type: "back" | "lay";
    price: number;
  } | null>(null);
  const [stake, setStake] = useState("");
  const [placing, setPlacing] = useState(false);
  const { toast } = useToast();
  const { isLoggedIn, currentUser, refreshProfile } = useAuth();
  const { bettingEnabled } = useSystemControls();
  const navigate = useNavigate();

  const handlePlace = async () => {
    if (!picked || !stake || parseFloat(stake) <= 0) return;
    if (!bettingEnabled) {
      toast({ title: "Betting Disabled", description: "Betting has been temporarily disabled by the admin.", variant: "destructive" });
      return;
    }
    if (!isLoggedIn || !currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to place a bet",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setPlacing(true);
    try {
      const matchEvent = picked.sel.match_event || `${event.team1} vs ${event.team2}`;
      const { data, error } = await supabase.rpc("place_bet", {
        _match_id: String(eventId),
        _match_event: matchEvent,
        _selection: picked.sel.selection,
        _bet_type: picked.type,
        _odds: picked.price,
        _stake: parseFloat(stake),
      });
      const result = data as any;
      if (error || !result?.success) {
        toast({
          title: "Bet Failed",
          description: result?.error || error?.message || "Something went wrong",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bet Placed ✅",
          description: `${picked.type.toUpperCase()} ${picked.sel.selection} @ ${picked.price} — ₹${stake}`,
        });
        setPicked(null);
        setStake("");
        await refreshProfile();
        navigate("/bet-history");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  if (loading && selections.length === 0) {
    return (
      <div className="mt-3 flex items-center justify-center py-4">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {marketName}
        </span>
        <div className="flex gap-1 text-[9px] font-bold text-muted-foreground">
          <span className="w-[52px] text-center">BACK</span>
          <span className="w-[52px] text-center">LAY</span>
        </div>
      </div>

      {selections.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic py-1">Awaiting odds</p>
      ) : (
        selections.map((o) => {
          const suspended = o.is_suspended;
          const back = o.back_odd;
          const lay = o.lay_odd;
          const isPickedBack = picked?.sel.id === o.id && picked.type === "back";
          const isPickedLay = picked?.sel.id === o.id && picked.type === "lay";
          return (
            <div key={o.id} className="flex items-center justify-between gap-2 min-w-0 odds-row">
              <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
                {o.selection}
              </span>
              <div className="flex gap-1 shrink-0">
                <button
                  disabled={suspended || back == null}
                  onClick={() =>
                    back != null && setPicked({ sel: o, type: "back", price: back })
                  }
                  className={`touch-target h-9 w-[48px] sm:w-[52px] rounded-sm px-1 text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isPickedBack
                      ? "bg-back text-primary-foreground ring-2 ring-back/50"
                      : "bg-back/20 text-back hover:bg-back/30 active:bg-back/40"
                  }`}
                >
                  {back != null ? Number(back).toFixed(2) : "—"}
                </button>
                <button
                  disabled={suspended || lay == null}
                  onClick={() =>
                    lay != null && setPicked({ sel: o, type: "lay", price: lay })
                  }
                  className={`touch-target h-9 w-[48px] sm:w-[52px] rounded-sm px-1 text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isPickedLay
                      ? "bg-lay text-primary-foreground ring-2 ring-lay/50"
                      : "bg-lay/20 text-lay hover:bg-lay/30 active:bg-lay/40"
                  }`}
                >
                  {lay != null ? Number(lay).toFixed(2) : "—"}
                </button>
              </div>
            </div>
          );
        })
      )}

      {picked && (
        <div className="mt-3 rounded-md border border-border bg-secondary/20 p-2 space-y-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                picked.type === "back"
                  ? "bg-back/20 text-back"
                  : "bg-lay/20 text-lay"
              }`}
            >
              {picked.type}
            </span>
            <span className="flex-1 min-w-0 text-xs font-medium text-foreground truncate">
              {picked.sel.selection}
            </span>
            <span className="shrink-0 text-xs font-bold text-highlight">
              @ {picked.price.toFixed(2)}
            </span>
          </div>
          <div className="flex gap-2 min-w-0">
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="Stake ₹"
              className="flex-1 min-w-0 h-9 rounded-md bg-input px-3 text-sm text-foreground border border-border focus:border-primary outline-none"
            />
            <Button
              onClick={handlePlace}
              disabled={!stake || parseFloat(stake) <= 0 || placing}
              className="h-9 shrink-0"
            >
              {placing ? "..." : "Place"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setPicked(null)}
              className="h-9 px-2 shrink-0 text-muted-foreground"
            >
              ✕
            </Button>
          </div>
          <div className="flex gap-1">
            {[100, 500, 1000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setStake(String(v))}
                className="touch-target flex-1 min-w-0 h-9 rounded bg-secondary text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-surface-hover active:bg-surface"
              >
                {v >= 1000 ? `${v / 1000}K` : v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnaExch;
