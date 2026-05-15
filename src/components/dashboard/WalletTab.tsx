import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle, Wallet, TrendingUp, Shield, Clock, History } from "lucide-react";
import { DepositForm } from "./DepositForm";
import { WithdrawalForm } from "./WithdrawalForm";
import { DepositHistory } from "./DepositHistory";
import { useCurrency } from "@/hooks/useSystemControls";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
}

interface WalletTabProps {
  wallet: { balance: number; exposure: number; bonus: number };
  transactions: Transaction[];
  profileId?: string;
  userName?: string;
  onRefresh?: () => void;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-[hsl(var(--live)/.12)] text-[hsl(var(--live))] border-[hsl(var(--live)/.25)]",
    pending: "bg-[hsl(var(--highlight)/.12)] text-[hsl(var(--highlight))] border-[hsl(var(--highlight)/.25)]",
    rejected: "bg-[hsl(var(--live-red)/.12)] text-[hsl(var(--live-red))] border-[hsl(var(--live-red)/.25)]",
    processing: "bg-[hsl(var(--back)/.12)] text-[hsl(var(--back))] border-[hsl(var(--back)/.25)]",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

export function WalletTab({ wallet, transactions, profileId, userName, onRefresh }: WalletTabProps) {
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { format } = useCurrency();

  if (showHistory && profileId) {
    return <DepositHistory profileId={profileId} onClose={() => setShowHistory(false)} />;
  }

  if (showDeposit && profileId) {
    return (
      <DepositForm
        profileId={profileId}
        userName={userName}
        onClose={() => setShowDeposit(false)}
        onSuccess={() => onRefresh?.()}
      />
    );
  }

  if (showWithdraw && profileId) {
    return (
      <WithdrawalForm
        profileId={profileId}
        userName={userName}
        balance={wallet.balance}
        onClose={() => setShowWithdraw(false)}
        onSuccess={() => onRefresh?.()}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Main Balance Hero Card */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card via-card to-secondary/30 p-5 md:p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="h-4 w-4 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Main Wallet</p>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            {format(wallet.balance, { decimals: 2 })}
          </p>

          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-lg bg-secondary/50 backdrop-blur-sm p-3 border border-border/50">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="h-3 w-3 text-destructive" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Exposure</p>
              </div>
              <p className="font-display text-base font-bold text-destructive">
                {format(wallet.exposure)}
              </p>
            </div>
            <div className="flex-1 rounded-lg bg-secondary/50 backdrop-blur-sm p-3 border border-border/50">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Shield className="h-3 w-3 text-accent" />
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Bonus</p>
              </div>
              <p className="font-display text-base font-bold text-accent">
                {format(wallet.bonus)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="default"
          className="h-12 gap-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
          onClick={() => setShowDeposit(true)}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20">
            <ArrowDownCircle className="h-4 w-4" />
          </div>
          Deposit
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2.5 rounded-xl text-sm font-bold border-2 hover:bg-secondary transition-all"
          onClick={() => setShowWithdraw(true)}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10">
            <ArrowUpCircle className="h-4 w-4" />
          </div>
          Withdraw
        </Button>
      </div>

      {/* Deposit History Shortcut */}
      {profileId && (
        <button
          onClick={() => setShowHistory(true)}
          className="w-full flex items-center justify-between rounded-xl border border-border bg-card p-3.5 hover:bg-secondary/30 hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))] group-hover:scale-105 transition-transform">
              <History className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Deposit History</p>
              <p className="text-[10px] text-muted-foreground">UPI / Bank / Crypto — sab alag-alag</p>
            </div>
          </div>
          <ArrowDownCircle className="h-4 w-4 text-muted-foreground -rotate-90" />
        </button>
      )}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              Recent Transactions
            </h3>
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">{transactions.length} total</span>
        </div>

        <div className="space-y-2">
          {transactions.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">Make your first deposit to get started</p>
            </div>
          )}
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 hover:bg-secondary/30 hover:border-border/80 transition-all group"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${
                  txn.type === "deposit"
                    ? "bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))]"
                    : "bg-[hsl(var(--live-red)/.1)] text-[hsl(var(--live-red))]"
                }`}
              >
                {txn.type === "deposit" ? (
                  <ArrowDownCircle className="h-5 w-5" />
                ) : (
                  <ArrowUpCircle className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground capitalize">{txn.type}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {txn.date ? new Date(txn.date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p
                  className={`text-sm font-bold tabular-nums ${
                    txn.type === "deposit" ? "text-[hsl(var(--live))]" : "text-[hsl(var(--live-red))]"
                  }`}
                >
                  {txn.type === "deposit" ? "+" : "-"}{format(txn.amount)}
                </p>
                <StatusBadge status={txn.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
