import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { WalletTab } from "@/components/dashboard/WalletTab";
import { BetsTab } from "@/components/dashboard/BetsTab";
import { ProfileTab } from "@/components/dashboard/ProfileTab";
import { AccountStatement } from "@/components/dashboard/AccountStatement";
import { KycTab } from "@/components/dashboard/KycTab";
import { VipReferralTab } from "@/components/dashboard/VipReferralTab";
import { Wallet, History, User, FileText, CheckCircle, Shield as ShieldIcon, Crown, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const tabs = [
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "statement", label: "Statement", icon: FileText },
  { id: "bets", label: "Bets", icon: History },
  { id: "kyc", label: "KYC", icon: ShieldIcon },
  { id: "vip", label: "VIP", icon: Crown },
  { id: "profile", label: "Profile", icon: User },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>("wallet");
  const { currentUser, isLoggedIn, loading } = useAuth();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser?.profileId) return;
    const pid = currentUser.profileId;

    supabase.from("deposits").select("*").eq("profile_id", pid).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setDeposits(data.map((d) => ({ id: d.id, type: "deposit", amount: d.amount, status: d.status || "pending", date: d.created_at || "" })));
    });

    supabase.from("withdrawals").select("*").eq("profile_id", pid).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setWithdrawals(data.map((w) => ({ id: w.id, type: "withdrawal", amount: w.amount, status: w.status || "pending", date: w.created_at || "" })));
    });

    supabase.from("bets" as any).select("*").eq("profile_id", pid).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setBets((data as any[]).map((b) => ({
        id: b.id, match: b.match_event, selection: b.selection, odds: b.odds,
        stake: b.stake, type: b.bet_type, result: b.result, profit: b.profit, date: b.created_at || "",
      })));
    });

    supabase.from("transactions" as any).select("*").eq("profile_id", pid).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setTransactions(data as any[]);
    });
  }, [currentUser?.profileId]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Loading your dashboard...</p>
      </div>
    </div>
  );
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const allTxns = [...deposits, ...withdrawals].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const walletData = { balance: currentUser?.balance || 0, exposure: 0, bonus: 0 };
  const totalPL = bets.reduce((sum, b) => sum + (b.profit || 0), 0);
  const initials = currentUser?.name ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-4xl px-3 py-4 md:px-6 md:py-6 pb-24 md:pb-8">
        {/* User Header */}
        <div className="relative mb-5 overflow-hidden rounded-xl border border-border bg-gradient-to-r from-card via-card to-secondary/20 p-4 md:p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-xl font-bold text-primary-foreground font-display shadow-lg">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground">{currentUser?.name}</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">ID: {currentUser?.id} · {currentUser?.email}</p>
            </div>
            <div className="hidden sm:flex items-center">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${
                currentUser?.kyc === "verified"
                  ? "bg-[hsl(var(--live)/.1)] text-[hsl(var(--live))] border-[hsl(var(--live)/.25)]"
                  : "bg-[hsl(var(--highlight)/.1)] text-[hsl(var(--highlight))] border-[hsl(var(--highlight)/.25)]"
              }`}>
                {currentUser?.kyc === "verified" ? <CheckCircle className="h-3 w-3" /> : <ShieldIcon className="h-3 w-3" />}
                {currentUser?.kyc === "verified" ? "VERIFIED" : "KYC PENDING"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-5 flex gap-1 rounded-xl border border-border bg-card p-1.5 shadow-sm overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 sm:flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === "wallet" && <WalletTab wallet={walletData} transactions={allTxns} profileId={currentUser?.profileId} userName={currentUser?.name} onRefresh={() => window.location.reload()} />}
        {activeTab === "statement" && <AccountStatement profileId={currentUser?.profileId} transactions={transactions} />}
        {activeTab === "bets" && <BetsTab bets={bets} totalPL={totalPL} />}
        {activeTab === "kyc" && currentUser?.profileId && <KycTab profileId={currentUser.profileId} kycStatus={currentUser.kyc} />}
        {activeTab === "vip" && currentUser?.profileId && <VipReferralTab profileId={currentUser.profileId} userName={currentUser.name} />}
        {activeTab === "profile" && <ProfileTab user={currentUser} />}
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
