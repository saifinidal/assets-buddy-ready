import { useMemo } from "react";
import { ALL_GAMES, type CasinoGame } from "@/data/casinoGames";

export interface ThrvexGame {
  id: string;
  game_uid: string;
  provider_name: string;
  game_name: string;
  image?: string | null;
}

// Map local provider name -> name expected by Casino page (ALLOWED_PROVIDERS)
const PROVIDER_NAME_MAP: Record<string, string> = {
  JILI: "JILIGaming",
  JDB: "JDBGaming",
};

function adapt(g: CasinoGame): ThrvexGame {
  const provider_name = PROVIDER_NAME_MAP[g.provider] || g.provider;
  return {
    id: g.gameId,
    game_uid: g.gameId,
    provider_name,
    game_name: g.name,
    image: g.img,
  };
}

const ADAPTED: ThrvexGame[] = ALL_GAMES.map(adapt);

const ALL_PROVIDERS: string[] = Array.from(
  new Set(ADAPTED.map((g) => g.provider_name))
);

export function useThrvexProviders() {
  return { providers: ALL_PROVIDERS, loading: false };
}

export function useThrvexGames(provider: string | null) {
  const games = useMemo(
    () => (provider ? ADAPTED.filter((g) => g.provider_name === provider) : []),
    [provider]
  );
  return { games, loading: false };
}

export function useThrvexMultiGames(providers: string[]) {
  const gamesByProvider = useMemo(() => {
    const map: Record<string, ThrvexGame[]> = {};
    for (const p of providers) {
      map[p] = ADAPTED.filter((g) => g.provider_name === p);
    }
    return map;
  }, [providers.join(",")]);
  return { gamesByProvider, loading: false };
}

// Helper used by components that fetch directly from the edge function URL.
// Exposed so we can swap in local data without changing many callers.
export function getLocalThrvexGames(providers: string[]): Record<string, ThrvexGame[]> {
  const map: Record<string, ThrvexGame[]> = {};
  for (const p of providers) {
    map[p] = ADAPTED.filter((g) => g.provider_name === p);
  }
  return map;
}

export function getLocalThrvexGamesFlat(provider: string): ThrvexGame[] {
  return ADAPTED.filter((g) => g.provider_name === provider);
}
