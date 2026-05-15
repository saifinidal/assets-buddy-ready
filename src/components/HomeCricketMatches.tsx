import { Clock, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useSkyExchMatches, synthesizeOdds, type SkyOdds } from "@/hooks/useSkyExchMatches";
import { formatMatchTimeLabel } from "@/lib/matchTime";

function pickOdds(event: { id: number; team1: string; team2: string; matchOdds: SkyOdds[] }) {
  const odds = event.matchOdds && event.matchOdds.length > 0
    ? event.matchOdds
    : synthesizeOdds(event.id, event.team1, event.team2, false);

  const findFor = (name: string) =>
    odds.find((o) => (o.runnerName || "").toLowerCase().includes((name || "").toLowerCase().split(" ")[0] || ""));

  const t1 = findFor(event.team1) || odds[0];
  const t2 = findFor(event.team2) || odds[1];
  const draw = odds.find((o) => /draw/i.test(o.runnerName || ""));

  const fmt = (v: number | null | undefined) => (v != null && Number.isFinite(v) ? Number(v).toFixed(2) : "—");
  return {
    t1Back: fmt(t1?.back?.[0]),
    t1Lay: fmt(t1?.lay?.[0]),
    t2Back: fmt(t2?.back?.[0]),
    t2Lay: fmt(t2?.lay?.[0]),
    drawBack: draw ? fmt(draw.back?.[0]) : null,
    drawLay: draw ? fmt(draw.lay?.[0]) : null,
  };
}

export function HomeCricketMatches() {
  const { events, loading } = useSkyExchMatches("cricket");

  const cricketMatches = useMemo(() => {
    const arr = [...events];
    arr.sort((a, b) => {
      if (a.isInPlay !== b.isInPlay) return a.isInPlay ? -1 : 1;
      const ta = a.openDate ? new Date(a.openDate).getTime() : 0;
      const tb = b.openDate ? new Date(b.openDate).getTime() : 0;
      return ta - tb;
    });
    return arr.slice(0, 5);
  }, [events]);

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between bg-green-bar px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs">🏏</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
              Cricket Matches
            </span>
          </div>
        </div>
        <div className="bg-card px-3 py-6 text-center text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (cricketMatches.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between bg-green-bar px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs">🏏</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
            Cricket Matches
          </span>
        </div>
        <Link
          to="/inplay"
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="bg-card divide-y divide-border">
        {cricketMatches.map((match) => {
          const odds = pickOdds(match);
          return (
            <Link
              to={`/match/${match.id}`}
              key={match.id}
              className="block px-3 py-2 hover:bg-surface transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 mb-1 min-w-0">
                <span className="text-[9px] font-medium text-muted-foreground uppercase truncate">
                  {match.competitionName}
                </span>
                {match.isInPlay ? (
                  <span className="flex shrink-0 items-center gap-1 rounded bg-live-red/10 px-1 py-0.5 text-[9px] font-bold text-live-red">
                    <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />
                    LIVE
                  </span>
                ) : match.openDate ? (
                  <span className="flex shrink-0 items-center gap-0.5 text-[9px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {formatMatchTimeLabel(match.openDate)}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <p className="flex-1 min-w-0 text-xs font-semibold text-foreground truncate">
                  {match.team1} <span className="text-muted-foreground font-normal">v</span> {match.team2}
                </p>
                <ChevronRight className="hidden md:block h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </div>
              <div className="mt-1.5 grid grid-flow-col auto-cols-fr gap-1 odds-row">
                <button className="touch-target h-8 rounded-sm bg-back/15 text-[10px] font-bold text-back hover:bg-back/25 active:bg-back/35 transition-colors">
                  {odds.t1Back}
                </button>
                <button className="touch-target h-8 rounded-sm bg-lay/15 text-[10px] font-bold text-lay hover:bg-lay/25 active:bg-lay/35 transition-colors">
                  {odds.t1Lay}
                </button>
                {odds.drawBack && odds.drawLay && (
                  <>
                    <button className="touch-target h-8 rounded-sm bg-back/15 text-[10px] font-bold text-back hover:bg-back/25 active:bg-back/35 transition-colors">
                      {odds.drawBack}
                    </button>
                    <button className="touch-target h-8 rounded-sm bg-lay/15 text-[10px] font-bold text-lay hover:bg-lay/25 active:bg-lay/35 transition-colors">
                      {odds.drawLay}
                    </button>
                  </>
                )}
                <button className="touch-target h-8 rounded-sm bg-back/15 text-[10px] font-bold text-back hover:bg-back/25 active:bg-back/35 transition-colors">
                  {odds.t2Back}
                </button>
                <button className="touch-target h-8 rounded-sm bg-lay/15 text-[10px] font-bold text-lay hover:bg-lay/25 active:bg-lay/35 transition-colors">
                  {odds.t2Lay}
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
