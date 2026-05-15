import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/loose";

interface ResultItem {
  eventName: string;
  eventDate: string;
}

interface ResultsResponse {
  success?: boolean;
  data?: {
    [sport: string]: {
      today?: ResultItem[];
      yesterday?: ResultItem[];
    };
  };
}

/**
 * Normalize an event name for fuzzy matching:
 * - lowercase
 * - collapse whitespace
 * - normalize "v" / "vs" / "V" separator
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+v\s+/gi, " v ")
    .replace(/\s+vs\s+/gi, " v ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract a "league signature" — the part of the event name that identifies
 * the competition/teams pattern. We strip team-specific suffixes and keep
 * recognizable league markers (e.g. "SRL T20", "W", competition codes).
 */
function leagueSignature(name: string): string {
  const n = normalizeName(name);
  // Pull out distinctive markers
  const markers: string[] = [];
  if (/\bsrl\s+t20\b/.test(n)) markers.push("srl-t20");
  if (/\bsrl\b/.test(n)) markers.push("srl");
  if (/\bt20\b/.test(n)) markers.push("t20");
  if (/\bw\b/.test(n)) markers.push("w");
  return markers.join("|");
}

/**
 * Fetch event names (and league signatures) from the results API.
 * These are the matches that DO get settled — we use this as a whitelist.
 */
export function useResultsEventNames() {
  const [eventNames, setEventNames] = useState<Set<string>>(new Set());
  const [signatures, setSignatures] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchResults = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("annaexch-results-cache");
        if (error) return;
        const payload = data as ResultsResponse | null;
        if (!payload?.success || !payload.data) return;
        const names = new Set<string>();
        const sigs = new Set<string>();
        for (const sport of Object.keys(payload.data)) {
          for (const bucket of ["today", "yesterday"] as const) {
            const items = payload.data[sport]?.[bucket] || [];
            for (const item of items) {
              if (!item.eventName) continue;
              names.add(normalizeName(item.eventName));
              const sig = leagueSignature(item.eventName);
              if (sig) sigs.add(sig);
            }
          }
        }
        if (!cancelled) {
          setEventNames(names);
          setSignatures(sigs);
        }
      } catch (e) {
        console.error("Results fetch failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchResults();
    const interval = setInterval(fetchResults, 5 * 60 * 1000); // refresh every 5 min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  /**
   * Returns true if the given match name is expected to receive a result.
   * Match either by exact normalized name OR by league signature
   * (so future matches in the same league are also accepted).
   */
  const hasResultSupport = (matchName: string): boolean => {
    const n = normalizeName(matchName);
    if (eventNames.has(n)) return true;
    const sig = leagueSignature(matchName);
    if (sig && signatures.has(sig)) return true;
    // Fallback: extract team names and check if either team appears in any result
    const parts = n.split(" v ");
    if (parts.length === 2) {
      for (const known of eventNames) {
        const kparts = known.split(" v ");
        if (kparts.length !== 2) continue;
        if (kparts[0] === parts[0] || kparts[1] === parts[1] ||
            kparts[0] === parts[1] || kparts[1] === parts[0]) {
          return true;
        }
      }
    }
    return false;
  };

  return { eventNames, signatures, loading, hasResultSupport };
}
