import { useState, useEffect } from "react";
import { Crown, Users, Search, Star, Shield, Zap, ChevronDown, Save, Gift, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/loose";
import { toast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const VIP_LEVELS = [
  { id: "bronze", label: "Bronze", icon: Shield, color: "text-amber-700" },
  { id: "silver", label: "Silver", icon: Star, color: "text-slate-400" },
  { id: "gold", label: "Gold", icon: Crown, color: "text-yellow-500" },
  { id: "diamond", label: "Diamond", icon: Zap, color: "text-cyan-400" },
];

export function AdminVipReferralTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const { settings, updateMultiple } = useSiteSettings();

  // Settings form
  const [vipSettings, setVipSettings] = useState({
    vip_silver_min: "10000",
    vip_gold_min: "50000",
    vip_diamond_min: "200000",
    vip_silver_bonus: "2",
    vip_gold_bonus: "5",
    vip_diamond_bonus: "10",
    referral_signup_bonus: "100",
    referral_commission_rate: "2",
    referral_enabled: "true",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setVipSettings({
      vip_silver_min: settings.vip_silver_min || "10000",
      vip_gold_min: settings.vip_gold_min || "50000",
      vip_diamond_min: settings.vip_diamond_min || "200000",
      vip_silver_bonus: settings.vip_silver_bonus || "2",
      vip_gold_bonus: settings.vip_gold_bonus || "5",
      vip_diamond_bonus: settings.vip_diamond_bonus || "10",
      referral_signup_bonus: settings.referral_signup_bonus || "100",
      referral_commission_rate: settings.referral_commission_rate || "2",
      referral_enabled: settings.referral_enabled || "true",
    });
  }, [settings]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, name, display_id, vip_level, referral_code, referred_by, balance")
      .order("created_at", { ascending: false });
    if (data) setUsers(data as any[]);
    setLoading(false);
  };

  const updateVipLevel = async (userId: string, level: string) => {
    await supabase.from("profiles").update({ vip_level: level }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, vip_level: level } : u));
    toast({ title: "VIP Updated", description: `User VIP set to ${level}` });
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await updateMultiple(vipSettings);
    toast({ title: "Settings Saved!" });
    setSavingSettings(false);
  };

  const filtered = users.filter((u) => {
    const matchesFilter = filter === "all" || u.vip_level === filter;
    const matchesSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.display_id?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const vipCounts = {
    all: users.length,
    bronze: users.filter(u => u.vip_level === "bronze").length,
    silver: users.filter(u => u.vip_level === "silver").length,
    gold: users.filter(u => u.vip_level === "gold").length,
    diamond: users.filter(u => u.vip_level === "diamond").length,
  };

  const totalReferrals = users.filter(u => u.referred_by).length;

  if (loading) return <div className="text-center py-8 text-muted-foreground text-xs">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { label: "Total Users", value: vipCounts.all, color: "text-foreground" },
          ...VIP_LEVELS.map(l => ({ label: l.label, value: vipCounts[l.id as keyof typeof vipCounts], color: l.color })),
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={`font-display text-xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-[1fr_300px] gap-4">
        {/* Users Table */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full h-8 rounded-md border border-border bg-surface pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="all">All Levels</option>
              {VIP_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">User</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground">VIP Level</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground hidden sm:table-cell">Referral Code</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Balance</th>
                    <th className="px-3 py-2 text-center font-semibold text-muted-foreground">Set Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">No users found</td></tr>
                  )}
                  {filtered.slice(0, 50).map((user) => {
                    const level = VIP_LEVELS.find(l => l.id === user.vip_level) || VIP_LEVELS[0];
                    const LIcon = level.icon;
                    return (
                      <tr key={user.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{user.display_id}</p>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${level.color}`}>
                            <LIcon className="h-3 w-3" /> {level.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-mono text-muted-foreground hidden sm:table-cell">
                          {user.referral_code || "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          ₹{(user.balance || 0).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <select
                            value={user.vip_level || "bronze"}
                            onChange={(e) => updateVipLevel(user.id, e.target.value)}
                            className="h-7 rounded border border-border bg-surface px-1.5 text-[10px] font-semibold text-foreground outline-none focus:border-primary"
                          >
                            {VIP_LEVELS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* VIP Thresholds */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-3 py-2 flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">VIP Thresholds</h3>
            </div>
            <div className="p-3 space-y-2.5">
              {[
                { key: "vip_silver_min", label: "Silver (min deposit)" },
                { key: "vip_gold_min", label: "Gold (min deposit)" },
                { key: "vip_diamond_min", label: "Diamond (min deposit)" },
              ].map((f) => (
                <div key={f.key}>
                  <Label className="text-[10px]">{f.label}</Label>
                  <Input
                    type="number"
                    value={vipSettings[f.key as keyof typeof vipSettings]}
                    onChange={(e) => setVipSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* VIP Cashback */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-3 py-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">VIP Cashback %</h3>
            </div>
            <div className="p-3 space-y-2.5">
              {[
                { key: "vip_silver_bonus", label: "Silver Cashback %" },
                { key: "vip_gold_bonus", label: "Gold Cashback %" },
                { key: "vip_diamond_bonus", label: "Diamond Cashback %" },
              ].map((f) => (
                <div key={f.key}>
                  <Label className="text-[10px]">{f.label}</Label>
                  <Input
                    type="number"
                    value={vipSettings[f.key as keyof typeof vipSettings]}
                    onChange={(e) => setVipSettings(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Referral Settings */}
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-3 py-2 flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Referral Settings</h3>
            </div>
            <div className="p-3 space-y-2.5">
              <div>
                <Label className="text-[10px]">Signup Bonus (₹)</Label>
                <Input
                  type="number"
                  value={vipSettings.referral_signup_bonus}
                  onChange={(e) => setVipSettings(prev => ({ ...prev, referral_signup_bonus: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[10px]">Commission Rate (%)</Label>
                <Input
                  type="number"
                  value={vipSettings.referral_commission_rate}
                  onChange={(e) => setVipSettings(prev => ({ ...prev, referral_commission_rate: e.target.value }))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px]">Referral System</Label>
                <button
                  onClick={() => setVipSettings(prev => ({ ...prev, referral_enabled: prev.referral_enabled === "true" ? "false" : "true" }))}
                  className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${
                    vipSettings.referral_enabled === "true" ? "bg-live/10 text-live" : "bg-surface text-muted-foreground"
                  }`}
                >
                  {vipSettings.referral_enabled === "true" ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Total Referrals: <span className="font-bold text-foreground">{totalReferrals}</span></p>
          </div>

          <Button onClick={saveSettings} disabled={savingSettings} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {savingSettings ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
