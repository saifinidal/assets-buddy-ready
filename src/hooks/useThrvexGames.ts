import { useState, useEffect } from "react";

export interface ThrvexGame {
  id: string;
  game_uid: string;
  provider_name: string;
  game_name: string;
  image?: string | null;
}

export function useThrvexProviders() {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const projId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const resp = await globalThis.fetch(
          `https://${projId}.supabase.co/functions/v1/thrvex-games?action=providers`
        );
        if (!resp.ok) { setProviders([]); return; }
        const json = await resp.json();
        setProviders(json.data || []);
      } catch (e) {
        console.error("Failed to fetch providers:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { providers, loading };
}

export function useThrvexGames(provider: string | null) {
  const [games, setGames] = useState<ThrvexGame[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provider) {
      setGames([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const projId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const resp = await globalThis.fetch(
          `https://${projId}.supabase.co/functions/v1/thrvex-games?action=games&provider=${encodeURIComponent(provider)}`
        );
        if (!resp.ok) { setGames([]); return; }
        const json = await resp.json();
        setGames(json.data || []);
      } catch (e) {
        console.error("Failed to fetch games:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [provider]);

  return { games, loading };
}

export function useThrvexMultiGames(providers: string[]) {
  const [gamesByProvider, setGamesByProvider] = useState<Record<string, ThrvexGame[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (providers.length === 0) {
      setGamesByProvider({});
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const projId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const resp = await globalThis.fetch(
          `https://${projId}.supabase.co/functions/v1/thrvex-games?action=multi_games&providers=${encodeURIComponent(providers.join(","))}`
        );
        if (!resp.ok) { setGamesByProvider({}); return; }
        const json = await resp.json();
        setGamesByProvider(json.data || {});
      } catch (e) {
        console.error("Failed to fetch multi games:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [providers.join(",")]);

  return { gamesByProvider, loading };
}
