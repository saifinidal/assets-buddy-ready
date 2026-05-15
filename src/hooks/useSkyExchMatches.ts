import { useEffect, useState, useCallback } from "react";

const PROXY_BASE = "https://api.thrvex.site/annaexch/annaexch.php";

export type SkySport = "cricket" | "tennis" | "soccer" | "horseracing" | "election";

export type SkyCategory = "real" | "srl" | "virtual";

export interface SkyEvent {
  id: number;
  name: string;
  team1: string;
  team2: string;
  competitionName: string;
  openDate: string;
  openDateStr: string;
  isInPlay: boolean;
  isManual: boolean;
  category: SkyCategory;
  hasBookmaker: boolean;
  hasFancy: boolean;
  hasSportsBook: boolean;
  /** Embedded Match Odds (exchange) extracted from event listing.
   *  Available even when bookmaker is closed. */
  matchOdds: SkyOdds[];
  matchOddsMarketName: string;
}

export interface SkyOdds {
  selectionId: number;
  runnerName: string;
  status: number;          // 1 = active, 2 = suspended
  back: (number | null)[]; // [best, 2nd, 3rd]
  lay: (number | null)[];
}

interface RawEvent {
  id: number;
  name: string;
  competitionName: string;
  openDate: string;
  openDateStr: string;
  isInPlay: number | null;
  isManualEvent: boolean;
  isElectronic?: number;
  hasBookMakerMarkets: boolean;
  hasInPlayBookMakerMarkets: boolean;
  hasFancyBetMarkets: boolean;
  hasInPlayFancyBetMarkets: boolean;
  hasSportsBookMarkets: boolean;
  markets?: RawMarket[];
}

interface RawMarket {
  marketId: string;
  marketType: string;
  marketName: string;
  status: number;
  selections?: RawSelection[];
}

interface RawSelection {
  selectionId: number;
  runnerName: string;
  status: number;
  availableToBack?: { price: number; size: number }[];
  availableToLay?: { price: number; size: number }[];
}

const sportTypeMap: Record<SkySport, number> = {
  cricket: 4,
  tennis: 2,
  soccer: 1,
  horseracing: 7,
  election: 500,
};

function parseOddsArray(jsonStr: string | null | undefined): (number | null)[] {
  if (!jsonStr) return [null, null, null];
  try {
    const arr = JSON.parse(jsonStr) as string[];
    return [0, 1, 2].map((i) => {
      const v = arr[i];
      const n = v ? parseFloat(v) : NaN;
      return Number.isFinite(n) ? n : null;
    });
  } catch {
    return [null, null, null];
  }
}

function extractMatchOdds(e: RawEvent): { odds: SkyOdds[]; marketName: string } {
  const market = e.markets?.find((m) => m.marketType === "MATCH_ODDS") || e.markets?.[0];
  if (!market || !market.selections) return { odds: [], marketName: "Match Odds" };
  const odds: SkyOdds[] = market.selections.map((s) => {
    const back = (s.availableToBack || []).map((b) => (Number.isFinite(b.price) ? b.price : null));
    const lay = (s.availableToLay || []).map((l) => (Number.isFinite(l.price) ? l.price : null));
    while (back.length < 3) back.push(null);
    while (lay.length < 3) lay.push(null);
    return {
      selectionId: s.selectionId,
      runnerName: s.runnerName,
      status: s.status,
      back,
      lay,
    };
  });
  return { odds, marketName: market.marketName || "Match Odds" };
}

/** Deterministic pseudo-random in [0,1) from a string. Drifts slowly over time so odds "move". */
function seedFromString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const drift = Math.floor(Date.now() / 30000); // changes every 30s
  h ^= drift;
  return ((h >>> 0) % 10000) / 10000;
}

/** Synthesize fair odds for SRL/virtual matches without real markets. */
export function synthesizeOdds(
  eventId: number,
  team1: string,
  team2: string,
  withDraw: boolean
): SkyOdds[] {
  const r1 = seedFromString(`${eventId}|${team1}`);
  const r2 = seedFromString(`${eventId}|${team2}`);
  const back1 = +(1.80 + r1 * 0.40).toFixed(2);
  const back2 = +(1.80 + r2 * 0.40).toFixed(2);
  const lay1 = +(back1 + 0.04).toFixed(2);
  const lay2 = +(back2 + 0.04).toFixed(2);
  const odds: SkyOdds[] = [
    {
      selectionId: eventId * 10 + 1,
      runnerName: team1 || "Home",
      status: 1,
      back: [back1, +(back1 - 0.02).toFixed(2), +(back1 - 0.04).toFixed(2)],
      lay: [lay1, +(lay1 + 0.02).toFixed(2), +(lay1 + 0.04).toFixed(2)],
    },
    {
      selectionId: eventId * 10 + 2,
      runnerName: team2 || "Away",
      status: 1,
      back: [back2, +(back2 - 0.02).toFixed(2), +(back2 - 0.04).toFixed(2)],
      lay: [lay2, +(lay2 + 0.02).toFixed(2), +(lay2 + 0.04).toFixed(2)],
    },
  ];
  if (withDraw) {
    const rd = seedFromString(`${eventId}|draw`);
    const backD = +(3.00 + rd * 0.80).toFixed(2);
    odds.push({
      selectionId: eventId * 10 + 3,
      runnerName: "The Draw",
      status: 1,
      back: [backD, +(backD - 0.05).toFixed(2), +(backD - 0.10).toFixed(2)],
      lay: [+(backD + 0.10).toFixed(2), +(backD + 0.15).toFixed(2), +(backD + 0.20).toFixed(2)],
    });
  }
  return odds;
}

function normalizeEvent(e: RawEvent): SkyEvent {
  const parts = (e.name || "").split(" v ");
  const { odds, marketName } = extractMatchOdds(e);
  const isManual = !!e.isManualEvent;
  const haystack = `${e.name || ""} ${e.competitionName || ""}`.toUpperCase();
  let category: SkyCategory = "real";
  if (isManual) {
    category = haystack.includes("SRL") ? "srl" : "virtual";
  }
  return {
    id: e.id,
    name: e.name,
    team1: (parts[0] || "").trim(),
    team2: (parts[1] || "").trim(),
    competitionName: e.competitionName || "",
    openDate: e.openDate || "",
    openDateStr: e.openDateStr || "",
    isInPlay: e.isInPlay === 1,
    isManual,
    category,
    hasBookmaker: !!(e.hasBookMakerMarkets || e.hasInPlayBookMakerMarkets),
    hasFancy: !!(e.hasFancyBetMarkets || e.hasInPlayFancyBetMarkets),
    hasSportsBook: !!e.hasSportsBookMarkets,
    matchOdds: odds,
    matchOddsMarketName: marketName,
  };
}

export function useSkyExchMatches(sport: SkySport, intervalMs = 15000) {
  const [events, setEvents] = useState<SkyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch(`${PROXY_BASE}?api=${sport}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const list: RawEvent[] = data.events || [];

      // Filter out stale/stuck matches whose openDate is more than 24 hours
      // in the past. The upstream feed sometimes leaves old fixtures flagged
      // as in-play for days or weeks. 24h is wide enough to keep today's
      // long-running live matches (test cricket, multi-session tournaments)
      // but kills the months-old stuck entries.
      const STALE_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();
      const fresh = list.filter((e) => {
        if (!e.openDate) return true;
        const t = new Date(e.openDate).getTime();
        if (!Number.isFinite(t)) return true;
        return now - t < STALE_MS;
      });

      setEvents(fresh.map(normalizeEvent));
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    setLoading(true);
    fetchData();
    if (intervalMs > 0) {
      const t = setInterval(fetchData, intervalMs);
      return () => clearInterval(t);
    }
  }, [fetchData, intervalMs]);

  return { events, loading, error, refetch: fetchData };
}

export function useSkyExchOdds(eventId: number | null, sport: SkySport, intervalMs = 5000) {
  const [odds, setOdds] = useState<SkyOdds[]>([]);
  const [marketName, setMarketName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const eventType = sportTypeMap[sport];

  const fetchOdds = useCallback(async () => {
    if (!eventId) return;
    try {
      const resp = await fetch(
        `${PROXY_BASE}?api=bookmaker&eventType=${eventType}&eventId=${eventId}`
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const market = data?.bookMakerMarket?.markets?.[0];
      const sels = data?.bookMakerSelection?.selections || [];
      setMarketName(market?.marketName || "Bookmaker");
      setOdds(
        sels.map((s: any) => ({
          selectionId: s.selectionId,
          runnerName: s.runnerName,
          status: s.status,
          back: parseOddsArray(s.backOddsInfo),
          lay: parseOddsArray(s.layOddsInfo),
        }))
      );
    } catch (e) {
      console.error("odds fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, [eventId, eventType]);

  useEffect(() => {
    if (!eventId) {
      setOdds([]);
      return;
    }
    setLoading(true);
    fetchOdds();
    if (intervalMs > 0) {
      const t = setInterval(fetchOdds, intervalMs);
      return () => clearInterval(t);
    }
  }, [eventId, fetchOdds, intervalMs]);

  return { odds, marketName, loading, refetch: fetchOdds };
}
