import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSpribeBalanceSync } from "@/hooks/useSpribeBalanceSync";
import { useCasinoSession } from "@/hooks/useCasinoSession";
import { Loader2, X, Maximize2, Minimize2, RotateCcw, WifiOff } from "lucide-react";

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
  const [iframeError, setIframeError] = useState<string | null>(null);
  const [iframeDiagnostics, setIframeDiagnostics] = useState<{ type: string; suggestions: string[] } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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

  // Iframe load/error detection
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !gameUrl) return;

    const handleIframeError = () => {
      setIframeError("The game failed to load. The provider may be blocking the connection or the URL is invalid.");
      setIframeDiagnostics({
        type: "NETWORK_ERROR",
        suggestions: [
          "Check your internet connection",
          "The game provider server may be down",
          "Your IP or region may be blocked by the provider",
          "Try using a VPN or different network",
        ],
      });
      setLoading(false);
    };

    let crossOriginDetected = false;

    const handleIframeLoad = () => {
      setLoading(false);
      try {
        const doc = iframe.contentDocument;
        if (doc) {
          const title = doc.title || "";
          const bodyText = doc.body?.innerText?.slice(0, 500) || "";
          if (/access denied|forbidden|404|not found|error/i.test(title)) {
            setIframeError(`Game provider returned an error page: "${title}". ${bodyText.slice(0, 200)}`);
            setIframeDiagnostics({
              type: "PROVIDER_ERROR",
              suggestions: [
                "The provider rejected the request — credentials (Agent ID/Key) may be invalid",
                "Your account may not be whitelisted with the provider",
                "The game may be unavailable in your region",
              ],
            });
          }
        }
      } catch (e) {
        // Cross-origin: iframe loaded something but we can't inspect it
        crossOriginDetected = true;
        setIframeDiagnostics({
          type: "CROSS_ORIGIN",
          suggestions: [
            "The game loaded on a different domain — content inspection is blocked by browser security (this is normal for working games)",
            "If the game appears blank or broken, the provider may be geo/IP-blocking your region",
            "Try disabling ad-blockers or browser privacy extensions",
            "Verify THRVEX Agent ID & Key are correct in Admin → Settings → Game API",
            "Contact the game provider to confirm your domain/IP is whitelisted",
          ],
        });
      }

      // If cross-origin and iframe shows nothing after 5s, flag it
      if (crossOriginDetected) {
        setTimeout(() => {
          const rect = iframe.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            setIframeError("Game iframe has no visible content. The provider may have blocked this request.");
          }
        }, 5000);
      }
    };

    iframe.addEventListener("error", handleIframeError);
    iframe.addEventListener("load", handleIframeLoad);

    // Timeout: if iframe hasn't loaded in 30s, show error
    const timeout = setTimeout(() => {
      if (loading) {
        setIframeError("Game took too long to load. The provider may be unreachable.");
        setIframeDiagnostics({
          type: "TIMEOUT",
          suggestions: [
            "The game provider did not respond within 30 seconds",
            "Your network may be slow or the provider's server is down",
            "Your IP or region may be blocked — try a VPN",
            "Check that the THRVEX Server URL is correct in Admin → Settings",
          ],
        });
        setLoading(false);
      }
    }, 30000);

    return () => {
      iframe.removeEventListener("error", handleIframeError);
      iframe.removeEventListener("load", handleIframeLoad);
      clearTimeout(timeout);
    };
  }, [gameUrl, loading]);

  const handleClose = () => {
    navigate("/casino");
  };

  const handleFullscreen = () => {
    const el = document.documentElement;
    if (!isFullscreen) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleReload = () => {
    if (!currentUser) return;
    setLoading(true);
    setGameUrl(null);
    setError(null);
    setErrorDetail(null);
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
          {!loading && !error && (
            <span className="shrink-0 rounded bg-live/20 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-live">LIVE</span>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button onClick={handleReload} className="rounded p-1 sm:p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Reload">
            <RotateCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button onClick={handleFullscreen} className="hidden sm:block rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Fullscreen">
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button onClick={handleClose} className="rounded p-1 sm:p-1.5 text-destructive hover:bg-destructive/10 transition-colors" title="Close">
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 bg-background">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            <p className="text-xs sm:text-sm font-medium text-muted-foreground px-4 text-center">Loading {gameName}...</p>
          </div>
        )}

        {(error || iframeError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 sm:gap-3 bg-background px-4 z-10">
            <WifiOff className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            <p className="text-xs sm:text-sm font-medium text-foreground text-center">{error || iframeError}</p>
            {errorDetail && (
              <div className="w-full max-w-sm rounded-md border border-border bg-card p-3 space-y-1">
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
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-bold">Time:</span> <span className="text-foreground">{new Date().toLocaleString()}</span>
                </p>
              </div>
            )}
            {iframeError && !errorDetail && (
              <div className="w-full max-w-sm rounded-md border border-border bg-card p-3 space-y-1">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-bold">Game ID:</span> <span className="font-mono text-foreground">{gameId}</span>
                </p>
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-bold">Source:</span> <span className="font-mono text-foreground">iframe load failure</span>
                </p>
                {iframeDiagnostics && (
                  <p className="text-[10px] text-muted-foreground">
                    <span className="font-bold">Type:</span> <span className="font-mono text-foreground">{iframeDiagnostics.type}</span>
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-bold">Time:</span> <span className="text-foreground">{new Date().toLocaleString()}</span>
                </p>
              </div>
            )}
            {iframeDiagnostics && iframeDiagnostics.suggestions.length > 0 && (
              <div className="w-full max-w-sm rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3">
                <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 mb-1.5">💡 Troubleshooting Suggestions:</p>
                <ul className="space-y-1">
                  {iframeDiagnostics.suggestions.map((s, i) => (
                    <li key={i} className="text-[10px] text-muted-foreground flex gap-1.5">
                      <span className="shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex gap-2">
              {isLoggedIn && (
                <button onClick={() => { setIframeError(null); setIframeDiagnostics(null); handleReload(); }} className="rounded-md bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-primary-foreground">
                  Try Again
                </button>
              )}
              <button onClick={handleClose} className="rounded-md bg-muted px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-foreground border border-border">
                Go Back
              </button>
            </div>
          </div>
        )}

        {gameUrl && (
          <iframe
            ref={iframeRef}
            src={gameUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media; clipboard-write"
            allowFullScreen
            title={gameName}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
          />
        )}
      </div>
    </div>
  );
};

export default GamePlayer;
