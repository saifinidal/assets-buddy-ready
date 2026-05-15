import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Loader2, CreditCard, Edit2, Save,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type AccountType = "upi" | "bank" | "crypto";

interface PaymentAccount {
  id: string;
  type: AccountType;
  label: string;
  upi_id: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  holder_name: string | null;
  crypto_network: string | null;
  crypto_currency: string | null;
  wallet_address: string | null;
  qr_image_url: string | null;
  is_active: boolean;
  usage_count: number;
}

export function PaymentAccountsTab() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentAccount | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payment_accounts" as any)
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setAccounts((data as any[]).map((d: any) => ({
      ...d,
      type: d.method || d.type,
      label: d.account_name || d.label || "",
      usage_count: d.usage_count || 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const toggleActive = async (acc: PaymentAccount) => {
    await supabase
      .from("payment_accounts" as any)
      .update({ is_active: !acc.is_active } as any)
      .eq("id", acc.id);
    setAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, is_active: !a.is_active } : a))
    );
    toast({ title: !acc.is_active ? "Activated" : "Deactivated", description: acc.label || acc.upi_id || acc.wallet_address || "Account" });
  };

  const deleteAccount = async (id: string) => {
    await supabase.from("payment_accounts" as any).delete().eq("id", id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Deleted", description: "Payment account removed" });
  };

  const openEdit = (acc: PaymentAccount) => {
    setEditing(acc);
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const upiAccounts = accounts.filter((a) => a.type === "upi");
  const bankAccounts = accounts.filter((a) => a.type === "bank");
  const cryptoAccounts = accounts.filter((a) => a.type === "crypto");

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          Payment Accounts (UPI / Bank / Crypto)
        </h2>
        <Button size="sm" onClick={openNew} className="text-xs h-8 gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Account
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Multiple UPI / Bank / Crypto wallets add karein. Har deposit request pe automatic rotation se alag account dikhega.
      </p>

      <AccountSection title="UPI Accounts" accounts={upiAccounts} onToggle={toggleActive} onEdit={openEdit} onDelete={deleteAccount} />
      <AccountSection title="Bank Accounts" accounts={bankAccounts} onToggle={toggleActive} onEdit={openEdit} onDelete={deleteAccount} />
      <AccountSection title="Crypto Wallets" accounts={cryptoAccounts} onToggle={toggleActive} onEdit={openEdit} onDelete={deleteAccount} />

      {accounts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-xs">
          No payment accounts added yet. Click "Add Account" to start.
        </div>
      )}

      <AccountFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editing}
        onSaved={fetchAccounts}
      />
    </div>
  );
}

function AccountSection({
  title, accounts, onToggle, onEdit, onDelete,
}: {
  title: string;
  accounts: PaymentAccount[];
  onToggle: (a: PaymentAccount) => void;
  onEdit: (a: PaymentAccount) => void;
  onDelete: (id: string) => void;
}) {
  if (accounts.length === 0) return null;

  const subline = (acc: PaymentAccount) => {
    if (acc.type === "upi") return acc.upi_id || "";
    if (acc.type === "bank") return `${acc.bank_name || ""} • ${acc.account_number || ""}`;
    return `${acc.crypto_currency || ""} (${acc.crypto_network || ""}) • ${acc.wallet_address?.slice(0, 10) || ""}…`;
  };

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-surface px-3 py-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title} ({accounts.length})</h3>
      </div>
      <div className="divide-y divide-border">
        {accounts.map((acc) => (
          <div key={acc.id} className={`flex items-center justify-between px-3 py-2.5 ${!acc.is_active ? "opacity-50" : ""}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-foreground truncate">
                  {acc.label || (acc.type === "upi" ? acc.upi_id : acc.type === "bank" ? acc.bank_name : `${acc.crypto_currency} ${acc.crypto_network}`)}
                </p>
                {acc.is_active ? (
                  <span className="shrink-0 rounded-full bg-[hsl(var(--live))]/10 px-1.5 py-0.5 text-[9px] font-bold text-[hsl(var(--live))]">ACTIVE</span>
                ) : (
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">OFF</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {subline(acc)} • Used {acc.usage_count}x
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button onClick={() => onToggle(acc)} className="rounded p-1 hover:bg-surface" title="Toggle">
                {acc.is_active ? <ToggleRight className="h-5 w-5 text-[hsl(var(--live))]" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
              </button>
              <button onClick={() => onEdit(acc)} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-foreground" title="Edit">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete(acc.id)} className="rounded p-1 text-muted-foreground hover:bg-surface hover:text-destructive" title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountFormDialog({
  open, onClose, editing, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  editing: PaymentAccount | null;
  onSaved: () => void;
}) {
  const [type, setType] = useState<AccountType>("upi");
  const [label, setLabel] = useState("");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accNum, setAccNum] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holder, setHolder] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("USDT");
  const [cryptoNetwork, setCryptoNetwork] = useState("TRC20");
  const [walletAddress, setWalletAddress] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setLabel(editing.label || "");
      setUpiId(editing.upi_id || "");
      setBankName(editing.bank_name || "");
      setAccNum(editing.account_number || "");
      setIfsc(editing.ifsc_code || "");
      setHolder(editing.holder_name || "");
      setCryptoCurrency(editing.crypto_currency || "USDT");
      setCryptoNetwork(editing.crypto_network || "TRC20");
      setWalletAddress(editing.wallet_address || "");
      setQrImageUrl(editing.qr_image_url || "");
    } else {
      setType("upi");
      setLabel("");
      setUpiId("");
      setBankName("");
      setAccNum("");
      setIfsc("");
      setHolder("");
      setCryptoCurrency("USDT");
      setCryptoNetwork("TRC20");
      setWalletAddress("");
      setQrImageUrl("");
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (type === "upi" && !upiId.trim()) {
      toast({ title: "UPI ID required", variant: "destructive" });
      return;
    }
    if (type === "bank" && (!accNum.trim() || !ifsc.trim())) {
      toast({ title: "Account number & IFSC required", variant: "destructive" });
      return;
    }
    if (type === "crypto" && (!walletAddress.trim() || !cryptoCurrency.trim() || !cryptoNetwork.trim())) {
      toast({ title: "Wallet address, currency & network required", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      method: type,
      account_name: label.trim() || (type === "upi" ? upiId : type === "bank" ? bankName : `${cryptoCurrency} ${cryptoNetwork}`),
      upi_id: type === "upi" ? upiId.trim() : null,
      bank_name: type === "bank" ? bankName.trim() : null,
      account_number: type === "bank" ? accNum.trim() : "",
      ifsc_code: type === "bank" ? ifsc.trim() : null,
      holder_name: type !== "crypto" ? (holder.trim() || null) : null,
      crypto_currency: type === "crypto" ? cryptoCurrency.trim().toUpperCase() : null,
      crypto_network: type === "crypto" ? cryptoNetwork.trim().toUpperCase() : null,
      wallet_address: type === "crypto" ? walletAddress.trim() : null,
      qr_image_url: type === "crypto" ? (qrImageUrl.trim() || null) : null,
    };

    if (editing) {
      await supabase.from("payment_accounts" as any).update(payload as any).eq("id", editing.id);
    } else {
      await supabase.from("payment_accounts" as any).insert(payload as any);
    }

    toast({ title: editing ? "Updated" : "Added", description: "Payment account saved" });
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">{editing ? "Edit" : "Add"} Payment Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {(["upi", "bank", "crypto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors ${
                  type === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {t === "upi" ? "UPI" : t === "bank" ? "Bank" : "Crypto"}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div>
              <Label className="text-xs">Label (optional)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Primary UPI" className="h-8 text-xs" />
            </div>

            {type === "upi" && (
              <div>
                <Label className="text-xs">UPI ID *</Label>
                <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@paytm" className="h-8 text-xs" />
              </div>
            )}

            {type === "bank" && (
              <>
                <div>
                  <Label className="text-xs">Bank Name</Label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="SBI" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Account Number *</Label>
                  <Input value={accNum} onChange={(e) => setAccNum(e.target.value)} placeholder="1234567890" className="h-8 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">IFSC Code *</Label>
                  <Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="SBIN0001234" className="h-8 text-xs" />
                </div>
              </>
            )}

            {type === "crypto" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Currency *</Label>
                    <Input value={cryptoCurrency} onChange={(e) => setCryptoCurrency(e.target.value)} placeholder="USDT" className="h-8 text-xs uppercase" />
                  </div>
                  <div>
                    <Label className="text-xs">Network *</Label>
                    <Input value={cryptoNetwork} onChange={(e) => setCryptoNetwork(e.target.value)} placeholder="TRC20" className="h-8 text-xs uppercase" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Wallet Address *</Label>
                  <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder="TXxxxxxxxxxxxxxxxxxxxxx" className="h-8 text-xs font-mono" />
                </div>
                <div>
                  <Label className="text-xs">QR Image URL (optional)</Label>
                  <Input value={qrImageUrl} onChange={(e) => setQrImageUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" />
                </div>
              </>
            )}

            {type !== "crypto" && (
              <div>
                <Label className="text-xs">Account Holder Name</Label>
                <Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Name" className="h-8 text-xs" />
              </div>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full text-xs gap-1">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {editing ? "Update" : "Add"} Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
