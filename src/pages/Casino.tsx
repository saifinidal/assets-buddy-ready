// @ts-nocheck
import { useState, useMemo, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSystemControls } from "@/hooks/useSystemControls";
import { supabase } from "@/integrations/supabase/loose";
import { Lock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Search, Loader2, Gamepad2, TrendingUp, Zap, LayoutGrid, History, Flame, Tv, Fish, Sparkles, Crown, Rocket, Joystick, Clock } from "lucide-react";
import { useThrvexProviders, getLocalThrvexGames, getLocalThrvexGamesFlat, type ThrvexGame } from "@/hooks/useThrvexGames";
import { normalizeProviderKey } from "@/lib/normalizeProvider";

import { CasinoHistoryPanel } from "@/components/CasinoHistoryPanel";

type LaunchStatus = "idle" | "loading" | "success" | "error";

// Hook to load DB-managed fallback, category & provider icons
function useCasinoIcons() {
  const [dbFallbacks, setDbFallbacks] = useState<{ keywords: string[]; image_url: string }[]>([]);
  const [dbCategoryIcons, setDbCategoryIcons] = useState<Record<string, string>>({});
  const [dbProviderIcons, setDbProviderIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("casino_icons")
      .select("icon_type, icon_key, image_url, keywords")
      .then(({ data }) => {
        if (!data) return;
        const fb: { keywords: string[]; image_url: string }[] = [];
        const cat: Record<string, string> = {};
        const prov: Record<string, string> = {};
        for (const row of data) {
          if (!row.image_url) continue;
          if (row.icon_type === "fallback" && row.keywords?.length) {
            fb.push({ keywords: row.keywords, image_url: row.image_url });
          }
          if (row.icon_type === "category") {
            cat[row.icon_key] = row.image_url;
          }
          if (row.icon_type === "provider") {
            prov[normalizeProviderKey(row.icon_key)] = row.image_url;
          }
        }
        setDbFallbacks(fb);
        setDbCategoryIcons(cat);
        setDbProviderIcons(prov);
      });
  }, []);

  return { dbFallbacks, dbCategoryIcons, dbProviderIcons };
}


type Category = {
  id: string;
  label: string;
  icon: React.ReactNode;
  providers: string[];
};

const ALLOWED_PROVIDERS = [
  "Spribe", "JILIGaming", "JDBGaming", "MAC88", "CQ9", "PGSoft",
  "Evolution Live", "Ezugi", "SaGaming", "Sexy", "DreamGaming",
  "PragmaticPlay-Asia", "PragmaticPlayLive-Asia", "Habanero",
  "FaChaiGaming", "Rich88", "Bgaming", "Smartsoft",
];

const CATEGORIES: Category[] = [
  { id: "all", label: "All Games", icon: <Crown className="h-4 w-4" />, providers: ALLOWED_PROVIDERS },
  { id: "live", label: "Live Casino", icon: <Tv className="h-4 w-4" />, providers: ["MAC88", "Evolution Live", "Ezugi", "SaGaming", "Sexy", "DreamGaming", "PragmaticPlayLive-Asia"] },
  { id: "slots", label: "Slots", icon: <Sparkles className="h-4 w-4" />, providers: ["JILIGaming", "JDBGaming", "PGSoft", "CQ9", "PragmaticPlay-Asia", "Habanero", "Rich88"] },
  { id: "crash", label: "Crash", icon: <Rocket className="h-4 w-4" />, providers: ["Spribe", "JILIGaming", "Smartsoft", "Bgaming"] },
  { id: "fishing", label: "Fishing", icon: <Fish className="h-4 w-4" />, providers: ["JILIGaming", "JDBGaming", "FaChaiGaming", "CQ9"] },
  { id: "arcade", label: "Arcade", icon: <Joystick className="h-4 w-4" />, providers: ALLOWED_PROVIDERS },
  { id: "history", label: "History", icon: <Clock className="h-4 w-4" />, providers: [] },
];

// Keyword filters per category — applied to game_name (case-insensitive)
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  all: [],
  live: ["dragon tiger", "baccarat", "roulette", "andar bahar", "teenpatti", "teen patti", "poker", "blackjack", "sic bo", "hi lo", "lobby", "live", "dealer", "32 cards", "casino war"],
  slots: ["slot", "fortune", "gold", "treasure", "dragon", "gem", "ace", "buffalo", "empire", "tiger", "mahjong", "pharaoh", "neko", "aztec", "mouse", "rabbit", "hatch", "blossom", "monkey", "mario", "book", "fiesta", "billionaire", "lucky", "777", "888"],
  crash: ["aviator", "crash", "rocket", "jetx", "spaceman", "lucky jet", "balloon", "cash show", "go rush", "limbo", "jet", "sky fall", "twist"],
  fishing: ["fish", "fishing", "shark", "ocean", "mermaid", "dragon fortune", "boom legend", "all-star fishing", "happy fishing", "dinosaur", "jackpot fishing", "mega fishing", "cai shen fishing"],
  arcade: ["dice", "mines", "plinko", "keno", "hilo", "hi-lo", "goal", "hotline", "mini roulette", "limbo", "ludo", "color", "number", "wheel", "7up7down", "tower", "andar bahar", "teen patti", "rummy", "poker", "blackjack", "baccarat", "coin flip", "wingo", "lottery"],
};

// Top providers to auto-load for each category
const AUTO_LOAD_PROVIDERS: Record<string, string[]> = {
  all: ["Spribe", "JILIGaming", "JDBGaming", "MAC88"],
  live: ["MAC88", "Evolution Live", "Ezugi", "SaGaming"],
  slots: ["JILIGaming", "JDBGaming", "PGSoft", "CQ9"],
  crash: ["Spribe", "JILIGaming", "Smartsoft"],
  fishing: ["JILIGaming", "JDBGaming", "FaChaiGaming"],
  arcade: ["Spribe", "JILIGaming", "MAC88"],
};

const Casino = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [allGames, setAllGames] = useState<ThrvexGame[]>([]);
  const [providerGames, setProviderGames] = useState<ThrvexGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerLoading, setProviderLoading] = useState(false);
  const { isLoggedIn, currentUser } = useAuth();
  const { casinoEnabled } = useSystemControls();
  const { toast } = useToast();

  const { dbFallbacks, dbCategoryIcons, dbProviderIcons } = useCasinoIcons();
  const { providers, loading: providersLoading } = useThrvexProviders();

  // Auto-load games for current category (skip on history tab)
  useEffect(() => {
    if (activeCategory === "history") {
      setLoading(false);
      return;
    }
    const autoProviders = AUTO_LOAD_PROVIDERS[activeCategory] || AUTO_LOAD_PROVIDERS.all;
    setLoading(true);
    setActiveProvider(null);

    try {
      const data = getLocalThrvexGames(autoProviders);
      const games: ThrvexGame[] = [];
      for (const prov of autoProviders) {
        if (data[prov]) games.push(...data[prov]);
      }
      setAllGames(games);
    } catch (e) {
      console.error("Failed to auto-load games:", e);
      setAllGames([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  // Load specific provider games
  useEffect(() => {
    if (!activeProvider) {
      setProviderGames([]);
      return;
    }
    setProviderLoading(true);
    const projId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    globalThis.fetch(
      `https://${projId}.supabase.co/functions/v1/thrvex-games?action=games&provider=${encodeURIComponent(activeProvider)}&v=2`,
      { cache: "no-store" }
    )
      .then(r => r.ok ? r.json() : { data: [] })
      .then(json => setProviderGames(json.data || []))
      .catch(() => setProviderGames([]))
      .finally(() => setProviderLoading(false));
  }, [activeProvider]);

  // Filter providers by category - only allow Spribe & JILIGaming
  const filteredProviders = useMemo(() => {
    const allowed = providers.filter(p => ALLOWED_PROVIDERS.some(a => p.toLowerCase() === a.toLowerCase()));
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    if (!cat || activeCategory === "all") return allowed;
    return allowed.filter(p =>
      cat.providers.some(cp => p.toLowerCase() === cp.toLowerCase())
    );
  }, [providers, activeCategory]);

  // Which games to display
  const displayGames = activeProvider ? providerGames : allGames;
  const isDisplayLoading = activeProvider ? providerLoading : loading;

  const filtered = displayGames.filter((g) => {
    // Category keyword filter (skip when a specific provider is selected — show full provider list then)
    const keywords = CATEGORY_KEYWORDS[activeCategory] || [];
    if (!activeProvider && keywords.length > 0) {
      const name = g.game_name.toLowerCase();
      if (!keywords.some((k) => name.includes(k))) return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return g.game_name.toLowerCase().includes(q) || g.provider_name.toLowerCase().includes(q);
  });

  // Group games by provider for display
  const gamesByProvider = useMemo(() => {
    const map: Record<string, ThrvexGame[]> = {};
    filtered.forEach(g => {
      if (!map[g.provider_name]) map[g.provider_name] = [];
      map[g.provider_name].push(g);
    });
    return map;
  }, [filtered]);

  // Per-game launch status tracking
  const [launchStatuses, setLaunchStatuses] = useState<Record<string, LaunchStatus>>({});

  const setGameStatus = useCallback((uid: string, status: LaunchStatus) => {
    setLaunchStatuses(prev => ({ ...prev, [uid]: status }));
  }, []);

  const handleGameLaunch = useCallback(async (game: ThrvexGame) => {
    if (!isLoggedIn || !currentUser) {
      toast({ title: "Login Required", description: "Please login to play games", variant: "destructive" });
      return;
    }

    // Prevent double-click
    if (launchStatuses[game.game_uid] === "loading") return;

    setGameStatus(game.game_uid, "loading");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("game-launch", {
        body: { gameid: game.game_uid, userid: currentUser.profileId },
      });

      if (fnError || data?.launch_error || !data?.url) {
        setGameStatus(game.game_uid, "error");
        toast({
          title: "Game Unavailable",
          description: data?.error || "This game is currently unavailable. Please try another game.",
          variant: "destructive",
        });
        setTimeout(() => setGameStatus(game.game_uid, "idle"), 3000);
        return;
      }

      setGameStatus(game.game_uid, "success");
      // Brief success flash before navigating
      setTimeout(() => {
        navigate(`/play?id=${encodeURIComponent(game.game_uid)}&name=${encodeURIComponent(game.game_name)}`);
      }, 600);
    } catch {
      setGameStatus(game.game_uid, "error");
      toast({ title: "Connection Error", description: "Could not reach game server.", variant: "destructive" });
      setTimeout(() => setGameStatus(game.game_uid, "idle"), 3000);
    }
  }, [isLoggedIn, currentUser, launchStatuses, navigate, toast, setGameStatus]);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setActiveProvider(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {!casinoEnabled ? (
        <div className="px-4 py-16 flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Casino Temporarily Closed</h2>
          <p className="text-sm text-muted-foreground">
            The casino has been disabled by the admin. Please check back later.
          </p>
          <BottomNav />
        </div>
      ) : (
      <div className="pb-16 md:pb-0">
        {/* Header */}
        <div className="bg-green-bar px-4 py-2 flex items-center gap-2">
          <span className="text-sm">🎰</span>
          <h1 className="font-display text-sm font-bold uppercase tracking-wider text-primary-foreground">
            {activeCategory === "history" ? "Casino History" : "Casino Games"}
          </h1>
          <span className="ml-auto rounded bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            {activeCategory === "history" ? "Your Sessions" : `${filteredProviders.length} Providers`}
          </span>
        </div>

        {/* Premium Category Tabs */}
        <div className="bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-2 py-2">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`touch-target shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-w-[60px] transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.05]"
                      : "bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:scale-[1.02]"
                  }`}
                >
                  <div className={`flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary-foreground/20 shadow-inner"
                      : "bg-background/50"
                  }`}>
                    {dbCategoryIcons[cat.id] ? (
                      <img src={dbCategoryIcons[cat.id]} alt={cat.label} className="h-4 w-4 object-contain" />
                    ) : cat.icon}
                  </div>
                  <span className="text-[9px] font-bold tracking-wide leading-none">
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {activeCategory === "history" ? (
          <div className="p-2">
            <CasinoHistoryPanel />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-2 py-1.5 bg-card border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search games..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Providers scroll */}
            <div className="bg-card border-b border-border">
              {providersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="ml-2 text-xs text-muted-foreground">Loading providers...</span>
                </div>
              ) : (
                <div className="flex gap-1 overflow-x-auto scrollbar-hide p-2">
                  <button
                    onClick={() => setActiveProvider(null)}
                    className={`touch-target shrink-0 rounded-md px-3 py-2 text-[10px] font-bold transition-colors whitespace-nowrap ${
                      !activeProvider
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ⭐ Popular
                  </button>
                  {filteredProviders.map((p) => (
                    <button
                      key={p}
                      onClick={() => setActiveProvider(activeProvider === p ? null : p)}
                      className={`touch-target shrink-0 rounded-md px-3 py-2 text-[10px] font-bold transition-colors whitespace-nowrap ${
                        activeProvider === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Games */}
            <div className="p-2">
              {isDisplayLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading games...</span>
                </div>
              ) : (
                <>
                  {/* Show games grouped by provider */}
                  {Object.entries(gamesByProvider).map(([provName, games]) => (
                    <div key={provName} className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-foreground">{provName}</span>
                        <span className="text-[10px] text-muted-foreground">{games.length} games</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
                        {games.map((game) => (
                          <GameCard key={game.game_uid} game={game} onLaunch={handleGameLaunch} launchStatus={launchStatuses[game.game_uid] || "idle"} dbFallbacks={dbFallbacks} dbProviderIcons={dbProviderIcons} activeCategory={activeCategory} />
                        ))}
                      </div>
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <span className="text-4xl mb-3">🔍</span>
                      <p className="text-sm font-medium text-muted-foreground">No games found</p>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="mt-2 text-xs text-primary hover:underline">
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
      )}
      <BottomNav />
    </div>
  );
};

// Premium fallback images by game name keyword
import fallbackSlots from "@/assets/fallback-slots.jpg";
import fallbackCrash from "@/assets/fallback-crash.jpg";
import fallbackFishing from "@/assets/fallback-fishing.jpg";
import fallbackLive from "@/assets/fallback-live.jpg";
import fallbackCard from "@/assets/fallback-card.jpg";
import fallbackArcade from "@/assets/fallback-arcade.jpg";
import fallbackTable from "@/assets/fallback-table.jpg";
import fallbackInstant from "@/assets/fallback-instant.jpg";

// Provider-specific branded logo fallbacks
import providerSpribe from "@/assets/provider-spribe.jpg";
import providerJili from "@/assets/provider-jili.jpg";
import providerJdb from "@/assets/provider-jdb.jpg";
import providerEvolution from "@/assets/provider-evolution.jpg";
import providerEzugi from "@/assets/provider-ezugi.jpg";
import providerSagaming from "@/assets/provider-sagaming.jpg";
import providerSexy from "@/assets/provider-sexy.jpg";
import providerDreamgaming from "@/assets/provider-dreamgaming.jpg";
import providerMac88 from "@/assets/provider-mac88.jpg";
import providerCq9 from "@/assets/provider-cq9.jpg";
import providerPgsoft from "@/assets/provider-pgsoft.jpg";
import providerPragmatic from "@/assets/provider-pragmatic.jpg";
import providerHabanero from "@/assets/provider-habanero.jpg";
import providerFachai from "@/assets/provider-fachai.jpg";
import providerRich88 from "@/assets/provider-rich88.jpg";
import providerBgaming from "@/assets/provider-bgaming.jpg";
import providerSmartsoft from "@/assets/provider-smartsoft.jpg";

const FALLBACK_KEYWORDS: [string[], string][] = [
  [["fish", "fishing", "shark", "ocean", "mermaid", "dinosaur", "boom legend", "jackpot fishing", "mega fishing", "cai shen fishing", "happy fishing", "all-star fishing"], fallbackFishing],
  [["aviator", "crash", "rocket", "jet", "balloon", "limbo", "sky fall", "twist", "spaceman", "cash show", "go rush"], fallbackCrash],
  [["dragon tiger", "baccarat", "roulette", "sic bo", "lobby", "live", "dealer", "casino war", "hi lo"], fallbackLive],
  [["poker", "teenpatti", "teen patti", "andar bahar", "32 cards", "card", "blackjack", "rummy"], fallbackCard],
  [["dice", "mines", "plinko", "keno", "hilo", "coin", "wheel", "wingo", "lottery", "color game", "ludo", "7up7down", "tower"], fallbackInstant],
  [["slot", "fortune", "gold", "treasure", "gem", "ace", "buffalo", "empire", "tiger", "mahjong", "777", "888", "monkey", "book", "mario", "pharaoh", "neko", "aztec", "blossom", "fiesta", "billionaire", "lucky"], fallbackSlots],
  [["roulette", "sic bo", "jhandi", "matka"], fallbackTable],
];

// Provider → branded logo fallback: shows provider logo when game image is missing
const PROVIDER_LOGO_FALLBACK: Record<string, string> = {
  "Spribe": providerSpribe,
  "JILIGaming": providerJili,
  "JDBGaming": providerJdb,
  "Evolution Live": providerEvolution,
  "Ezugi": providerEzugi,
  "SaGaming": providerSagaming,
  "Sexy": providerSexy,
  "DreamGaming": providerDreamgaming,
  "MAC88": providerMac88,
  "CQ9": providerCq9,
  "PGSoft": providerPgsoft,
  "PragmaticPlay-Asia": providerPragmatic,
  "PragmaticPlayLive-Asia": providerPragmatic,
  "Habanero": providerHabanero,
  "FaChaiGaming": providerFachai,
  "Rich88": providerRich88,
  "Bgaming": providerBgaming,
  "Smartsoft": providerSmartsoft,
};

// Category → fallback image mapping: when browsing a specific category, use its fallback as default
const CATEGORY_FALLBACK: Record<string, string> = {
  live: fallbackLive,
  slots: fallbackSlots,
  crash: fallbackCrash,
  fishing: fallbackFishing,
  arcade: fallbackArcade,
};

function getFallbackImage(
  gameName: string,
  providerName: string,
  activeCategory: string,
  dbFallbacks: { keywords: string[]; image_url: string }[] = [],
  dbProviderIcons: Record<string, string> = {},
): string {
  const lower = gameName.toLowerCase();
  const provKey = normalizeProviderKey(providerName);

  // 1. DB-managed keyword fallbacks (highest priority — admin-customizable)
  for (const fb of dbFallbacks) {
    if (fb.keywords.some(k => lower.includes(k.toLowerCase()))) return fb.image_url;
  }

  // 2. Game-name keyword matching (hardcoded)
  for (const [keywords, img] of FALLBACK_KEYWORDS) {
    if (keywords.some(k => lower.includes(k))) return img;
  }

  // 3. DB-managed provider logo (admin-uploaded)
  if (dbProviderIcons[provKey]) return dbProviderIcons[provKey];

  // 4. Hardcoded provider-specific branded logo
  if (PROVIDER_LOGO_FALLBACK[providerName]) return PROVIDER_LOGO_FALLBACK[providerName];

  // 5. Active category-based fallback
  if (CATEGORY_FALLBACK[activeCategory]) return CATEGORY_FALLBACK[activeCategory];

  // 6. Default
  return fallbackArcade;
}

// Responsive sizes matching grid: 3col mobile, 4col sm, 5col md, 6col lg, 8col xl
const IMG_SIZES = "(max-width: 639px) 33vw, (max-width: 767px) 25vw, (max-width: 1023px) 20vw, (max-width: 1279px) 16.6vw, 12.5vw";

// Visibility hook — only renders card content when near viewport
function useInView(rootMargin = "200px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

// Individual game card component with real THRVEX images
const GameCard = memo(function GameCard({ game, onLaunch, launchStatus, dbFallbacks = [], dbProviderIcons = {}, activeCategory = "all" }: {
  game: ThrvexGame;
  onLaunch: (g: ThrvexGame) => void;
  launchStatus: LaunchStatus;
  dbFallbacks?: { keywords: string[]; image_url: string }[];
  dbProviderIcons?: Record<string, string>;
  activeCategory?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isLaunching = launchStatus === "loading";
  const fallbackImg = getFallbackImage(game.game_name, game.provider_name, activeCategory, dbFallbacks, dbProviderIcons);
  const { ref, inView } = useInView();

  return (
    <div ref={ref}>
      <button
        onClick={() => onLaunch(game)}
        disabled={isLaunching}
        className={`group relative w-full overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md hover:scale-[1.03] ${
          launchStatus === "success" ? "border-green-500 ring-1 ring-green-500/40" :
          launchStatus === "error" ? "border-destructive ring-1 ring-destructive/40" :
          "border-border hover:border-primary/40"
        } ${isLaunching ? "pointer-events-none" : ""}`}
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {/* Skeleton placeholder */}
          {!imgLoaded && (
            <div className="absolute inset-0 animate-pulse">
              <div className="h-full w-full bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-muted-foreground/15" />
              </div>
              <div className="absolute bottom-2 left-2 right-2 space-y-1">
                <div className="h-1.5 w-3/4 rounded bg-muted-foreground/15" />
                <div className="h-1.5 w-1/2 rounded bg-muted-foreground/10" />
              </div>
            </div>
          )}

          {inView && (
            <>
              {game.image && !imgError ? (
                <img
                  src={game.image}
                  alt={game.game_name}
                  className={`h-full w-full object-cover transition-opacity duration-300 ease-out ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                  loading="lazy"
                  decoding="async"
                  sizes={IMG_SIZES}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => { setImgError(true); setImgLoaded(true); }}
                />
              ) : (
                <div className="h-full w-full relative overflow-hidden">
                  <img
                    src={fallbackImg}
                    alt={game.game_name}
                    className={`h-full w-full object-cover transition-opacity duration-300 ease-out ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                    loading="lazy"
                    decoding="async"
                    sizes={IMG_SIZES}
                    onLoad={() => setImgLoaded(true)}
                  />
                  {/* Game name overlay on fallback */}
                  {imgLoaded && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end pb-2 animate-fade-in">
                      <div className="rounded-md px-2 py-1 bg-black/40 backdrop-blur-sm border border-white/15">
                        <span className="text-[9px] sm:text-[10px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] leading-none tracking-wide">
                          {game.game_name.length > 14
                            ? game.game_name.slice(0, 14) + "…"
                            : game.game_name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Provider badge */}
          <span className={`absolute top-1 left-1 bg-black/50 rounded px-1 py-0.5 text-[5px] sm:text-[6px] text-white font-bold uppercase tracking-wider backdrop-blur-sm transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}>
            {game.provider_name}
          </span>
        </div>
        <div className="px-1 py-1.5 text-center bg-card">
          <p className="text-[9px] sm:text-[10px] font-semibold text-foreground truncate leading-tight">{game.game_name}</p>
        </div>

        {/* Launch status overlay */}
        {launchStatus !== "idle" && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ${
            launchStatus === "loading" ? "bg-black/60 backdrop-blur-[2px]" :
            launchStatus === "success" ? "bg-green-900/70 backdrop-blur-[2px]" :
            "bg-red-900/60 backdrop-blur-[2px]"
          }`}>
            {launchStatus === "loading" && (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-white mb-1" />
                <span className="text-[9px] font-bold text-white/90">Launching...</span>
              </>
            )}
            {launchStatus === "success" && (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-400 mb-1 animate-in zoom-in-50 duration-300" />
                <span className="text-[9px] font-bold text-green-200">Opening Game</span>
              </>
            )}
            {launchStatus === "error" && (
              <>
                <XCircle className="h-5 w-5 text-red-400 mb-1" />
                <span className="text-[8px] font-bold text-red-200">Failed</span>
                <span className="text-[7px] text-red-300/80 mt-0.5">Tap to retry</span>
              </>
            )}
          </div>
        )}

        {/* Hover overlay (only when idle) */}
        {launchStatus === "idle" && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground shadow-lg">
              PLAY
            </span>
          </div>
        )}
      </button>
    </div>
  );
});

export default Casino;