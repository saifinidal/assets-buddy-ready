import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/loose";

export interface ResultItem {
  eventName: string;
  eventDate: string;
  resultItem1: string;
  resultItem2: string;
}

export type ResultsSport = "cricket" | "tennis" | "soccer";

export interface ResultsBuckets {
  today: ResultItem[];
  yesterday: ResultItem[];
}

interface ResultsResponse {
  success?: boolean;
  error?: string;
  data?: Record<string, ResultsBuckets | undefined>;
}

/**
 * Fetch the today + yesterday results buckets for a single sport from the
 * results API. Auto-refreshes every 60s.
 */
export function useResultsList(sport: ResultsSport, intervalMs = 60_000) {
  const [data, setData] = useState<ResultsBuckets>({ today: [], yesterday: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("annaexch-results-cache");
      if (error) throw error;

      const json = data as ResultsResponse | null;
      if (!json?.success || !json.data) {
        throw new Error(json?.error || "Failed to load results");
      }

      const sec: ResultsBuckets = json.data[sport] ?? { today: [], yesterday: [] };
      setData({
        today: sec.today || [],
        yesterday: sec.yesterday || [],
      });
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load results");
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

  return { data, loading, error, refetch: fetchData };
}
