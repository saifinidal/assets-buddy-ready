import { Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLiveMatches } from "@/hooks/useLiveMatches";

export function UpcomingEvents() {
  const { matches, loading } = useLiveMatches();

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 bg-green-bar px-3 py-1.5">
          <span className="text-xs">📅</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Upcoming Events</span>
        </div>
        <div className="bg-card px-3 py-6 text-center text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 bg-green-bar px-3 py-1.5">
          <span className="text-xs">📅</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Upcoming Events</span>
        </div>
        <div className="bg-card px-3 py-6 text-center text-xs text-muted-foreground">No events available</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 bg-green-bar px-3 py-1.5">
        <span className="text-xs">📅</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Upcoming Events</span>
      </div>

      <div className="bg-card divide-y divide-border">
        {matches.map((match) => (
          <Link to={`/match/${match.id}`} key={match.id}
            className="block px-3 py-2 hover:bg-surface transition-colors cursor-pointer">
            <div className="flex items-center gap-1.5 mb-1 min-w-0">
              <span className="text-[9px] font-medium text-muted-foreground uppercase truncate">{match.league}</span>
              {match.is_live ? (
                <span className="flex shrink-0 items-center gap-1 rounded bg-live-red/10 px-1 py-0.5 text-[9px] font-bold text-live-red">
                  <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />LIVE
                </span>
              ) : match.match_time ? (
                <span className="flex shrink-0 items-center gap-0.5 text-[9px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />{match.match_time}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <p className="flex-1 min-w-0 text-xs font-semibold text-foreground truncate">
                {match.team1} <span className="text-muted-foreground font-normal">v</span> {match.team2}
              </p>
              <ChevronRight className="hidden md:block h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
            <div className="mt-1.5 flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 odds-row">
              <button className="touch-target h-8 min-w-[44px] flex-1 max-w-[60px] rounded-sm bg-back/15 text-[10px] font-bold text-back hover:bg-back/25 active:bg-back/35 transition-colors">{match.team1_back.toFixed(2)}</button>
              <button className="touch-target h-8 min-w-[44px] flex-1 max-w-[60px] rounded-sm bg-lay/15 text-[10px] font-bold text-lay hover:bg-lay/25 active:bg-lay/35 transition-colors">{match.team1_lay.toFixed(2)}</button>
              {match.draw_back != null && match.draw_lay != null && (
                <>
                  <button className="touch-target h-8 min-w-[44px] flex-1 max-w-[60px] rounded-sm bg-back/15 text-[10px] font-bold text-back hover:bg-back/25 active:bg-back/35 transition-colors">{match.draw_back.toFixed(2)}</button>
                  <button className="touch-target h-8 min-w-[44px] flex-1 max-w-[60px] rounded-sm bg-lay/15 text-[10px] font-bold text-lay hover:bg-lay/25 active:bg-lay/35 transition-colors">{match.draw_lay.toFixed(2)}</button>
                </>
              )}
              <button className="touch-target h-8 min-w-[44px] flex-1 max-w-[60px] rounded-sm bg-back/15 text-[10px] font-bold text-back hover:bg-back/25 active:bg-back/35 transition-colors">{match.team2_back.toFixed(2)}</button>
              <button className="touch-target h-8 min-w-[44px] flex-1 max-w-[60px] rounded-sm bg-lay/15 text-[10px] font-bold text-lay hover:bg-lay/25 active:bg-lay/35 transition-colors">{match.team2_lay.toFixed(2)}</button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
