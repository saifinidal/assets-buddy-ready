import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSkyExchMatches, type SkySport, type SkyEvent } from "@/hooks/useSkyExchMatches";
import { useMarketOddsBulk, type MarketOddsRow } from "@/hooks/useMarketOdds";
import { useResultsEventNames } from "@/hooks/useResultsEventNames";
import { formatMatchTimeLabel } from "@/lib/matchTime";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSystemControls } from "@/hooks/useSystemControls";

const sportFilters: { id: SkySport | "all"; label: string; icon: string }[] = [
  { id: "all", label: "All", icon: "🔥" },
  { id: "cricket", label: "Cricket", icon: "🏏" },
  { id: "soccer", label: "Football", icon: "⚽" },
  { id: "tennis", label: "Tennis", icon: "🎾" },
];

type SelectedBet = {
  matchId: string;
  matchEvent: string;
  selection: string;
  type: "back" | "lay";
  odds: number;
};

const InPlay = () => {
  const [activeSport, setActiveSport] = useState<SkySport | "all">("all");

  // Fetch from all sports in parallel hooks
  const cricket = useSkyExchMatches("cricket");
  const soccer = useSkyExchMatches("soccer");
  const tennis = useSkyExchMatches("tennis");

  const allEvents: (SkyEvent & { sport: SkySport })[] = useMemo(() => {
    const merge: (SkyEvent & { sport: SkySport })[] = [];
    cricket.events.forEach((e) => merge.push({ ...e, sport: "cricket" }));
    soccer.events.forEach((e) => merge.push({ ...e, sport: "soccer" }));
    tennis.events.forEach((e) => merge.push({ ...e, sport: "tennis" }));
    return merge;
  }, [cricket.events, soccer.events, tennis.events]);

  // In-Play first, then upcoming (by openDate). Show both like the public AnnaExch list.
  const sortedEvents = useMemo(() => {
    const arr = [...allEvents];
    arr.sort((a, b) => {
      if (a.isInPlay !== b.isInPlay) return a.isInPlay ? -1 : 1;
      const ta = a.openDate ? new Date(a.openDate).getTime() : 0;
      const tb = b.openDate ? new Date(b.openDate).getTime() : 0;
      return ta - tb;
    });
    return arr;
  }, [allEvents]);

  const liveEvents = useMemo(
    () => sortedEvents.filter((e) => e.isInPlay),
    [sortedEvents]
  );

  const filtered = useMemo(
    () => (activeSport === "all" ? sortedEvents : sortedEvents.filter((e) => e.sport === activeSport)),
    [sortedEvents, activeSport]
  );

  const eventIds = useMemo(() => filtered.map((e) => e.id), [filtered]);
  const { rowsByEvent } = useMarketOddsBulk(eventIds);

  // Auto-seed odds when there are visible live events without DB odds (debounced).
  useEffect(() => {
    if (filtered.length === 0) return;
    const missing = filtered.filter((e) => !rowsByEvent[String(e.id)]?.length);
    if (missing.length === 0) return;
    const t = setTimeout(() => {
      supabase.functions.invoke("seed-market-odds").catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, [filtered, rowsByEvent]);

  const loading = cricket.loading && soccer.loading && tennis.loading && allEvents.length === 0;
  const error = cricket.error || soccer.error || tennis.error;

  const refetchAll = () => {
    cricket.refetch();
    soccer.refetch();
    tennis.refetch();
  };

  const { currentUser, isLoggedIn, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [stake, setStake] = useState("");
  const [placing, setPlacing] = useState(false);

  const handleOddsClick = (
    matchId: string,
    matchEvent: string,
    selection: string,
    type: "back" | "lay",
    odds: number
  ) => {
    setSelectedBet({ matchId, matchEvent, selection, type, odds });
    setStake("");
  };

  const potentialProfit =
    selectedBet && stake
      ? selectedBet.type === "back"
        ? parseFloat((parseFloat(stake) * (selectedBet.odds - 1)).toFixed(2))
        : parseFloat(stake)
      : 0;

  const liability =
    selectedBet && stake
      ? selectedBet.type === "lay"
        ? parseFloat((parseFloat(stake) * (selectedBet.odds - 1)).toFixed(2))
        : parseFloat(stake)
      : 0;

  const { bettingEnabled } = useSystemControls();

  const handlePlaceBet = async () => {
    if (!selectedBet || !stake || parseFloat(stake) <= 0) return;
    if (!bettingEnabled) {
      toast({ title: "Betting Disabled", description: "Betting has been temporarily disabled by the admin.", variant: "destructive" });
      return;
    }
    if (!isLoggedIn || !currentUser) {
      toast({ title: "Login Required", description: "Please login to place a bet", variant: "destructive" });
      navigate("/login");
      return;
    }
    setPlacing(true);
    try {
      const { data, error } = await supabase.rpc("place_bet", {
        _match_id: selectedBet.matchId,
        _match_event: selectedBet.matchEvent,
        _selection: selectedBet.selection,
        _bet_type: selectedBet.type,
        _odds: selectedBet.odds,
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
          title: "Bet Placed! ✅",
          description: `${selectedBet.type.toUpperCase()} ${selectedBet.selection} @ ${selectedBet.odds} — Stake ₹${stake}`,
        });
        setSelectedBet(null);
        setStake("");
        await refreshProfile();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-5xl px-3 py-3 md:px-6 md:py-4 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-live animate-pulse-live" />
            <h1 className="font-display text-lg font-bold uppercase tracking-wide text-foreground">In-Play</h1>
            <span className="rounded bg-live/15 px-2 py-0.5 text-[10px] font-bold text-live-red">
              {liveEvents.filter(e => activeSport === "all" || e.sport === activeSport).length} LIVE
            </span>
            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {filtered.length} TOTAL
            </span>
          </div>
          <button className="text-muted-foreground hover:text-primary transition-colors" onClick={refetchAll}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Sport Filter Tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto scrollbar-hide">
          {sportFilters.map((sport) => {
            const count =
              sport.id === "all"
                ? sortedEvents.length
                : sortedEvents.filter((e) => e.sport === sport.id).length;
            return (
              <button
                key={sport.id}
                onClick={() => setActiveSport(sport.id)}
                className={`touch-target flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-semibold transition-colors ${
                  activeSport === sport.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>{sport.icon}</span>
                {sport.label}
                <span className="text-[9px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>API Error: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {filtered.map((ev) => (
                <MatchCard
                  key={ev.id}
                  event={ev}
                  selections={rowsByEvent[String(ev.id)] || []}
                  selectedBet={selectedBet}
                  onOddsClick={handleOddsClick}
                />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">🏟️</span>
                <p className="text-sm font-medium text-muted-foreground">No matches available</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">Check back shortly</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bet Slip */}
      {selectedBet && (
        <div className="landscape-betslip fixed bottom-16 left-0 right-0 md:bottom-0 z-40 border-t border-border bg-card p-3 md:mx-auto md:max-w-md md:rounded-t-xl md:border-x shadow-lg"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Bet Slip</h4>
            <button
              onClick={() => setSelectedBet(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕ Close
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                selectedBet.type === "back" ? "bg-back/20 text-back" : "bg-lay/20 text-lay"
              }`}
            >
              {selectedBet.type}
            </span>
            <span className="text-sm font-medium text-foreground truncate">{selectedBet.selection}</span>
            <span className="text-sm font-bold text-highlight ml-auto">@ {selectedBet.odds.toFixed(2)}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground mb-0.5 block">Stake (₹)</label>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                placeholder="Enter stake"
                className="w-full h-10 rounded-md bg-input px-3 text-sm text-foreground border border-border focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-1 items-end flex-wrap">
              {[100, 500, 1000, 5000].map((val) => (
                <button
                  key={val}
                  onClick={() => setStake(String(val))}
                  className="h-10 sm:h-9 flex-1 sm:flex-none min-w-[48px] rounded bg-secondary px-2.5 text-[11px] font-bold text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
                >
                  {val >= 1000 ? `${val / 1000}K` : val}
                </button>
              ))}
            </div>
          </div>
          {stake && parseFloat(stake) > 0 && (
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">
                {selectedBet.type === "back" ? "Potential Profit" : "Liability"}:
              </span>
              <span className={`font-bold ${selectedBet.type === "back" ? "text-live" : "text-live-red"}`}>
                {selectedBet.type === "back" ? "+" : "-"}₹
                {selectedBet.type === "back" ? potentialProfit : liability}
              </span>
            </div>
          )}
          <Button
            variant="default"
            className="w-full font-semibold"
            disabled={!stake || parseFloat(stake) <= 0 || placing}
            onClick={handlePlaceBet}
          >
            {placing ? "Placing..." : `Place ${selectedBet.type === "back" ? "Back" : "Lay"} Bet`}
          </Button>
        </div>
      )}
      <BottomNav />
    </div>
  );
};

function MatchCard({
  event,
  selections,
  selectedBet,
  onOddsClick,
}: {
  event: SkyEvent & { sport: SkySport };
  selections: MarketOddsRow[];
  selectedBet: SelectedBet | null;
  onOddsClick: (
    matchId: string,
    matchEvent: string,
    selection: string,
    type: "back" | "lay",
    odds: number
  ) => void;
}) {
  const matchEvent = `${event.team1} vs ${event.team2}`;
  const matchId = String(event.id);
  const sportIcon = event.sport === "cricket" ? "🏏" : event.sport === "soccer" ? "⚽" : "🎾";

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/20">
      <div className="flex items-center justify-between gap-2 bg-secondary/30 px-3 py-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm">{sportIcon}</span>
          <span className="text-[10px] font-medium text-muted-foreground truncate">
            {event.competitionName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {event.hasBookmaker && (
            <span className="rounded bg-highlight/15 px-1.5 py-0.5 text-[9px] font-bold text-highlight">BM</span>
          )}
          {event.hasFancy && (
            <span className="rounded bg-live/15 px-1.5 py-0.5 text-[9px] font-bold text-live">F</span>
          )}
          {event.isInPlay ? (
            <span className="flex items-center gap-1 text-[10px] font-bold text-live-red">
              <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />
              LIVE
            </span>
          ) : (
            <span className="text-[10px] font-medium text-muted-foreground">{formatMatchTimeLabel(event.openDate)}</span>
          )}
        </div>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground truncate">{event.team1}</span>
          <span className="text-xs text-muted-foreground mx-2">vs</span>
          <span className="text-sm font-semibold text-foreground truncate text-right">{event.team2}</span>
        </div>
      </div>

      <div className="px-3 py-2 space-y-1">
        {selections.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic py-1 text-center">Awaiting odds…</p>
        ) : (
          selections.map((s) => {
            const isBack =
              selectedBet?.matchId === matchId &&
              selectedBet?.selection === s.selection &&
              selectedBet?.type === "back";
            const isLay =
              selectedBet?.matchId === matchId &&
              selectedBet?.selection === s.selection &&
              selectedBet?.type === "lay";
            const suspended = s.is_suspended;
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 odds-row">
                <span className="flex-1 text-xs font-medium text-foreground truncate">{s.selection}</span>
                <div className="flex gap-1">
                  <button
                    disabled={suspended}
                    onClick={() => onOddsClick(matchId, matchEvent, s.selection, "back", Number(s.back_odd))}
                    className={`touch-target h-9 min-w-[52px] rounded-sm px-2 text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      isBack
                        ? "bg-back text-primary-foreground ring-2 ring-back/50 scale-105"
                        : "bg-back/20 text-back hover:bg-back/30 active:bg-back/40"
                    }`}
                  >
                    {Number(s.back_odd).toFixed(2)}
                  </button>
                  <button
                    disabled={suspended}
                    onClick={() => onOddsClick(matchId, matchEvent, s.selection, "lay", Number(s.lay_odd))}
                    className={`touch-target h-9 min-w-[52px] rounded-sm px-2 text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      isLay
                        ? "bg-lay text-primary-foreground ring-2 ring-lay/50 scale-105"
                        : "bg-lay/20 text-lay hover:bg-lay/30 active:bg-lay/40"
                    }`}
                  >
                    {Number(s.lay_odd).toFixed(2)}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default InPlay;
