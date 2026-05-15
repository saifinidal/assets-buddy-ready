import { Link } from "react-router-dom";
import { History, ChevronRight, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function HomeBetHistoryCTA() {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return null;

  return (
    <div className="px-3 py-2">
      <Link
        to="/bet-history"
        className="group flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 hover:border-primary/50 hover:from-primary/15 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">My Bet History</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              View results, P&L & live settlements
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground group-hover:opacity-90">
          <History className="h-3.5 w-3.5" /> Open
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </Link>
    </div>
  );
}
