import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, ExternalLink, IndianRupee, Copy, CheckCircle, Shield, Zap, Landmark, Wallet, Bitcoin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSystemControls } from "@/hooks/useSystemControls";
import { usePaymentAccounts } from "@/hooks/usePaymentAccounts";

interface DepositFormProps {
  profileId: string;
  userName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepositForm({ profileId, userName, onClose, onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [method, setMethod] = useState<"upi" | "bank" | "crypto" | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { settings } = useSiteSettings();
  const { upiAccounts, bankAccounts, cryptoAccounts, getRotatedAccount, incrementUsage } = usePaymentAccounts();
  const { depositEnabled } = useSystemControls();

  const minDeposit = Number(settings.min_deposit) || 100;
  const maxDeposit = Number(settings.max_deposit) || 100000;
  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  const isGatewayEnabled = settings.gateway_enabled === "true";

  const gatewayCurrencies: { label: string; currency: string; channel: string; flag: string }[] = [];
  if (isGatewayEnabled) {
    if (settings.gateway_inr_enabled === "true") gatewayCurrencies.push({ label: "INR (UPI)", currency: "INR", channel: "UPI", flag: "🇮🇳" });
    if (settings.gateway_usd_enabled === "true") gatewayCurrencies.push({ label: "USD", currency: "USD", channel: "USD", flag: "🇺🇸" });
    if (settings.gateway_pkr_enabled === "true") gatewayCurrencies.push({ label: "PKR", currency: "PKR", channel: settings.gateway_pkr_channel || "EASYPAISA", flag: "🇵🇰" });
    if (settings.gateway_bdt_enabled === "true") gatewayCurrencies.push({ label: "BDT", currency: "BDT", channel: settings.gateway_bdt_channel || "BKASH", flag: "🇧🇩" });
  }

  const [selectedCurrency, setSelectedCurrency] = useState(gatewayCurrencies[0] || null);
  const useGateway = isGatewayEnabled && gatewayCurrencies.length > 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectMethod = (m: "upi" | "bank" | "crypto") => {
    const acc = getRotatedAccount(m);
    setSelectedAccount(acc);
    setMethod(m);
  };

  const handleGatewaySubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt < minDeposit || amt > maxDeposit) {
      toast({ title: "Invalid Amount", description: `Amount must be between ₹${minDeposit} and ₹${maxDeposit}`, variant: "destructive" });
      return;
    }
    if (!selectedCurrency) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("lemonpay-deposit", {
        body: { amount: amt, channel: selectedCurrency.channel, currency: selectedCurrency.currency },
      });
      if (error) throw error;

      if (data?.success && data?.payUrl) {
        toast({ title: "Redirecting to Payment...", description: `${selectedCurrency.currency} ${amt.toLocaleString()} deposit initiated` });
        supabase.functions.invoke("telegram-notify", {
          body: { type: "deposit", amount: amt, method: selectedCurrency.channel, utr: data.orderId, userName: userName || "Unknown" },
        }).catch(() => {});
        window.open(data.payUrl, "_blank");
        onSuccess();
        onClose();
      } else {
        toast({ title: "Payment Failed", description: data?.error || "Could not initiate payment", variant: "destructive" });
      }
    } catch (err: any) {
      console.error("Deposit error:", err);
      toast({ title: "Error", description: "Failed to initiate deposit", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleManualSubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt < minDeposit || amt > maxDeposit) {
      toast({ title: "Invalid Amount", description: `Amount must be between ₹${minDeposit} and ₹${maxDeposit}`, variant: "destructive" });
      return;
    }
    if (!utr.trim() || utr.trim().length < 6) {
      toast({ title: "UTR Required", description: "Please enter a valid UTR/Reference number (min 6 chars)", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("deposits").insert({
      profile_id: profileId,
      amount: amt,
      method: method || "upi",
      utr: utr.trim(),
      status: "pending",
    });

    if (error) {
      toast({ title: "Error", description: "Failed to submit deposit request", variant: "destructive" });
    } else {
      if (selectedAccount) incrementUsage(selectedAccount.id);
      toast({ title: "Request Submitted!", description: `₹${amt.toLocaleString()} deposit is pending approval` });
      supabase.functions.invoke("telegram-notify", {
        body: { type: "deposit", amount: amt, method: method || "upi", utr: utr.trim(), userName: userName || "Unknown" },
      }).catch(() => {});
      onSuccess();
      onClose();
    }
    setSubmitting(false);
  };

  // ---------- SHARED COMPONENTS ----------
  const AmountSection = () => (
    <div className="space-y-3">
      <Label className="text-xs font-semibold text-foreground">
        Enter Amount <span className="text-muted-foreground font-normal">(₹{minDeposit} – ₹{maxDeposit.toLocaleString()})</span>
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={minDeposit}
          max={maxDeposit}
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
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            ₹{q.toLocaleString()}
          </button>
        ))}
      </div>
    </div>
  );

  const TrustBar = () => (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-secondary/50 py-2 px-3">
      <Shield className="h-3.5 w-3.5 text-[hsl(var(--live))]" />
      <p className="text-[10px] font-medium text-muted-foreground">
        100% Secure · Instant Processing · 24/7 Support
      </p>
    </div>
  );

  const PageHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-3 pb-2 border-b border-border mb-4">
      <button onClick={onBack} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
        <ArrowLeft className="h-4 w-4 text-foreground" />
      </button>
      <div>
        <h3 className="font-display text-base font-bold text-foreground">{title}</h3>
        <p className="text-[10px] text-muted-foreground">Fast & secure transactions</p>
      </div>
    </div>
  );

  if (!depositEnabled) {
    return (
      <div className="space-y-4">
        <PageHeader title="Deposit Funds" onBack={onClose} />
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-bold text-foreground mb-1">Deposits Temporarily Disabled</p>
          <p className="text-xs text-muted-foreground">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  // ========== GATEWAY MODE ==========
  if (useGateway) {
    return (
      <div className="space-y-4">
        <PageHeader title="Deposit Funds" onBack={onClose} />

        {/* Instant Payment Badge */}
        <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-accent/5 p-4">
          <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Instant Payment</p>
              <p className="text-[11px] text-muted-foreground">Select currency → Enter amount → Auto credit</p>
            </div>
          </div>
        </div>

        {/* Currency Selector */}
        {gatewayCurrencies.length > 1 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Payment Currency</Label>
            <div className="grid grid-cols-2 gap-2">
              {gatewayCurrencies.map((c) => (
                <button
                  key={c.currency}
                  onClick={() => setSelectedCurrency(c)}
                  className={`flex items-center gap-2.5 rounded-xl border-2 p-3 text-left transition-all ${
                    selectedCurrency?.currency === c.currency
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div>
                    <p className="text-xs font-bold text-foreground">{c.currency}</p>
                    <p className="text-[10px] text-muted-foreground">{c.channel}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <AmountSection />

        <Button
          onClick={handleGatewaySubmit}
          disabled={submitting || !amount || !selectedCurrency}
          className="w-full h-12 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all gap-2"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            <><ExternalLink className="h-4 w-4" /> Pay {selectedCurrency?.currency || ""} {Number(amount || 0).toLocaleString()}</>
          )}
        </Button>

        <TrustBar />
      </div>
    );
  }

  // ========== MANUAL: STEP 1 - Choose Method ==========
  if (!method) {
    return (
      <div className="space-y-4">
        <PageHeader title="Deposit Funds" onBack={onClose} />

        <p className="text-sm font-medium text-muted-foreground">Choose your preferred payment method</p>

        <div className="grid grid-cols-3 gap-3">
          {upiAccounts.length > 0 && (
            <button
              onClick={() => selectMethod("upi")}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-card p-4 hover:border-primary hover:bg-primary/5 transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary group-hover:scale-110 transition-transform">
                <IndianRupee className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-foreground block">UPI</span>
                <span className="text-[9px] text-muted-foreground">GPay · PhonePe</span>
              </div>
            </button>
          )}
          {bankAccounts.length > 0 && (
            <button
              onClick={() => selectMethod("bank")}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-card p-4 hover:border-primary hover:bg-primary/5 transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 text-accent group-hover:scale-110 transition-transform">
                <Landmark className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-foreground block">Bank</span>
                <span className="text-[9px] text-muted-foreground">IMPS · NEFT</span>
              </div>
            </button>
          )}
          {cryptoAccounts.length > 0 && (
            <button
              onClick={() => selectMethod("crypto")}
              className="group flex flex-col items-center gap-2 rounded-xl border-2 border-border bg-card p-4 hover:border-primary hover:bg-primary/5 transition-all hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--live))]/10 to-[hsl(var(--live))]/5 text-[hsl(var(--live))] group-hover:scale-110 transition-transform">
                <Bitcoin className="h-6 w-6" />
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-foreground block">Crypto</span>
                <span className="text-[9px] text-muted-foreground">USDT · BTC</span>
              </div>
            </button>
          )}
        </div>

        {upiAccounts.length === 0 && bankAccounts.length === 0 && cryptoAccounts.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
            <Wallet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No payment methods configured</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">Please contact support for assistance</p>
          </div>
        )}

        <TrustBar />
      </div>
    );
  }

  // ========== MANUAL: STEP 2 - Payment Details + UTR ==========
  return (
    <div className="space-y-4">
      <PageHeader title={method === "upi" ? "UPI Payment" : method === "bank" ? "Bank Transfer" : "Crypto Deposit"} onBack={() => { setMethod(null); setSelectedAccount(null); }} />

      {/* Payment Details Card */}
      {selectedAccount && (
        <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[hsl(var(--live))] animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">Pay to the following details</p>
          </div>
          {method === "upi" && (
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div>
                {selectedAccount.label && <p className="text-[10px] text-muted-foreground">{selectedAccount.label}</p>}
                <p className="text-sm font-bold text-foreground font-mono">{selectedAccount.upi_id}</p>
              </div>
              <button
                onClick={() => copyToClipboard(selectedAccount.upi_id, "upi")}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-card border border-border hover:bg-secondary transition-colors"
              >
                {copied === "upi" ? <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--live))]" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            </div>
          )}
          {method === "bank" && (
            <div className="space-y-2">
              {[
                { label: "Bank", value: selectedAccount.bank_name, key: "bank" },
                { label: "A/C Number", value: selectedAccount.account_number, key: "acc" },
                { label: "IFSC Code", value: selectedAccount.ifsc_code, key: "ifsc" },
                { label: "Holder Name", value: selectedAccount.holder_name, key: "name" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg bg-secondary/50 p-2.5">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="text-xs font-semibold text-foreground">{item.value || "—"}</p>
                  </div>
                  {item.value && (
                    <button
                      onClick={() => copyToClipboard(item.value, item.key)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-card border border-border hover:bg-secondary transition-colors"
                    >
                      {copied === item.key ? <CheckCircle className="h-3 w-3 text-[hsl(var(--live))]" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {method === "crypto" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2.5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Currency / Network</p>
                  <p className="text-xs font-semibold text-foreground">
                    {selectedAccount.crypto_currency} <span className="text-muted-foreground">({selectedAccount.crypto_network})</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Wallet Address</p>
                  <p className="text-[11px] font-mono font-semibold text-foreground break-all">{selectedAccount.wallet_address || "—"}</p>
                </div>
                {selectedAccount.wallet_address && (
                  <button
                    onClick={() => copyToClipboard(selectedAccount.wallet_address, "wallet")}
                    className="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card border border-border hover:bg-secondary transition-colors"
                  >
                    {copied === "wallet" ? <CheckCircle className="h-3 w-3 text-[hsl(var(--live))]" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </button>
                )}
              </div>
              {selectedAccount.qr_image_url && (
                <div className="flex justify-center rounded-lg bg-secondary/50 p-3">
                  <img src={selectedAccount.qr_image_url} alt="Wallet QR" className="h-40 w-40 rounded-md object-contain bg-white p-2" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground px-1">
                ⚠️ Sirf <strong>{selectedAccount.crypto_network}</strong> network par bhejein, warna funds lost ho sakte hain.
              </p>
            </div>
          )}
        </div>
      )}

      <AmountSection />

      {/* UTR / Tx Hash Input */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-foreground">
          {method === "crypto" ? "Transaction Hash (TXID)" : "UTR / Reference Number"}
        </Label>
        <Input
          placeholder={method === "crypto" ? "Enter TXID after sending crypto" : "Enter UTR after payment"}
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          maxLength={method === "crypto" ? 100 : 30}
          className="h-11 rounded-xl border-2 text-sm font-mono"
        />
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3 w-3 text-[hsl(var(--live))]" />
          {method === "crypto"
            ? "Crypto bhejne ke baad transaction hash paste karein"
            : "Complete payment first, then enter the UTR/transaction reference"}
        </p>
      </div>

      <Button
        onClick={handleManualSubmit}
        disabled={submitting || !amount || !utr.trim()}
        className="w-full h-12 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
        ) : (
          <>Submit Deposit — ₹{Number(amount || 0).toLocaleString()}</>
        )}
      </Button>

      <TrustBar />
    </div>
  );
}
