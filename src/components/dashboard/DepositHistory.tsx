import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/loose";
import { ArrowLeft, ArrowDownCircle, IndianRupee, Landmark, Bitcoin, Search, Loader2, Copy, CheckCircle, Clock, FileText, Hash, Wallet, Network, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

interface DepositRow {
  id: string;
  amount: number;
  method: string | null;
  utr: string | null;
  status: string | null;
  created_at: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  summary: string;
  actor_name: string | null;
  actor_role: string | null;
  created_at: string;
}

type MethodFilter = "all" | "upi" | "bank" | "crypto";

interface Props {
  profileId: string;
  onClose: () => void;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-[hsl(var(--live)/.12)] text-[hsl(var(--live))] border-[hsl(var(--live)/.25)]",
    pending: "bg-[hsl(var(--highlight)/.12)] text-[hsl(var(--highlight))] border-[hsl(var(--highlight)/.25)]",
    rejected: "bg-[hsl(var(--live-red)/.12)] text-[hsl(var(--live-red))] border-[hsl(var(--live-red)/.25)]",
  };
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${map[status] || map.pending}`}>
      {status}
    </span>
  );
}

function MethodIcon({ method }: { method: string | null }) {
  const m = (method || "").toLowerCase();
  if (m === "crypto") return <Bitcoin className="h-4 w-4 text-[hsl(var(--live))]" />;
  if (m === "bank") return <Landmark className="h-4 w-4 text-accent" />;
  return <IndianRupee className="h-4 w-4 text-primary" />;
}

export function DepositHistory({ profileId, onClose }: Props) {
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MethodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [selected, setSelected] = useState<DepositRow | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("deposits")
        .select("id, amount, method, utr, status, created_at")
        .eq("profile_id", profileId)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        if (error) toast({ title: "Error", description: "Could not load deposits", variant: "destructive" });
        setRows((data as DepositRow[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profileId, toast]);

  // Load audit log + payment account info when a deposit is selected
  useEffect(() => {
    if (!selected) {
      setAudit([]);
      setAccountInfo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setAuditLoading(true);
      // Audit log: try matching by target_id = deposit.id (best-effort, may be empty for users without admin RLS)
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("id, action, summary, actor_name, actor_role, created_at")
        .eq("target_id", selected.id)
        .order("created_at", { ascending: false })
        .limit(20);

      // Active payment account of same method (for reference)
      const { data: accts } = await supabase
        .from("payment_accounts")
        .select("method, account_name, account_number, ifsc_code, bank_name, upi_id, crypto_currency, crypto_network, wallet_address")
        .eq("method", (selected.method || "").toLowerCase())
        .eq("is_active", true)
        .limit(1);

      if (!cancelled) {
        setAudit((logs as AuditEntry[]) || []);
        setAccountInfo(accts?.[0] || null);
        setAuditLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selected]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter !== "all" && (r.method || "").toLowerCase() !== filter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!`${r.utr || ""} ${r.id}`.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [rows, filter, statusFilter, search]);

  const counts = useMemo(() => ({
    all: rows.length,
    upi: rows.filter((r) => (r.method || "").toLowerCase() === "upi").length,
    bank: rows.filter((r) => (r.method || "").toLowerCase() === "bank").length,
    crypto: rows.filter((r) => (r.method || "").toLowerCase() === "crypto").length,
  }), [rows]);

  const totals = useMemo(() => ({
    approved: filtered.filter((r) => r.status === "approved").reduce((s, r) => s + Number(r.amount), 0),
    pending: filtered.filter((r) => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0),
  }), [filtered]);

  const copy = (txt: string, key: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <ArrowDownCircle className="h-4 w-4 text-[hsl(var(--live))]" />
            Deposit History
          </h3>
          <p className="text-[10px] text-muted-foreground">Tap any deposit for full details</p>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Approved Total</p>
          <p className="text-base font-bold text-[hsl(var(--live))]">₹{totals.approved.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pending</p>
          <p className="text-base font-bold text-[hsl(var(--highlight))]">₹{totals.pending.toLocaleString()}</p>
        </div>
      </div>

      {/* Method Tabs */}
      <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-secondary/50 p-1">
        {(["all", "upi", "bank", "crypto"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase transition-all ${
              filter === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m} <span className="opacity-60 font-normal">({counts[m]})</span>
          </button>
        ))}
      </div>

      {/* Status filter + Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search UTR / TXID / ID"
            className="h-9 pl-8 text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-9 rounded-md border border-border bg-background px-2 text-xs font-semibold capitalize"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <ArrowDownCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No deposits found</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">Try changing filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="w-full text-left rounded-xl border border-border bg-card p-3 hover:bg-secondary/30 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                  <MethodIcon method={r.method} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground capitalize">{r.method || "—"}</p>
                    <StatusPill status={r.status || "pending"} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {r.created_at ? new Date(r.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
                <p className="text-sm font-bold text-[hsl(var(--live))] tabular-nums">
                  +₹{Number(r.amount).toLocaleString()}
                </p>
              </div>
              {r.utr && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-secondary/50 px-2.5 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                      {(r.method || "").toLowerCase() === "crypto" ? "TXID" : "UTR"}
                    </p>
                    <p className="text-[11px] font-mono text-foreground truncate">{r.utr}</p>
                  </div>
                  <span
                    onClick={(e) => { e.stopPropagation(); copy(r.utr!, r.id); }}
                    className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-card border border-border hover:bg-secondary transition-colors cursor-pointer"
                    title="Copy"
                  >
                    {copied === r.id ? <CheckCircle className="h-3 w-3 text-[hsl(var(--live))]" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DrawerContent className="max-h-[90vh]">
          {selected && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle className="flex items-center gap-2">
                  <MethodIcon method={selected.method} />
                  <span className="capitalize">{selected.method || "Deposit"} Detail</span>
                  <StatusPill status={selected.status || "pending"} />
                </DrawerTitle>
                <DrawerDescription className="text-[11px] font-mono">ID: {selected.id}</DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-6 space-y-4 overflow-y-auto">
                {/* Amount Summary */}
                <div className="rounded-xl border border-border bg-gradient-to-br from-card to-secondary/30 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p>
                  <p className="font-display text-3xl font-bold text-[hsl(var(--live))] tabular-nums">
                    +₹{Number(selected.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <p className="text-muted-foreground">Fees</p>
                      <p className="font-bold text-foreground">₹0.00</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Net Credited</p>
                      <p className="font-bold text-foreground">₹{Number(selected.amount).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Meta */}
                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                  <Row icon={<Clock className="h-3.5 w-3.5" />} label="Submitted">
                    {selected.created_at ? new Date(selected.created_at).toLocaleString("en-IN") : "—"}
                  </Row>
                  <Row icon={<Receipt className="h-3.5 w-3.5" />} label="Method">
                    <span className="capitalize">{selected.method || "—"}</span>
                  </Row>
                  {selected.utr && (
                    <Row icon={<Hash className="h-3.5 w-3.5" />} label={(selected.method || "").toLowerCase() === "crypto" ? "Transaction Hash" : "UTR"}>
                      <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] truncate max-w-[180px]">{selected.utr}</span>
                        <button onClick={() => copy(selected.utr!, "modal-" + selected.id)} className="flex h-5 w-5 items-center justify-center rounded bg-secondary hover:bg-secondary/80">
                          {copied === "modal-" + selected.id ? <CheckCircle className="h-3 w-3 text-[hsl(var(--live))]" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </span>
                    </Row>
                  )}
                </div>

                {/* Account info */}
                {accountInfo && (
                  <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Wallet className="h-3 w-3" /> Payment Destination
                    </p>
                    {accountInfo.method === "crypto" ? (
                      <>
                        <Mini label="Currency" value={accountInfo.crypto_currency} />
                        <Mini label="Network" value={accountInfo.crypto_network} icon={<Network className="h-3 w-3" />} />
                        <Mini label="Wallet" value={accountInfo.wallet_address} mono onCopy={(v) => copy(v, "wallet")} copied={copied === "wallet"} />
                      </>
                    ) : accountInfo.method === "bank" ? (
                      <>
                        <Mini label="Bank" value={accountInfo.bank_name} />
                        <Mini label="A/C Name" value={accountInfo.account_name} />
                        <Mini label="A/C No." value={accountInfo.account_number} mono />
                        <Mini label="IFSC" value={accountInfo.ifsc_code} mono />
                      </>
                    ) : (
                      <>
                        <Mini label="UPI ID" value={accountInfo.upi_id} mono onCopy={(v) => copy(v, "upi")} copied={copied === "upi"} />
                        <Mini label="Name" value={accountInfo.account_name} />
                      </>
                    )}
                  </div>
                )}

                {/* Audit log */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                    <FileText className="h-3 w-3" /> Audit Trail
                  </p>
                  {auditLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : audit.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground py-2 text-center">
                      No admin actions recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {audit.map((a) => (
                        <div key={a.id} className="rounded-lg bg-secondary/40 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-bold text-foreground">{a.action}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {new Date(a.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{a.summary}</p>
                          {a.actor_name && (
                            <p className="text-[9px] text-muted-foreground/80 mt-1">
                              by <span className="font-semibold text-foreground/70">{a.actor_name}</span>
                              {a.actor_role && <span className="ml-1 uppercase">({a.actor_role})</span>}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">{icon}{label}</span>
      <span className="text-[11px] font-semibold text-foreground">{children}</span>
    </div>
  );
}

function Mini({ label, value, mono, icon, onCopy, copied }: { label: string; value: string | null; mono?: boolean; icon?: React.ReactNode; onCopy?: (v: string) => void; copied?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">{icon}{label}</p>
      <div className="flex items-center gap-1.5 min-w-0">
        <p className={`text-[11px] text-foreground truncate max-w-[180px] ${mono ? "font-mono" : "font-semibold"}`}>{value}</p>
        {onCopy && (
          <button onClick={() => onCopy(value)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-card border border-border">
            {copied ? <CheckCircle className="h-3 w-3 text-[hsl(var(--live))]" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
}
