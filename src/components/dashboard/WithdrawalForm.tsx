import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Wallet, IndianRupee, Landmark, Shield, Zap, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/loose";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSystemControls } from "@/hooks/useSystemControls";

interface WithdrawalFormProps {
  profileId: string;
  userName?: string;
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function WithdrawalForm({ profileId, userName, balance, onClose, onSuccess }: WithdrawalFormProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accNum, setAccNum] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holder, setHolder] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const { withdrawalEnabled } = useSystemControls();

  const minWithdrawal = Number(settings.min_withdrawal) || 100;
  const maxWithdrawal = Number(settings.max_withdrawal) || 50000;
  const quickAmounts = [500, 1000, 2000, 5000, 10000];
  const isGatewayEnabled = settings.gateway_enabled === "true";

  const validateForm = (): { valid: boolean; amt: number; bankInfo: string } => {
    const amt = Number(amount);
    if (!amt || amt < minWithdrawal || amt > maxWithdrawal) {
      toast({ title: "Invalid Amount", description: `Amount must be between ₹${minWithdrawal} and ₹${maxWithdrawal}`, variant: "destructive" });
      return { valid: false, amt: 0, bankInfo: "" };
    }
    if (amt > balance) {
      toast({ title: "Insufficient Balance", description: `Your balance is ₹${balance.toLocaleString()}`, variant: "destructive" });
      return { valid: false, amt: 0, bankInfo: "" };
    }
    let bankInfo = "";
    if (method === "upi") {
      if (!upiId.trim()) { toast({ title: "UPI ID Required", variant: "destructive" }); return { valid: false, amt: 0, bankInfo: "" }; }
      bankInfo = `UPI: ${upiId.trim()}`;
    } else {
      if (!accNum.trim() || !ifsc.trim()) { toast({ title: "Bank details required", description: "Account number & IFSC are mandatory", variant: "destructive" }); return { valid: false, amt: 0, bankInfo: "" }; }
      bankInfo = `${bankName.trim()} | A/C: ${accNum.trim()} | IFSC: ${ifsc.trim()} | ${holder.trim()}`;
    }
    return { valid: true, amt, bankInfo };
  };

  const handleSubmit = async () => {
    if (!withdrawalEnabled) {
      toast({ title: "Withdrawals Disabled", description: "Withdrawals are temporarily disabled by the admin.", variant: "destructive" });
      return;
    }
    const { valid, amt, bankInfo } = validateForm();
    if (!valid) return;
    setSubmitting(true);

    if (isGatewayEnabled) {
      try {
        const { data, error } = await supabase.functions.invoke("lemonpay-withdraw", { body: { amount: amt, method, bankInfo } });
        if (error) throw error;
        if (data?.success) {
          toast({ title: "Withdrawal Initiated!", description: `₹${amt.toLocaleString()} payout is being processed` });
          supabase.functions.invoke("telegram-notify", { body: { type: "withdrawal", amount: amt, method, bankInfo, userName: userName || "Unknown" } }).catch(() => {});
          onSuccess(); onClose();
        } else {
          toast({ title: "Withdrawal Failed", description: data?.error || "Could not process", variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: "Failed to process withdrawal", variant: "destructive" });
      }
    } else {
      const { error } = await supabase.from("withdrawals").insert({ profile_id: profileId, amount: amt, method, bank_info: bankInfo, status: "pending" });
      if (error) {
        toast({ title: "Error", description: "Failed to submit withdrawal request", variant: "destructive" });
      } else {
        toast({ title: "Request Submitted!", description: `₹${amt.toLocaleString()} withdrawal is pending approval` });
        supabase.functions.invoke("telegram-notify", { body: { type: "withdrawal", amount: amt, method, bankInfo, userName: userName || "Unknown" } }).catch(() => {});
        onSuccess(); onClose();
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border mb-2">
        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <div>
          <h3 className="font-display text-base font-bold text-foreground">Withdraw Funds</h3>
          <p className="text-[10px] text-muted-foreground">Secure & fast withdrawal</p>
        </div>
      </div>

      {!withdrawalEnabled && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-bold text-foreground mb-1">Withdrawals Temporarily Disabled</p>
          <p className="text-xs text-muted-foreground">Please try again later or contact support.</p>
        </div>
      )}

      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-4">
        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Available Balance</p>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Auto Payout Badge */}
      {isGatewayEnabled && (
        <div className="flex items-center gap-2.5 rounded-xl border border-[hsl(var(--live)/.2)] bg-[hsl(var(--live)/.05)] p-3">
          <Zap className="h-4 w-4 text-[hsl(var(--live))]" />
          <p className="text-[11px] font-semibold text-[hsl(var(--live))]">Auto Payout — Funds sent within minutes</p>
        </div>
      )}

      {/* Method Selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">Withdraw To</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["upi", "bank"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-bold transition-all ${
                method === m
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30"
              }`}
            >
              {m === "upi" ? <IndianRupee className="h-4 w-4" /> : <Landmark className="h-4 w-4" />}
              {m === "upi" ? "UPI" : "Bank Transfer"}
            </button>
          ))}
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {method === "upi" ? "UPI Details" : "Bank Account Details"}
        </p>
        {method === "upi" ? (
          <div>
            <Label className="text-xs">Your UPI ID</Label>
            <Input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@paytm" className="h-10 rounded-lg border-2 text-sm mt-1" />
          </div>
        ) : (
          <div className="space-y-2.5">
            <div><Label className="text-xs">Bank Name</Label><Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="SBI, HDFC..." className="h-10 rounded-lg border-2 text-sm mt-1" /></div>
            <div><Label className="text-xs">Account Number</Label><Input value={accNum} onChange={(e) => setAccNum(e.target.value)} placeholder="1234567890" className="h-10 rounded-lg border-2 text-sm mt-1" /></div>
            <div><Label className="text-xs">IFSC Code</Label><Input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="SBIN0001234" className="h-10 rounded-lg border-2 text-sm mt-1" /></div>
            <div><Label className="text-xs">Account Holder Name</Label><Input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Full Name" className="h-10 rounded-lg border-2 text-sm mt-1" /></div>
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-foreground">
          Amount <span className="text-muted-foreground font-normal">(₹{minWithdrawal} – ₹{maxWithdrawal.toLocaleString()})</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={minWithdrawal}
            max={Math.min(maxWithdrawal, balance)}
            className="h-12 pl-8 text-lg font-bold rounded-xl border-2 focus:border-primary"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(String(q))}
              className={`rounded-lg border-2 px-3.5 py-1.5 text-xs font-bold transition-all ${
                amount === String(q)
                  ? "border-primary bg-primary text-primary-foreground scale-105 shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              ₹{q.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Processing Info */}
      <div className="flex items-center gap-2 rounded-lg bg-secondary/50 py-2 px-3">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground">
          {isGatewayEnabled ? "Auto payout typically processes within 5-30 minutes" : "Manual withdrawals are reviewed and processed by admin within 24 hours"}
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !amount}
        className="w-full h-12 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
        ) : isGatewayEnabled ? (
          `Withdraw ₹${Number(amount || 0).toLocaleString()} — Auto Payout`
        ) : (
          `Submit Withdrawal — ₹${Number(amount || 0).toLocaleString()}`
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 py-1">
        <Shield className="h-3.5 w-3.5 text-[hsl(var(--live))]" />
        <p className="text-[10px] font-medium text-muted-foreground">Secure & Encrypted</p>
      </div>
    </div>
  );
}
