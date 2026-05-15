import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import type { ThrvexGame } from "@/hooks/useThrvexGames";
import { getLocalThrvexGamesFlat } from "@/hooks/useThrvexGames";
import { getGameGradient } from "@/lib/gameIcons";
import { LoginDialog } from "@/components/LoginDialog";

const FEATURED_PROVIDERS = ["Spribe", "JILIGaming"];

export function CasinoGrid() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [games, setGames] = useState<ThrvexGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingGame, setPendingGame] = useState<ThrvexGame | null>(null);

  useEffect(() => {
    try {
      const all: ThrvexGame[] = [];
      for (const prov of FEATURED_PROVIDERS) {
        all.push(...getLocalThrvexGamesFlat(prov).slice(0, 8));
      }
      setGames(all);
    } catch (e) {
      console.error("Failed to load featured games:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const launchGame = (game: ThrvexGame) => {
    navigate(`/play?id=${encodeURIComponent(game.game_uid)}&name=${encodeURIComponent(game.game_name)}`);
  };

  const handleGameLaunch = (game: ThrvexGame) => {
    if (!isLoggedIn) {
      setPendingGame(game);
      setLoginOpen(true);
      return;
    }
    launchGame(game);
  };

  const Header = (
    <div className="flex items-center justify-between bg-green-bar px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs">🎰</span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
          Casino Games
        </span>
      </div>
      <Link
        to="/casino"
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground hover:underline"
      >
        View All <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div>
        {Header}
        <div className="flex items-center justify-center py-8 bg-card">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {Header}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-0.5 mt-1.5">
        {games.map((game) => (
          <GameThumbnail key={game.game_uid} game={game} onLaunch={handleGameLaunch} />
        ))}
      </div>
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        title="Login to Play"
        description={pendingGame ? `Login to launch ${pendingGame.game_name}` : "Please login to play games"}
        onSuccess={() => {
          if (pendingGame) {
            const g = pendingGame;
            setPendingGame(null);
            setTimeout(() => launchGame(g), 300);
          }
        }}
      />
    </div>
  );
}

function GameThumbnail({ game, onLaunch }: { game: ThrvexGame; onLaunch: (g: ThrvexGame) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onLaunch(game)}
      className="group relative overflow-hidden aspect-[4/3] rounded-sm hover:scale-105 transition-transform"
    >
      {game.image && !imgError ? (
        <img
          src={game.image}
          alt={game.game_name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: getGameGradient(game.provider_name) }}
        >
          <div className="absolute inset-0 opacity-30" style={{
            background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          }} />
          <div className="absolute inset-0 opacity-20" style={{
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)',
          }} />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30" />
          <div className="absolute -top-3 -right-3 w-12 h-12 rounded-full opacity-10 bg-white" />
          <div className="absolute -bottom-4 -left-4 w-14 h-14 rounded-full opacity-10 bg-white" />
          <div className="relative z-10 flex flex-col items-center gap-0.5">
            <div className="rounded-md px-2 py-1 bg-black/30 backdrop-blur-sm border border-white/20" style={{
              boxShadow: '0 4px 15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
              <span className="text-xs sm:text-sm font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-none tracking-wide">
                {game.game_name.length > 10
                  ? game.game_name.split(/[\s-]+/).map(w => w[0]).filter(Boolean).slice(0, 3).join("").toUpperCase()
                  : game.game_name.toUpperCase().slice(0, 8)
                }
              </span>
            </div>
            <span className="text-[5px] text-white/70 font-semibold tracking-widest uppercase">
              {game.provider_name}
            </span>
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5">
        <p className="text-[7px] sm:text-[8px] font-semibold text-white truncate">{game.game_name}</p>
      </div>
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity rounded bg-primary px-2 py-1 text-[9px] sm:text-[10px] font-bold text-primary-foreground shadow-lg">PLAY</span>
      </div>
    </button>
  );
}
