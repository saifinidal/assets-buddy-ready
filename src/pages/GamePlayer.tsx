import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/loose";
import { useAuth } from "@/contexts/AuthContext";
import { useSpribeBalanceSync } from "@/hooks/useSpribeBalanceSync";
import { useCasinoSession } from "@/hooks/useCasinoSession";
import { Loader2, X, RotateCcw, WifiOff, ExternalLink } from "lucide-react";

const GamePlayer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, authUser, isLoggedIn, loading: authLoading, refreshProfile } = useAuth();
  const { pullSpribeBalance } = useSpribeBalanceSync();
  const { openSession, closeSession } = useCasinoSession();
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<{ status?: number; message?: string; url?: string } | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const gameWindowRef = useRef<Window | null>(null);
  const sessionOpenedRef = useRef(false);

  const gameId = searchParams.get("id");
  const gameName = searchParams.get("name") || "Game";
  const isSpribe = !!gameId && /^22_2200[0-9]$/.test(gameId);
  const providerName = isSpribe ? "Spribe" : "JILIGaming";

  // Read latest balance straight from DB (avoids stale context)
  const fetchLatestBalance = async (profileId: string): Promise<number> => {
    const { data } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", profileId)
      .maybeSingle();
    return Number(data?.balance || 0);
  };

  useEffect(() => {
    if (authLoading) return;
    if (authUser && !currentUser) return;

    if (!isLoggedIn || !currentUser || !gameId) {
      setError(!gameId ? "Invalid game" : "Login required to play games");
      setLoading(false);
      return;
    }

    const launchGame = async () => {
      try {
        // For seamless games, pull any leftover Spribe balance back first
        if (!isSpribe) {
          try { await pullSpribeBalance({ force: true }); } catch { /* ignore */ }
        }

        // Capture balance BEFORE launching
        const balanceBefore = await fetchLatestBalance(currentUser.profileId);

        // Open session record
        if (!sessionOpenedRef.current) {
          await openSession({
            profileId: currentUser.profileId,
            gameUid: gameId,
            gameName,
            providerName,
            balanceBefore,
          });
          sessionOpenedRef.current = true;
        }

        const { data, error: fnError } = await supabase.functions.invoke("game-launch", {
          body: { gameid: gameId, userid: currentUser.profileId },
        });
        if (fnError || data?.launch_error || !data?.url) {
          const errMsg = data?.error || fnError?.message || "Game launch failed. Please try again.";
          setError(errMsg);
          setErrorDetail({ message: errMsg, status: data?.response_status, url: data?.request_url });
          return;
        }
        setGameUrl(data.url);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Could not connect to game server.";
        setError(errMsg);
        setErrorDetail({ message: errMsg });
      } finally {
        setLoading(false);
      }
    };

    launchGame();
  }, [gameId, currentUser, authUser, isLoggedIn, authLoading, isSpribe, pullSpribeBalance, openSession, gameName, providerName]);

  // On unmount: pull spribe balance (if applicable) then close session with final balance
  useEffect(() => {
    return () => {
      if (!currentUser?.profileId) return;
      const profileId = currentUser.profileId;
      (async () => {
        try {
          if (isSpribe) {
            await pullSpribeBalance({ force: true });
          }
          // Small delay so callback has time to credit final balance
          await new Promise((r) => setTimeout(r, 800));
          const balanceAfter = await fetchLatestBalance(profileId);
          await closeSession({ profileId, balanceAfter });
          await refreshProfile();
        } catch {
          /* silent */
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpribe, currentUser?.profileId]);

  // Open game in new tab whenever gameUrl is set
  const openGameTab = (url: string) => {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      setPopupBlocked(true);
    } else {
      setPopupBlocked(false);
      gameWindowRef.current = win;
    }
  };

  const handleClose = () => {
    navigate("/casino");
  };

  // Auto-open game in new tab when URL is ready
  useEffect(() => {
    if (gameUrl) openGameTab(gameUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameUrl]);

  const handleReload = () => {
    if (!currentUser) return;
    setLoading(true);
    setGameUrl(null);
    setError(null);
    setErrorDetail(null);
    setPopupBlocked(false);
    const launchGame = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("game-launch", {
          body: { gameid: gameId, userid: currentUser.profileId },
        });
        if (fnError || data?.launch_error || !data?.url) {
          const errMsg = data?.error || fnError?.message || "Game launch failed.";
          setError(errMsg);
          setErrorDetail({ message: errMsg, status: data?.response_status, url: data?.request_url });
          return;
        }
        setGameUrl(data.url);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Could not connect.";
        setError(errMsg);
        setErrorDetail({ message: errMsg });
      } finally {
        setLoading(false);
      }
    };
    launchGame();
  };

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between bg-card border-b border-border px-2 sm:px-4 py-1.5 sm:py-2 shrink-0 safe-area-top">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-xs sm:text-sm">🎮</span>
          <h1 className="text-[11px] sm:text-xs md:text-sm font-bold text-foreground truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{gameName}</h1>
          {!loading && !error && gameUrl && (
            <span className="shrink-0 rounded bg-live/20 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-live">RUNNING</span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button onClick={handleReload} className="rounded p-1 sm:p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Reload">
            <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button onClick={handleClose} className="rounded p-1 sm:p-1.5 text-destructive hover:bg-destructive/10 transition-colors" title="Close & Return">
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center px-4">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center">Launching {gameName}...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 max-w-md w-full">
            <WifiOff className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            <p className="text-xs sm:text-sm font-medium text-foreground text-center">{error}</p>
            {errorDetail && (
              <div className="w-full rounded-md border border-border bg-card p-3 space-y-1">
                {errorDetail.status && (
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-bold">HTTP Status:</span>{" "}
                    <span className={`font-mono ${errorDetail.status >= 400 ? "text-destructive" : "text-foreground"}`}>{errorDetail.status}</span>
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-bold">Game ID:</span> <span className="font-mono text-foreground">{gameId}</span>
                </p>
                {errorDetail.url && (
                  <p className="text-[10px] text-muted-foreground break-all">
                    <span className="font-bold">Request:</span> <span className="font-mono text-foreground">{errorDetail.url}</span>
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2">
              {isLoggedIn && (
                <button onClick={handleReload} className="rounded-md bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-primary-foreground">
                  Try Again
                </button>
              )}
              <button onClick={handleClose} className="rounded-md bg-muted px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-foreground border border-border">
                Go Back
              </button>
            </div>
          </div>
        )}

        {!loading && !error && gameUrl && (
          <div className="flex flex-col items-center justify-center gap-4 max-w-md w-full text-center">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <ExternalLink className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">{gameName}</h2>
            {popupBlocked ? (
              <>
                <p className="text-xs sm:text-sm text-destructive font-medium">
                  Popup blocked! Click below to open the game.
                </p>
                <button
                  onClick={() => openGameTab(gameUrl)}
                  className="rounded-md bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" /> Open Game in New Tab
                </button>
              </>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Game opened in a new tab. Keep this window open — your balance will sync when you close the game tab and return here.
                </p>
                <button
                  onClick={() => openGameTab(gameUrl)}
                  className="rounded-md bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground inline-flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" /> Reopen Game Tab
                </button>
              </>
            )}
            <button
              onClick={handleClose}
              className="text-[11px] sm:text-xs text-muted-foreground hover:text-foreground underline"
            >
              Close & Return to Casino
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePlayer;
