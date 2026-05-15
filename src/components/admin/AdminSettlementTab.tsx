import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Trophy, CheckCircle, AlertTriangle, Loader2, Gavel, Users, Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuditLog } from "@/hooks/useAuditLog";

interface PendingEvent {
  match_event: string;
  match_id: string | null;
  bet_count: number;
  total_stake: number;
  selections: string[];
}

export function AdminSettlementTab() {
  const [events, setEvents] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleDialog, setSettleDialog] = useState<{ open: boolean; event: PendingEvent | null }>({
    open: false,
    event: null,
  });
  const [voidDialog, setVoidDialog] = useState<{ open: boolean; event: PendingEvent | null }>({
    open: false,
    event: null,
  });
  const [busy, setBusy] = useState(false);
  const [customWinner, setCustomWinner] = useState("");
  const audit = useAuditLog();

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bets")
      .select("match_event, match_id, selection, stake")
      .eq("result", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const grouped: Record<string, PendingEvent> = {};
    (data || []).forEach((b: any) => {
      const key = b.match_event;
      if (!grouped[key]) {
        grouped[key] = {
          match_event: b.match_event,
          match_id: b.match_id,
          bet_count: 0,
          total_stake: 0,
          selections: [],
        };
      }
      grouped[key].bet_count += 1;
      grouped[key].total_stake += Number(b.stake || 0);
      if (!grouped[key].selections.includes(b.selection)) {
        grouped[key].selections.push(b.selection);
      }
    });
    setEvents(Object.values(grouped));
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleSettle = async (winner: string) => {
    if (!settleDialog.event || !winner.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("settle_bets_by_event", {
        _match_event: settleDialog.event.match_event,
        _winning_selection: winner.trim(),
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({
          title: "Settled ✅",
          description: `${result.settled_count} bet(s) settled. Winner: ${winner}. Payout: ₹${result.total_payout || 0}`,
        });
        await audit("settle", `Settled "${settleDialog.event.match_event}" — winner: ${winner.trim()}`, {
          targetType: "match_event",
          targetId: settleDialog.event.match_event,
          metadata: { winner: winner.trim(), settled_count: result.settled_count, total_payout: result.total_payout },
        });
        setSettleDialog({ open: false, event: null });
        setCustomWinner("");
        fetchPending();
      } else {
        toast({ title: "Error", description: result?.error || "Failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const handleVoid = async () => {
    if (!voidDialog.event) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("void_bets_by_event", {
        _match_event: voidDialog.event.match_event,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({
          title: "Voided",
          description: `${result.voided_count} bet(s) refunded`,
        });
        await audit("void", `Voided bets for "${voidDialog.event.match_event}"`, {
          targetType: "match_event",
          targetId: voidDialog.event.match_event,
          metadata: { voided_count: result.voided_count },
        });
        setVoidDialog({ open: false, event: null });
        fetchPending();
      } else {
        toast({ title: "Error", description: result?.error || "Failed", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground text-xs">Loading pending bets...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-foreground">
          Bet Settlement
          <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            {events.length} pending event(s)
          </span>
        </h2>
        <Button size="sm" variant="outline" onClick={fetchPending} className="h-8 text-[11px] gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {events.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No pending bets to settle</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">All bets have been settled.</p>
          </div>
        )}

        {events.map((ev) => (
          <div
            key={ev.match_event}
            className="rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{ev.match_event}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[hsl(var(--highlight))]">
                    <Users className="h-3 w-3" /> {ev.bet_count} bet(s)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Stake: <span className="font-bold text-foreground">₹{ev.total_stake.toLocaleString()}</span>
                  </span>
                  {ev.match_id && (
                    <span className="text-[9px] text-muted-foreground/70 font-mono">#{ev.match_id}</span>
                  )}
                </div>
                {ev.selections.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ev.selections.map((s) => (
                      <span
                        key={s}
                        className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col gap-1.5">
                <Button
                  size="sm"
                  onClick={() => setSettleDialog({ open: true, event: ev })}
                  className="text-[11px] h-8 gap-1.5"
                >
                  <Gavel className="h-3.5 w-3.5" />
                  Settle
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVoidDialog({ open: true, event: ev })}
                  className="text-[11px] h-7 gap-1.5 text-destructive hover:text-destructive"
                >
                  <Ban className="h-3 w-3" />
                  Void
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Settle Dialog */}
      <Dialog
        open={settleDialog.open}
        onOpenChange={(open) => !busy && setSettleDialog({ open, event: open ? settleDialog.event : null })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Gavel className="h-4 w-4 text-primary" /> Declare Winner
            </DialogTitle>
          </DialogHeader>

          {settleDialog.event && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
                <p className="text-sm font-bold text-foreground">{settleDialog.event.match_event}</p>
                <p className="text-[10px] text-[hsl(var(--highlight))] font-bold mt-1">
                  {settleDialog.event.bet_count} pending bet(s) — ₹
                  {settleDialog.event.total_stake.toLocaleString()} staked
                </p>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--highlight)/.08)] border border-[hsl(var(--highlight)/.2)]">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--highlight))] shrink-0" />
                <p className="text-[10px] text-[hsl(var(--highlight))]">
                  This is irreversible. Back winners get paid; lay winners get paid; opposing side loses stake.
                </p>
              </div>

              <p className="text-xs font-bold text-center text-muted-foreground uppercase tracking-wider">
                Pick Winner from Selections
              </p>

              <div className="grid grid-cols-1 gap-2">
                {settleDialog.event.selections.map((sel) => (
                  <Button
                    key={sel}
                    variant="outline"
                    onClick={() => handleSettle(sel)}
                    disabled={busy}
                    className="h-11 text-sm font-bold justify-center border-2 hover:border-primary hover:bg-primary/10"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trophy className="h-4 w-4 mr-2 text-primary" />
                    )}
                    {sel}
                  </Button>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Or enter custom winner (must match selection name exactly)
                </p>
                <div className="flex gap-2">
                  <input
                    value={customWinner}
                    onChange={(e) => setCustomWinner(e.target.value)}
                    placeholder="e.g. Draw, Tie, etc."
                    className="flex-1 h-9 rounded-md bg-input px-3 text-xs border border-border focus:border-primary outline-none"
                  />
                  <Button
                    size="sm"
                    disabled={busy || !customWinner.trim()}
                    onClick={() => handleSettle(customWinner)}
                    className="h-9 text-xs"
                  >
                    Settle
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog
        open={voidDialog.open}
        onOpenChange={(open) => !busy && setVoidDialog({ open, event: open ? voidDialog.event : null })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm text-destructive">
              <Ban className="h-4 w-4" /> Void All Bets
            </DialogTitle>
          </DialogHeader>
          {voidDialog.event && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
                <p className="text-sm font-bold text-foreground">{voidDialog.event.match_event}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  All {voidDialog.event.bet_count} pending bet(s) will be refunded.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setVoidDialog({ open: false, event: null })}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleVoid}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Void & Refund"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
