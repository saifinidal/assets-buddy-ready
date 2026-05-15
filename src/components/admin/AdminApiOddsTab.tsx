import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useSkyExchMatches, type SkySport } from "@/hooks/useSkyExchMatches";
import { useMarketOddsBulk, type MarketOddsRow } from "@/hooks/useMarketOdds";
import { RefreshCw, Save, Ban, CheckCircle2, Trophy, Loader2 } from "lucide-react";

const sports: { id: SkySport; label: string; icon: string }[] = [
  { id: "cricket", label: "Cricket", icon: "🏏" },
  { id: "tennis", label: "Tennis", icon: "🎾" },
  { id: "soccer", label: "Soccer", icon: "⚽" },
];

export function AdminApiOddsTab() {
  const [sport, setSport] = useState<SkySport>("cricket");
  const [seeding, setSeeding] = useState(false);
  const [settling, setSettling] = useState(false);
  const { events, loading, refetch } = useSkyExchMatches(sport, 30000);
  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const { rowsByEvent, refetch: refetchOdds } = useMarketOddsBulk(eventIds);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-market-odds");
      if (error) throw error;
      toast({ title: "Seeded ✅", description: `Default odds created for new events` });
      refetchOdds();
    } catch (e: any) {
      toast({ title: "Seed Failed", description: e.message, variant: "destructive" });
    }
    setSeeding(false);
  };

  const handleSettleFromApi = async () => {
    setSettling(true);
    try {
      const { data, error } = await supabase.functions.invoke("annaexch-settle-results");
      if (error) throw error;
      const r: any = data;
      toast({
        title: "Settlement Run ✅",
        description: `Settled: ${r?.settled_count || 0}, Voided: ${r?.voided_count || 0}`,
      });
    } catch (e: any) {
      toast({ title: "Settle Failed", description: e.message, variant: "destructive" });
    }
    setSettling(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground mr-auto">
          API Markets — House Odds
        </h2>
        <Button size="sm" variant="outline" onClick={() => { refetch(); refetchOdds(); }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
        </Button>
        <Button size="sm" onClick={handleSeed} disabled={seeding}>
          {seeding ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Auto-Seed
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSettleFromApi} disabled={settling}>
          {settling ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trophy className="h-3.5 w-3.5 mr-1" />}
          Settle from API
        </Button>
      </div>

      <div className="flex gap-1">
        {sports.map((s) => (
          <button
            key={s.id}
            onClick={() => setSport(s.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              sport === s.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {loading && events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs">Loading events...</div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 80).map((ev) => (
            <EventOddsCard
              key={ev.id}
              eventId={String(ev.id)}
              team1={ev.team1}
              team2={ev.team2}
              league={ev.competitionName}
              isInPlay={ev.isInPlay}
              openDateStr={ev.openDateStr}
              rows={rowsByEvent[String(ev.id)] || []}
              onChanged={refetchOdds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventOddsCard({
  eventId,
  team1,
  team2,
  league,
  isInPlay,
  openDateStr,
  rows,
  onChanged,
}: {
  eventId: string;
  team1: string;
  team2: string;
  league: string;
  isInPlay: boolean;
  openDateStr: string;
  rows: MarketOddsRow[];
  onChanged: () => void;
}) {
  const matchEvent = `${team1} vs ${team2}`;
  const hasOdds = rows.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-secondary/30 px-3 py-1.5">
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground truncate">{league}</p>
          <p className="text-xs font-semibold text-foreground truncate">
            {team1} vs {team2}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isInPlay ? (
            <span className="rounded bg-live-red/15 px-1.5 py-0.5 text-[9px] font-bold text-live-red">
              LIVE
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">{openDateStr}</span>
          )}
          {!hasOdds && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
              No DB Odds
            </span>
          )}
        </div>
      </div>

      {hasOdds ? (
        <div className="p-2 space-y-1.5">
          {rows.map((r) => (
            <OddsEditRow key={r.id} row={r} onChanged={onChanged} />
          ))}
          <SettleControls
            matchEvent={matchEvent}
            selections={rows.map((r) => r.selection)}
            onSettled={onChanged}
          />
        </div>
      ) : (
        <div className="p-3 text-[11px] text-muted-foreground italic">
          Not seeded yet — click <span className="font-bold">Auto-Seed</span> above.
        </div>
      )}
    </div>
  );
}

function OddsEditRow({ row, onChanged }: { row: MarketOddsRow; onChanged: () => void }) {
  const [back, setBack] = useState(String(row.back_odd));
  const [lay, setLay] = useState(String(row.lay_odd));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBack(String(row.back_odd));
    setLay(String(row.lay_odd));
  }, [row.back_odd, row.lay_odd]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("market_odds")
      .update({
        back_odd: parseFloat(back) || 0,
        lay_odd: parseFloat(lay) || 0,
        auto_generated: false,
      })
      .eq("id", row.id);
    setSaving(false);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Saved" });
      onChanged();
    }
  };

  const toggleSuspend = async () => {
    const { error } = await supabase
      .from("market_odds")
      .update({ is_suspended: !row.is_suspended })
      .eq("id", row.id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else onChanged();
  };

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-xs font-medium text-foreground truncate">{row.selection}</span>
      <input
        type="number"
        step="0.01"
        value={back}
        onChange={(e) => setBack(e.target.value)}
        disabled={row.is_suspended}
        className="h-7 w-16 rounded bg-back/10 px-1.5 text-[11px] font-bold text-back text-center border border-border disabled:opacity-40"
      />
      <input
        type="number"
        step="0.01"
        value={lay}
        onChange={(e) => setLay(e.target.value)}
        disabled={row.is_suspended}
        className="h-7 w-16 rounded bg-lay/10 px-1.5 text-[11px] font-bold text-lay text-center border border-border disabled:opacity-40"
      />
      <Button size="sm" variant="outline" className="h-7 px-2" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
      </Button>
      <Button
        size="sm"
        variant={row.is_suspended ? "destructive" : "ghost"}
        className="h-7 px-2"
        onClick={toggleSuspend}
        title={row.is_suspended ? "Resume" : "Suspend"}
      >
        {row.is_suspended ? <CheckCircle2 className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
      </Button>
    </div>
  );
}

function SettleControls({
  matchEvent,
  selections,
  onSettled,
}: {
  matchEvent: string;
  selections: string[];
  onSettled: () => void;
}) {
  const [winner, setWinner] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSettle = async () => {
    if (!winner) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("settle_bets_by_event", {
      _match_event: matchEvent,
      _winning_selection: winner,
    });
    setLoading(false);
    const r: any = data;
    if (error || !r?.success) {
      toast({ title: "Settle Failed", description: error?.message || r?.error, variant: "destructive" });
    } else {
      toast({ title: "Settled ✅", description: `${r.settled_count} bets settled — Winner: ${winner}` });
      onSettled();
    }
  };

  const handleVoid = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("void_bets_by_event", {
      _match_event: matchEvent,
    });
    setLoading(false);
    const r: any = data;
    if (error || !r?.success) {
      toast({ title: "Void Failed", description: error?.message || r?.error, variant: "destructive" });
    } else {
      toast({ title: "Voided", description: `${r.voided_count} bets refunded` });
      onSettled();
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
      <select
        value={winner}
        onChange={(e) => setWinner(e.target.value)}
        className="h-7 rounded bg-input px-2 text-[11px] text-foreground border border-border outline-none"
      >
        <option value="">Pick winner…</option>
        {selections.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <Button size="sm" className="h-7 text-[11px]" disabled={!winner || loading} onClick={handleSettle}>
        Settle
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={loading} onClick={handleVoid}>
        Void
      </Button>
    </div>
  );
}
