import { useState, useEffect } from "react";
import { Crown, Copy, Share2, Users, Wallet, TrendingUp, Gift, CheckCircle, Star, Zap, Shield, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface VipReferralTabProps {
  profileId: string;
  userName: string;
}

const VIP_LEVELS = [
  { id: "bronze", label: "Bronze", color: "from-amber-700 to-amber-900", textColor: "text-amber-700", bg: "bg-amber-700/10", border: "border-amber-700/20", icon: Shield, cashback: "0%" },
  { id: "silver", label: "Silver", color: "from-slate-400 to-slate-500", textColor: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", icon: Star, cashback: "2%" },
  { id: "gold", label: "Gold", color: "from-yellow-400 to-amber-500", textColor: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Crown, cashback: "5%" },
  { id: "diamond", label: "Diamond", color: "from-cyan-400 to-blue-500", textColor: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", icon: Zap, cashback: "10%" },
];

export function VipReferralTab({ profileId, userName }: VipReferralTabProps) {
  const [vipLevel, setVipLevel] = useState("bronze");
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { settings } = useSiteSettings();

  useEffect(() => {
    fetchData();
  }, [profileId]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch profile for VIP and referral code
    const { data: profile } = await supabase
      .from("profiles")
      .select("vip_level, referral_code")
      .eq("id", profileId)
      .single();

    if (profile) {
      setVipLevel((profile as any).vip_level || "bronze");
      setReferralCode((profile as any).referral_code || "");
    }

    // Fetch referred users
    const { data: refs } = await supabase
      .from("profiles")
      .select("id, name, display_id, created_at, vip_level")
      .eq("referred_by", profileId);
    
    if (refs) setReferrals(refs);

    // Fetch referral earnings
    const { data: earns } = await supabase
      .from("referral_earnings" as any)
      .select("*")
      .eq("referrer_profile_id", profileId)
      .order("created_at", { ascending: false });

    if (earns) {
      setEarnings(earns as any[]);
      setTotalEarnings((earns as any[]).reduce((s: number, e: any) => s + (e.amount || 0), 0));
    }

    setLoading(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Referral code copied to clipboard" });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/signup?ref=${referralCode}`;
    if (navigator.share) {
      navigator.share({ title: "Join me!", text: `Use my referral code ${referralCode} to get bonus!`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link Copied!", description: "Share this link with friends" });
    }
  };

  const currentLevel = VIP_LEVELS.find(l => l.id === vipLevel) || VIP_LEVELS[0];
  const currentLevelIdx = VIP_LEVELS.findIndex(l => l.id === vipLevel);
  const LevelIcon = currentLevel.icon;
  const signupBonus = settings.referral_signup_bonus || "100";
  const commissionRate = settings.referral_commission_rate || "2";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ========== VIP STATUS CARD ========== */}
      <div className={`relative overflow-hidden rounded-xl border ${currentLevel.border} p-5`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${currentLevel.color} opacity-[0.06]`} />
        <div className="absolute top-0 right-0 w-32 h-32 bg-current opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${currentLevel.color} text-white shadow-lg`}>
              <LevelIcon className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className={`font-display text-xl font-bold ${currentLevel.textColor}`}>{currentLevel.label}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${currentLevel.bg} ${currentLevel.textColor}`}>
                  VIP {currentLevelIdx + 1}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Cashback: {currentLevel.cashback} · Priority Support</p>
            </div>
          </div>

          {/* VIP Progress */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">VIP Progress</p>
              {currentLevelIdx < VIP_LEVELS.length - 1 && (
                <p className="text-[10px] text-muted-foreground">Next: {VIP_LEVELS[currentLevelIdx + 1].label}</p>
              )}
            </div>
            <div className="flex gap-1">
              {VIP_LEVELS.map((level, idx) => (
                <div
                  key={level.id}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    idx <= currentLevelIdx
                      ? `bg-gradient-to-r ${level.color}`
                      : "bg-secondary"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between">
              {VIP_LEVELS.map((level) => (
                <span key={level.id} className={`text-[8px] font-bold ${level.id === vipLevel ? level.textColor : "text-muted-foreground/50"}`}>
                  {level.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VIP Benefits */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: Gift, label: "Signup Bonus", value: `₹${signupBonus}`, desc: "Per referral" },
          { icon: TrendingUp, label: "Commission", value: `${commissionRate}%`, desc: "On referral activity" },
          { icon: Award, label: "Cashback", value: currentLevel.cashback, desc: "On losses" },
          { icon: Shield, label: "Support", value: currentLevelIdx >= 2 ? "Priority" : "Standard", desc: "Response time" },
        ].map((b) => (
          <div key={b.label} className="rounded-xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <b.icon className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{b.label}</p>
            <p className="font-display text-base font-bold text-foreground mt-0.5">{b.value}</p>
            <p className="text-[10px] text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* ========== REFERRAL SECTION ========== */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-card to-accent/5 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Refer & Earn</p>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Share your code and earn ₹{signupBonus} per signup + {commissionRate}% commission</p>
        </div>

        <div className="p-4 space-y-3">
          {/* Referral Code */}
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Your Referral Code</p>
              <p className="font-display text-2xl font-bold text-primary tracking-[0.2em]">{referralCode}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2 rounded-xl h-10" onClick={() => handleCopy(referralCode)}>
              <Copy className="h-4 w-4" /> Copy Code
            </Button>
            <Button className="gap-2 rounded-xl h-10" onClick={handleShare}>
              <Share2 className="h-4 w-4" /> Share Link
            </Button>
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-border bg-card p-3.5 text-center">
          <Users className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="font-display text-xl font-bold text-foreground">{referrals.length}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Referrals</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 text-center">
          <Wallet className="h-5 w-5 text-[hsl(var(--live))] mx-auto mb-1" />
          <p className="font-display text-xl font-bold text-[hsl(var(--live))]">₹{totalEarnings.toLocaleString()}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Total Earned</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5 text-center">
          <TrendingUp className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="font-display text-xl font-bold text-foreground">{commissionRate}%</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Commission</p>
        </div>
      </div>

      {/* Referred Users */}
      {referrals.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-secondary/40 px-4 py-2.5 border-b border-border flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Your Referrals</p>
            <span className="text-[10px] text-muted-foreground">{referrals.length} users</span>
          </div>
          <div className="divide-y divide-border">
            {referrals.map((ref: any) => (
              <div key={ref.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                  {ref.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{ref.name}</p>
                  <p className="text-[10px] text-muted-foreground">{ref.display_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(ref.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings History */}
      {earnings.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-secondary/40 px-4 py-2.5 border-b border-border">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Earnings History</p>
          </div>
          <div className="divide-y divide-border">
            {earnings.slice(0, 10).map((e: any) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-foreground capitalize">{(e.type || "").replace("_", " ")}</p>
                  <p className="text-[10px] text-muted-foreground">{e.description || ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[hsl(var(--live))]">+₹{e.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
