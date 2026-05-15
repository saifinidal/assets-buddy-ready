import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/loose";

export interface LiveMatchRow {
  id: string;
  sport: string;
  sport_icon: string;
  league: string;
  team1: string;
  team2: string;
  score1: string;
  score2: string;
  status: string;
  team1_back: number;
  team1_lay: number;
  team2_back: number;
  team2_lay: number;
  draw_back: number | null;
  draw_lay: number | null;
  is_live: boolean;
  match_time: string;
  has_tv: boolean;
  has_bm: boolean;
  has_fancy: boolean;
  is_suspended: boolean;
  sort_order: number;
}

export function useLiveMatches() {
  const [matches, setMatches] = useState<LiveMatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("live_matches")
      .select("*")
      .eq("is_suspended", false)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setMatches((data || []) as unknown as LiveMatchRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();

    // Unique channel per hook instance to avoid "already subscribed" conflicts
    const channelName = `live_matches_changes_${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_matches" }, () => {
        fetchMatches();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { matches, loading, refetch: fetchMatches };
}
