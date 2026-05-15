import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MarketOddsRow {
  id: string;
  event_id: string;
  match_event: string;
  sport: string;
  selection: string;
  back_odd: number;
  lay_odd: number;
  sort_order: number;
  is_suspended: boolean;
  auto_generated: boolean;
  updated_at: string;
}

/**
 * Subscribe to DB-managed back/lay odds for a single API event.
 * Returns sorted selections with realtime updates.
 */
export function useMarketOdds(eventId: string | number | null) {
  const [rows, setRows] = useState<MarketOddsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const evId = eventId == null ? null : String(eventId);

  const fetchOdds = useCallback(async () => {
    if (!evId) return;
    const { data, error } = await supabase
      .from("market_odds")
      .select("*")
      .eq("event_id", evId)
      .order("sort_order", { ascending: true });
    if (!error && data) setRows(data as MarketOddsRow[]);
    setLoading(false);
  }, [evId]);

  useEffect(() => {
    if (!evId) {
      setRows([]);
      return;
    }
    setLoading(true);
    fetchOdds();
    const channel = supabase
      .channel(`market_odds:${evId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_odds", filter: `event_id=eq.${evId}` },
        () => fetchOdds()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [evId, fetchOdds]);

  return { selections: rows, loading, refetch: fetchOdds };
}

/**
 * Bulk fetch DB odds for many event ids (used on the list page).
 * Returns a map of event_id -> selections[]; subscribes for any change to the table.
 */
export function useMarketOddsBulk(eventIds: (string | number)[]) {
  const [rowsByEvent, setRowsByEvent] = useState<Record<string, MarketOddsRow[]>>({});
  const [loading, setLoading] = useState(false);
  const ids = useMemo(() => Array.from(new Set(eventIds.map(String))), [eventIds]);
  const idsKey = ids.join(",");

  const fetchAll = useCallback(async () => {
    if (ids.length === 0) {
      setRowsByEvent({});
      return;
    }
    const { data, error } = await supabase
      .from("market_odds")
      .select("*")
      .in("event_id", ids)
      .order("sort_order", { ascending: true });
    if (!error && data) {
      const map: Record<string, MarketOddsRow[]> = {};
      for (const r of data as MarketOddsRow[]) {
        (map[r.event_id] ||= []).push(r);
      }
      setRowsByEvent(map);
    }
    setLoading(false);
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    fetchAll();
    if (ids.length === 0) return;
    const channel = supabase
      .channel(`market_odds_bulk:${idsKey.slice(0, 60)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_odds" },
        (payload: any) => {
          const rec = (payload.new || payload.old) as MarketOddsRow | undefined;
          if (rec && ids.includes(rec.event_id)) fetchAll();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [idsKey, fetchAll]); // eslint-disable-line react-hooks/exhaustive-deps

  return { rowsByEvent, loading, refetch: fetchAll };
}
