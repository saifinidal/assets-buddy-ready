import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Tv, BarChart3, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useSkyExchMatches, synthesizeOdds, type SkySport } from "@/hooks/useSkyExchMatches";

// ─── Types ───────────────────────────────────────────────────
interface FancyMarket {
  id: string;
  name: string;
  noValue: number;
  noOdds: number;
  yesValue: number;
  yesOdds: number;
  isSuspended?: boolean;
}

interface BallEvent {
  over: string;
  result: string; // "1","4","6","W","0","2","•"
}

// ─── Mock Data ───────────────────────────────────────────────
const matchData: Record<string, {
  sport: string; sportIcon: string; league: string;
  team1: string; team2: string;
  score1: string; score2: string; status: string;
  team1Back: number; team1Lay: number;
  drawBack?: number; drawLay?: number;
  team2Back: number; team2Lay: number;
  tv: boolean; bm: boolean; fancy: boolean;
  overs?: string; runRate?: string; reqRate?: string;
  lastWicket?: string; partnership?: string;
  toss?: string; venue?: string;
}> = {
  "1": {
    sport: "cricket", sportIcon: "🏏", league: "ICC T20 World Cup",
    team1: "India", team2: "Australia",
    score1: "185/4 (18.2)", score2: "142/3 (16.0)",
    status: "India need 44 runs from 10 balls",
    team1Back: 1.35, team1Lay: 1.37, team2Back: 3.50, team2Lay: 3.60,
    tv: true, bm: true, fancy: true,
    overs: "18.2", runRate: "10.09", reqRate: "26.40",
    lastWicket: "R Pant c Wade b Starc 42(28)", partnership: "32(14) - Hardik & Jadeja",
    toss: "India won toss, elected to bat", venue: "Melbourne Cricket Ground",
  },
  "2": {
    sport: "cricket", sportIcon: "🏏", league: "IPL 2026",
    team1: "Mumbai Indians", team2: "Chennai Super Kings",
    score1: "92/2 (10.4)", score2: "—",
    status: "MI batting - 1st innings",
    team1Back: 1.80, team1Lay: 1.82, team2Back: 2.15, team2Lay: 2.18,
    tv: true, bm: true, fancy: true,
    overs: "10.4", runRate: "8.63",
    lastWicket: "Ishan Kishan lbw Jadeja 18(14)", partnership: "45(32) - Rohit & Sky",
    toss: "CSK won toss, elected to field", venue: "Wankhede Stadium, Mumbai",
  },
  "4": {
    sport: "football", sportIcon: "⚽", league: "Premier League",
    team1: "Manchester United", team2: "Liverpool",
    score1: "1", score2: "2",
    status: "67' - 2nd Half",
    team1Back: 4.20, team1Lay: 4.40,
    drawBack: 3.80, drawLay: 3.95,
    team2Back: 1.55, team2Lay: 1.57,
    tv: true, bm: true, fancy: false,
    venue: "Old Trafford, Manchester",
  },
  "7": {
    sport: "tennis", sportIcon: "🎾", league: "ATP Finals",
    team1: "Carlos Alcaraz", team2: "Jannik Sinner",
    score1: "6-4, 3-2", score2: "4-6, 2-3",
    status: "2nd Set - Alcaraz serving",
    team1Back: 1.55, team1Lay: 1.57, team2Back: 2.60, team2Lay: 2.65,
    tv: true, bm: true, fancy: false,
    venue: "ATP Finals, Turin",
  },
};

const initialFancy: FancyMarket[] = [
  { id: "f1", name: "6 Over Runs (IND)", noValue: 48, noOdds: 95, yesValue: 50, yesOdds: 95 },
  { id: "f2", name: "10 Over Runs (IND)", noValue: 82, noOdds: 90, yesValue: 84, yesOdds: 90 },
  { id: "f3", name: "Total Match Sixes", noValue: 12, noOdds: 100, yesValue: 14, yesOdds: 100 },
  { id: "f4", name: "Total Match Fours", noValue: 22, noOdds: 90, yesValue: 24, yesOdds: 90 },
  { id: "f5", name: "Highest Opening Partnership", noValue: 35, noOdds: 100, yesValue: 37, yesOdds: 100 },
  { id: "f6", name: "1st Wicket Runs", noValue: 28, noOdds: 95, yesValue: 30, yesOdds: 95 },
  { id: "f7", name: "Lambi Runs (IND)", noValue: 168, noOdds: 90, yesValue: 172, yesOdds: 90 },
  { id: "f8", name: "Top Batsman Runs (IND)", noValue: 42, noOdds: 95, yesValue: 44, yesOdds: 95 },
];

const recentBalls: BallEvent[] = [
  { over: "18.1", result: "4" },
  { over: "18.0", result: "1" },
  { over: "17.5", result: "6" },
  { over: "17.4", result: "W" },
  { over: "17.3", result: "0" },
  { over: "17.2", result: "2" },
  { over: "17.1", result: "1" },
  { over: "17.0", result: "4" },
  { over: "16.5", result: "1" },
  { over: "16.4", result: "6" },
  { over: "16.3", result: "0" },
  { over: "16.2", result: "1" },
];

function fluctuate(v: number, range = 0.06) {
  return Math.max(1.01, parseFloat((v + (Math.random() - 0.5) * range).toFixed(2)));
}

function fluctuateInt(v: number, range = 2) {
  return Math.max(0, v + Math.floor((Math.random() - 0.5) * range));
}

const ballColor: Record<string, string> = {
  "0": "bg-muted text-muted-foreground",
  "1": "bg-secondary text-foreground",
  "2": "bg-secondary text-foreground",
  "3": "bg-secondary text-foreground",
  "4": "bg-primary text-primary-foreground",
  "6": "bg-accent text-accent-foreground",
  W: "bg-destructive text-destructive-foreground",
};

// ─── Component ───────────────────────────────────────────────
export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();

  // Try mock data first (used by curated/manual demo IDs like "1","2",...)
  const mockBase = id && matchData[id] ? matchData[id] : null;

  // For SkyExch event IDs (e.g. -11080399) the mock won't match — pull the
  // real event from the live feed. We query all sports so any event id works.
  const cricket = useSkyExchMatches("cricket");
  const tennis = useSkyExchMatches("tennis");
  const soccer = useSkyExchMatches("soccer");
  const horseracing = useSkyExchMatches("horseracing");

  const liveBase = useMemo(() => {
    if (!id || mockBase) return null;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return null;

    const sources: { sport: SkySport; icon: string; events: typeof cricket.events }[] = [
      { sport: "cricket", icon: "🏏", events: cricket.events },
      { sport: "tennis", icon: "🎾", events: tennis.events },
      { sport: "soccer", icon: "⚽", events: soccer.events },
      { sport: "horseracing", icon: "🐎", events: horseracing.events },
    ];

    for (const src of sources) {
      const ev = src.events.find((e) => e.id === numId);
      if (!ev) continue;

      const odds = ev.matchOdds && ev.matchOdds.length > 0
        ? ev.matchOdds
        : synthesizeOdds(ev.id, ev.team1, ev.team2, src.sport === "soccer");

      const findFor = (name: string) =>
        odds.find((o) => (o.runnerName || "").toLowerCase().includes((name || "").toLowerCase().split(" ")[0] || ""));
      const t1 = findFor(ev.team1) || odds[0];
      const t2 = findFor(ev.team2) || odds[1];
      const draw = odds.find((o) => /draw/i.test(o.runnerName || ""));

      const num = (v: number | null | undefined, fallback = 1.99) =>
        v != null && Number.isFinite(v) ? Number(v) : fallback;

      return {
        sport: src.sport,
        sportIcon: src.icon,
        league: ev.competitionName || "",
        team1: ev.team1 || "Home",
        team2: ev.team2 || "Away",
        score1: ev.isInPlay ? "Live" : "—",
        score2: ev.isInPlay ? "Live" : "—",
        status: ev.isInPlay ? "In-Play" : (ev.openDateStr || ev.openDate || ""),
        team1Back: num(t1?.back?.[0]),
        team1Lay: num(t1?.lay?.[0]),
        team2Back: num(t2?.back?.[0]),
        team2Lay: num(t2?.lay?.[0]),
        drawBack: draw ? num(draw.back?.[0]) : undefined,
        drawLay: draw ? num(draw.lay?.[0]) : undefined,
        tv: false,
        bm: ev.hasBookmaker,
        fancy: ev.hasFancy,
      } as typeof matchData[string];
    }
    return null;
  }, [id, mockBase, cricket.events, tennis.events, soccer.events, horseracing.events]);

  const base = mockBase || liveBase || matchData["1"];
  const isLoadingLive = !mockBase && !liveBase &&
    (cricket.loading || tennis.loading || soccer.loading || horseracing.loading);

  const [match, setMatch] = useState(base);
  // Keep `match` in sync once the live feed resolves.
  useEffect(() => {
    setMatch(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base.team1, base.team2, base.league]);

  const [fancy, setFancy] = useState<FancyMarket[]>(initialFancy);
  const [showScorecard, setShowScorecard] = useState(true);
  const [showFancy, setShowFancy] = useState(true);
  const [selectedBet, setSelectedBet] = useState<{
    selection: string; type: "back" | "lay" | "yes" | "no"; odds: number; market: string;
  } | null>(null);
  const [stake, setStake] = useState("");

  // Live odds simulation
  useEffect(() => {
    const iv = setInterval(() => {
      setMatch(p => ({
        ...p,
        team1Back: fluctuate(p.team1Back),
        team1Lay: fluctuate(p.team1Lay),
        team2Back: fluctuate(p.team2Back),
        team2Lay: fluctuate(p.team2Lay),
        drawBack: p.drawBack ? fluctuate(p.drawBack) : undefined,
        drawLay: p.drawLay ? fluctuate(p.drawLay) : undefined,
      }));
      setFancy(prev => prev.map(f => ({
        ...f,
        noValue: fluctuateInt(f.noValue),
        yesValue: fluctuateInt(f.yesValue),
      })));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const profit = selectedBet && stake && parseFloat(stake) > 0
    ? selectedBet.type === "back" || selectedBet.type === "yes"
      ? parseFloat((parseFloat(stake) * (selectedBet.odds - 1)).toFixed(2))
      : parseFloat(stake)
    : 0;
  const liability = selectedBet && stake && parseFloat(stake) > 0
    ? selectedBet.type === "lay" || selectedBet.type === "no"
      ? parseFloat((parseFloat(stake) * (selectedBet.odds - 1)).toFixed(2))
      : parseFloat(stake)
    : 0;

  const handleBet = (selection: string, type: "back" | "lay" | "yes" | "no", odds: number, market: string) => {
    setSelectedBet({ selection, type, odds, market });
    setStake("");
  };

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Navbar />

      <div className="mx-auto max-w-4xl px-3 py-3 md:px-6 md:py-4 space-y-3">
        {/* Back + Title */}
        <div className="flex items-center gap-2">
          <Link to="/inplay" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-medium">{match.sportIcon} {match.league}</p>
            <h1 className="font-display text-base font-bold text-foreground truncate">{match.team1} vs {match.team2}</h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {match.tv && <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">📺 TV</span>}
            {match.bm && <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold text-accent-foreground">BM</span>}
            {match.fancy && <span className="rounded bg-live/15 px-1.5 py-0.5 text-[9px] font-bold" style={{ color: "hsl(var(--live))" }}>FANCY</span>}
          </div>
        </div>

        {/* Live Scorecard */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowScorecard(!showScorecard)}
            className="w-full flex items-center justify-between px-3 py-2 text-primary-foreground"
            style={{ backgroundColor: "hsl(var(--header-dark))" }}
          >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span className="h-2 w-2 rounded-full bg-live animate-pulse-live" style={{ backgroundColor: "hsl(var(--live))" }} />
              Live Scorecard
            </span>
            {showScorecard ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showScorecard && (
            <div className="p-3 space-y-3">
              {/* Scores */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{match.team1}</span>
                  <span className="text-sm font-bold text-primary">{match.score1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">{match.team2}</span>
                  <span className="text-sm font-bold text-primary">{match.score2}</span>
                </div>
                <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--live))" }}>{match.status}</p>
              </div>

              {/* Stats Row */}
              {match.sport === "cricket" && (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {match.overs && (
                      <div className="rounded bg-secondary px-2 py-1.5">
                        <p className="text-[9px] text-muted-foreground uppercase">Overs</p>
                        <p className="text-xs font-bold text-foreground">{match.overs}</p>
                      </div>
                    )}
                    {match.runRate && (
                      <div className="rounded bg-secondary px-2 py-1.5">
                        <p className="text-[9px] text-muted-foreground uppercase">CRR</p>
                        <p className="text-xs font-bold text-foreground">{match.runRate}</p>
                      </div>
                    )}
                    {match.reqRate && (
                      <div className="rounded bg-secondary px-2 py-1.5">
                        <p className="text-[9px] text-muted-foreground uppercase">RRR</p>
                        <p className="text-xs font-bold text-destructive">{match.reqRate}</p>
                      </div>
                    )}
                  </div>

                  {/* Ball by Ball */}
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mb-1">Recent Balls</p>
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                      {recentBalls.map((b, i) => (
                        <div key={i} className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-full text-[10px] font-bold ${ballColor[b.result] || "bg-secondary text-foreground"}`}>
                          {b.result}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Extra Info */}
                  <div className="grid grid-cols-1 gap-1 text-[10px] text-muted-foreground">
                    {match.partnership && <p><span className="font-semibold text-foreground">Partnership:</span> {match.partnership}</p>}
                    {match.lastWicket && <p><span className="font-semibold text-foreground">Last Wkt:</span> {match.lastWicket}</p>}
                    {match.toss && <p><span className="font-semibold text-foreground">Toss:</span> {match.toss}</p>}
                    {match.venue && <p><span className="font-semibold text-foreground">Venue:</span> {match.venue}</p>}
                  </div>
                </>
              )}

              {match.sport !== "cricket" && match.venue && (
                <p className="text-[10px] text-muted-foreground"><span className="font-semibold text-foreground">Venue:</span> {match.venue}</p>
              )}
            </div>
          )}
        </div>

        {/* ─── Match Odds Market ─── */}
        <MarketSection title="Match Odds">
          <div className="space-y-1 px-3 py-2">
            <div className="flex items-center justify-end gap-1 mb-1">
              <span className="w-[56px] text-center text-[9px] font-bold uppercase" style={{ color: "hsl(var(--back))" }}>Back</span>
              <span className="w-[56px] text-center text-[9px] font-bold uppercase" style={{ color: "hsl(var(--lay))" }}>Lay</span>
            </div>
            <OddsRow label={match.team1} back={match.team1Back} lay={match.team1Lay}
              onBack={() => handleBet(match.team1, "back", match.team1Back, "Match Odds")}
              onLay={() => handleBet(match.team1, "lay", match.team1Lay, "Match Odds")}
              selected={selectedBet?.selection === match.team1 && selectedBet.market === "Match Odds"} selType={selectedBet?.type} />
            {match.drawBack && match.drawLay && (
              <OddsRow label="Draw" back={match.drawBack} lay={match.drawLay}
                onBack={() => handleBet("Draw", "back", match.drawBack!, "Match Odds")}
                onLay={() => handleBet("Draw", "lay", match.drawLay!, "Match Odds")}
                selected={selectedBet?.selection === "Draw" && selectedBet.market === "Match Odds"} selType={selectedBet?.type} />
            )}
            <OddsRow label={match.team2} back={match.team2Back} lay={match.team2Lay}
              onBack={() => handleBet(match.team2, "back", match.team2Back, "Match Odds")}
              onLay={() => handleBet(match.team2, "lay", match.team2Lay, "Match Odds")}
              selected={selectedBet?.selection === match.team2 && selectedBet.market === "Match Odds"} selType={selectedBet?.type} />
          </div>
        </MarketSection>

        {/* ─── Bookmaker Market ─── */}
        {match.bm && (
          <MarketSection title="Bookmaker Market">
            <div className="space-y-1 px-3 py-2">
              <div className="flex items-center justify-end gap-1 mb-1">
                <span className="w-[56px] text-center text-[9px] font-bold uppercase" style={{ color: "hsl(var(--back))" }}>Back</span>
                <span className="w-[56px] text-center text-[9px] font-bold uppercase" style={{ color: "hsl(var(--lay))" }}>Lay</span>
              </div>
              <OddsRow label={match.team1} back={fluctuate(match.team1Back, 0.04)} lay={fluctuate(match.team1Lay, 0.04)}
                onBack={() => handleBet(match.team1, "back", match.team1Back, "Bookmaker")}
                onLay={() => handleBet(match.team1, "lay", match.team1Lay, "Bookmaker")}
                selected={selectedBet?.selection === match.team1 && selectedBet.market === "Bookmaker"} selType={selectedBet?.type} />
              <OddsRow label={match.team2} back={fluctuate(match.team2Back, 0.04)} lay={fluctuate(match.team2Lay, 0.04)}
                onBack={() => handleBet(match.team2, "back", match.team2Back, "Bookmaker")}
                onLay={() => handleBet(match.team2, "lay", match.team2Lay, "Bookmaker")}
                selected={selectedBet?.selection === match.team2 && selectedBet.market === "Bookmaker"} selType={selectedBet?.type} />
            </div>
          </MarketSection>
        )}

        {/* ─── Fancy / Session Market ─── */}
        {match.fancy && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => setShowFancy(!showFancy)}
              className="w-full flex items-center justify-between px-3 py-2"
              style={{ backgroundColor: "hsl(var(--header-dark))", color: "hsl(var(--primary-foreground))" }}
            >
              <span className="text-xs font-bold uppercase tracking-wider">⚡ Fancy / Session</span>
              {showFancy ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showFancy && (
              <div className="divide-y divide-border">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/30">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Session</span>
                  <div className="flex gap-1">
                    <span className="w-[56px] text-center text-[9px] font-bold uppercase" style={{ color: "hsl(var(--lay))" }}>No</span>
                    <span className="w-[56px] text-center text-[9px] font-bold uppercase" style={{ color: "hsl(var(--back))" }}>Yes</span>
                  </div>
                </div>
                {fancy.map(f => (
                  <div key={f.id} className="flex items-center justify-between px-3 py-1.5 hover:bg-surface-hover transition-colors">
                    <span className="flex-1 text-[11px] font-medium text-foreground truncate pr-2">{f.name}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleBet(f.name, "no", f.noOdds / 100 + 1, "Fancy")}
                        className={`h-8 w-[56px] rounded-sm text-center transition-all ${
                          selectedBet?.selection === f.name && selectedBet.type === "no"
                            ? "bg-lay text-primary-foreground ring-2 ring-lay/50"
                            : "bg-lay/15 hover:bg-lay/25"
                        }`}
                      >
                        <span className="block text-[11px] font-bold" style={{ color: selectedBet?.selection === f.name && selectedBet.type === "no" ? undefined : "hsl(var(--lay))" }}>{f.noValue}</span>
                        <span className="block text-[8px] text-muted-foreground">{f.noOdds}</span>
                      </button>
                      <button
                        onClick={() => handleBet(f.name, "yes", f.yesOdds / 100 + 1, "Fancy")}
                        className={`h-8 w-[56px] rounded-sm text-center transition-all ${
                          selectedBet?.selection === f.name && selectedBet.type === "yes"
                            ? "bg-back text-primary-foreground ring-2 ring-back/50"
                            : "bg-back/15 hover:bg-back/25"
                        }`}
                      >
                        <span className="block text-[11px] font-bold" style={{ color: selectedBet?.selection === f.name && selectedBet.type === "yes" ? undefined : "hsl(var(--back))" }}>{f.yesValue}</span>
                        <span className="block text-[8px] text-muted-foreground">{f.yesOdds}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Bet Slip ─── */}
      {selectedBet && (
        <div className="fixed bottom-14 left-0 right-0 md:bottom-0 z-40 border-t border-border bg-card p-3 md:mx-auto md:max-w-md md:rounded-t-xl md:border-x shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-foreground">Bet Slip</h4>
            <button onClick={() => setSelectedBet(null)} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              selectedBet.type === "back" || selectedBet.type === "yes" ? "bg-back/20 text-back" : "bg-lay/20 text-lay"
            }`}>{selectedBet.type}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-foreground truncate block">{selectedBet.selection}</span>
              <span className="text-[9px] text-muted-foreground">{selectedBet.market}</span>
            </div>
            <span className="text-sm font-bold text-accent shrink-0">@ {selectedBet.odds.toFixed(2)}</span>
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <input type="number" value={stake} onChange={e => setStake(e.target.value)} placeholder="Stake ₹"
                className="w-full h-9 rounded-md bg-input px-3 text-sm text-foreground border border-border focus:border-primary outline-none" />
            </div>
            <div className="flex gap-1 items-end">
              {[100, 500, 1000, 5000].map(v => (
                <button key={v} onClick={() => setStake(String(v))}
                  className="h-9 rounded bg-secondary px-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
                  {v >= 1000 ? `${v / 1000}K` : v}
                </button>
              ))}
            </div>
          </div>
          {stake && parseFloat(stake) > 0 && (
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">{selectedBet.type === "back" || selectedBet.type === "yes" ? "Profit" : "Liability"}:</span>
              <span className={`font-bold ${selectedBet.type === "back" || selectedBet.type === "yes" ? "text-live" : "text-live-red"}`}>
                {selectedBet.type === "back" || selectedBet.type === "yes" ? "+" : "-"}₹{selectedBet.type === "back" || selectedBet.type === "yes" ? profit : liability}
              </span>
            </div>
          )}
          <Button variant="default" className="w-full font-semibold" disabled={!stake || parseFloat(stake) <= 0}>
            Place {selectedBet.type.charAt(0).toUpperCase() + selectedBet.type.slice(1)} Bet
          </Button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────
function MarketSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-3 py-2 flex items-center gap-2" style={{ backgroundColor: "hsl(var(--header-dark))", color: "hsl(var(--primary-foreground))" }}>
        <BarChart3 className="h-3.5 w-3.5" />
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        <span className="ml-auto h-2 w-2 rounded-full animate-pulse-live" style={{ backgroundColor: "hsl(var(--live))" }} />
      </div>
      {children}
    </div>
  );
}

function OddsRow({ label, back, lay, onBack, onLay, selected, selType }: {
  label: string; back: number; lay: number;
  onBack: () => void; onLay: () => void;
  selected?: boolean; selType?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex-1 text-xs font-medium text-foreground truncate">{label}</span>
      <div className="flex gap-1">
        <button onClick={onBack}
          className={`h-8 w-[56px] rounded-sm text-[11px] font-bold transition-all ${
            selected && selType === "back" ? "bg-back text-primary-foreground ring-2 ring-back/50 scale-105" : "bg-back/20 text-back hover:bg-back/30"
          }`}>{back.toFixed(2)}</button>
        <button onClick={onLay}
          className={`h-8 w-[56px] rounded-sm text-[11px] font-bold transition-all ${
            selected && selType === "lay" ? "bg-lay text-primary-foreground ring-2 ring-lay/50 scale-105" : "bg-lay/20 text-lay hover:bg-lay/30"
          }`}>{lay.toFixed(2)}</button>
      </div>
    </div>
  );
}
