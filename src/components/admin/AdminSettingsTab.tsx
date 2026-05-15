import { useState, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  Globe, CreditCard, MessageSquare, Settings, Save, Server,
  ToggleLeft, ToggleRight, Moon, Volume2, Gamepad2, Loader2, Search,
  Lock, Eye, EyeOff, ArrowLeft, ChevronRight, ExternalLink, Upload, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { providers as allProviders } from "@/data/casinoGames";
import { supabase } from "@/integrations/supabase/loose";
import { ThemePresetPicker } from "./ThemePresetPicker";

type SettingsCard = {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
};

const SETTINGS_CARDS: SettingsCard[] = [
  { id: "game-api", title: "Game API", description: "BetAPI, server URL & callback", icon: Server, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
  { id: "game-routes", title: "Game Routes", description: "Per-game server URL overrides", icon: Gamepad2, color: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30" },
  { id: "providers", title: "Game Providers", description: "Enable/disable casino providers", icon: Gamepad2, color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
  { id: "site", title: "Site Settings", description: "Name, currency & timezone", icon: Globe, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" },
  { id: "gateway", title: "Payment Gateway", description: "LemonPay & auto deposit/withdraw", icon: CreditCard, color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
  { id: "limits", title: "Payment Limits", description: "Min/max deposit & withdrawal", icon: CreditCard, color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
  { id: "manual", title: "Manual Payment", description: "Multiple UPI/Bank — Go to Pay Accounts", icon: CreditCard, color: "from-teal-500/20 to-teal-600/10 border-teal-500/30" },
  { id: "telegram", title: "Telegram", description: "Bot token & chat notifications", icon: MessageSquare, color: "from-sky-500/20 to-sky-600/10 border-sky-500/30" },
  { id: "alerts", title: "Alerts & Sound", description: "Notification sound settings", icon: Volume2, color: "from-pink-500/20 to-pink-600/10 border-pink-500/30" },
  { id: "password", title: "Change Password", description: "Update admin login password", icon: Lock, color: "from-red-500/20 to-red-600/10 border-red-500/30" },
  { id: "appearance", title: "Appearance", description: "Dark mode & UI preferences", icon: Moon, color: "from-indigo-500/20 to-indigo-600/10 border-indigo-500/30" },
  { id: "controls", title: "System Controls", description: "Registration, betting, maintenance", icon: Settings, color: "from-slate-500/20 to-slate-600/10 border-slate-500/30" },
];

export function AdminSettingsTab({ onSwitchTab }: { onSwitchTab?: (tab: string) => void }) {
  const { settings, loading, updateMultiple } = useSiteSettings();
  const { adminDarkModeEnabled, setAdminDarkModeEnabled } = useTheme();
  const [providerSearch, setProviderSearch] = useState("");
  const [local, setLocal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem("admin-sound-enabled");
    return stored !== null ? stored === "true" : true;
  });
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      localStorage.setItem("admin-sound-enabled", String(!prev));
      return !prev;
    });
  };

  const get = (key: string) => local[key] !== undefined ? local[key] : (settings[key] || "");
  const set = (key: string, value: string) => setLocal((p) => ({ ...p, [key]: value }));
  const getBool = (key: string) => get(key) === "true";
  const toggleBool = (key: string) => set(key, getBool(key) ? "false" : "true");

  const handleSave = async () => {
    setSaving(true);
    const toSave: Record<string, string> = {};
    Object.entries(local).forEach(([key, value]) => {
      if (settings[key] !== value) toSave[key] = value;
    });
    if (Object.keys(toSave).length > 0) {
      await updateMultiple(toSave);
    }
    toast({ title: "Settings Saved", description: `${Object.keys(toSave).length} settings updated` });
    setLocal({});
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  // If a card is active, show its detail panel
  if (activeCard) {
    return (
      <div className="space-y-3 max-w-2xl">
        <button
          onClick={() => setActiveCard(null)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mb-1"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Settings
        </button>

        {activeCard === "game-api" && (
          <SettingsSection title="Game API / Server Settings" icon={Server}>
            <div className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-2 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">THRVEX Casino API</p>
              <SettingsInput label="THRVEX Agent ID" value={get("thrvex_agent_id")} onChange={(v) => set("thrvex_agent_id", v)} placeholder="e.g. GD007" />
              <SettingsInput label="THRVEX Agent Key" value={get("thrvex_agent_key")} onChange={(v) => set("thrvex_agent_key", v)} placeholder="Secret key" secret />
              <SettingsInput label="THRVEX Server URL" value={get("thrvex_server_url")} onChange={(v) => set("thrvex_server_url", v)} placeholder="https://live.thrvex.site/v9095/beta" />
              <SettingsInput label="THRVEX Spribe URL" value={get("thrvex_spribe_url")} onChange={(v) => set("thrvex_spribe_url", v)} placeholder="https://live.thrvex.site/v1001/spribe" />
              <SettingsInput label="Callback URL" value={get("thrvex_callback_url")} onChange={(v) => set("thrvex_callback_url", v)} placeholder="Auto-generated if empty" />
              <p className="text-[9px] text-muted-foreground mt-0.5 mb-1">Default: <span className="font-mono text-foreground select-all">{`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/game-callback`}</span></p>
              <ThrvexTestButton />
              <CallbackTestButton />
            </div>
            <SettingsInput label="BetAPI Agent ID" value={get("betapi_agent_id")} onChange={(v) => set("betapi_agent_id", v)} />
            <SettingsInput label="API Server URL" value={get("betapi_server_url")} onChange={(v) => set("betapi_server_url", v)} />
            <SettingsInput label="Callback Domain" value={get("callback_domain")} onChange={(v) => set("callback_domain", v)} placeholder="Leave empty for auto" />
            <SettingsInput label="Currency" value={get("api_currency")} onChange={(v) => set("api_currency", v)} />
          </SettingsSection>
        )}

        {activeCard === "game-routes" && <GameRouteOverridesPanel />}

        {activeCard === "providers" && (
          <SettingsSection title={`Game Providers (${allProviders.length})`} icon={Gamepad2}>
            <div className="mb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input type="text" placeholder="Search providers..." value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface pl-7 pr-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
              </div>
            </div>
            {allProviders
              .filter(p => !providerSearch || p.name.toLowerCase().includes(providerSearch.toLowerCase()))
              .map((p) => (
              <SettingsToggle key={p.settingKey} label={p.name} enabled={getBool(p.settingKey)} onToggle={() => toggleBool(p.settingKey)} />
            ))}
          </SettingsSection>
        )}

        {activeCard === "site" && (
          <SettingsSection title="Site Settings" icon={Globe}>
            <LogoUploader currentUrl={get("site_logo_url")} onUploaded={(url) => set("site_logo_url", url)} />
            <SettingsInput label="Site Name" value={get("site_name")} onChange={(v) => set("site_name", v)} />
            <SettingsInput label="Currency" value={get("site_currency")} onChange={(v) => set("site_currency", v)} />
            <SettingsInput label="Timezone" value={get("site_timezone")} onChange={(v) => set("site_timezone", v)} />
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">APK Download</p>
              <SettingsToggle label="APK Download Enabled" enabled={getBool("apk_download_enabled")} onToggle={() => toggleBool("apk_download_enabled")} />
              {getBool("apk_download_enabled") && (
                <SettingsInput label="APK URL" value={get("apk_download_url")} onChange={(v) => set("apk_download_url", v)} placeholder="https://example.com/app.apk" />
              )}
            </div>
          </SettingsSection>
        )}

        {activeCard === "gateway" && (
          <SettingsSection title="Payment Gateway (LemonPay)" icon={CreditCard}>
            <SettingsToggle label="Gateway Enabled (Auto Deposit/Withdrawal)" enabled={getBool("gateway_enabled")} onToggle={() => toggleBool("gateway_enabled")} />
            {getBool("gateway_enabled") && (
              <>
                <SettingsInput label="Merchant ID" value={get("gateway_merchant_id")} onChange={(v) => set("gateway_merchant_id", v)} />
                <SettingsInput label="Secret Key" value={get("gateway_secret_key")} onChange={(v) => set("gateway_secret_key", v)} />
                <SettingsInput label="API Base URL" value={get("gateway_base_url")} onChange={(v) => set("gateway_base_url", v)} placeholder="https://api.lemonpay.app" />
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Currency Channels</p>
                  <SettingsToggle label="🇮🇳 INR (UPI)" enabled={getBool("gateway_inr_enabled")} onToggle={() => toggleBool("gateway_inr_enabled")} />
                  <SettingsToggle label="🇺🇸 USD" enabled={getBool("gateway_usd_enabled")} onToggle={() => toggleBool("gateway_usd_enabled")} />
                  <SettingsToggle label="🇵🇰 PKR (Easypaisa / JazzCash)" enabled={getBool("gateway_pkr_enabled")} onToggle={() => toggleBool("gateway_pkr_enabled")} />
                  {getBool("gateway_pkr_enabled") && (
                    <div className="ml-4">
                      <SettingsSelect label="PKR Channel" value={get("gateway_pkr_channel")} onChange={(v) => set("gateway_pkr_channel", v)} options={["EASYPAISA", "JAZZCASH"]} />
                    </div>
                  )}
                  <SettingsToggle label="🇧🇩 BDT (bKash / Nagad)" enabled={getBool("gateway_bdt_enabled")} onToggle={() => toggleBool("gateway_bdt_enabled")} />
                  {getBool("gateway_bdt_enabled") && (
                    <div className="ml-4">
                      <SettingsSelect label="BDT Channel" value={get("gateway_bdt_channel")} onChange={(v) => set("gateway_bdt_channel", v)} options={["BKASH", "NAGAD"]} />
                    </div>
                  )}
                </div>
              </>
            )}
          </SettingsSection>
        )}

        {activeCard === "limits" && (
          <SettingsSection title="Payment Limits" icon={CreditCard}>
            <SettingsInput label="Min Deposit" value={get("min_deposit")} onChange={(v) => set("min_deposit", v)} />
            <SettingsInput label="Max Deposit" value={get("max_deposit")} onChange={(v) => set("max_deposit", v)} />
            <SettingsInput label="Min Withdrawal" value={get("min_withdrawal")} onChange={(v) => set("min_withdrawal", v)} />
            <SettingsInput label="Max Withdrawal" value={get("max_withdrawal")} onChange={(v) => set("max_withdrawal", v)} />
            <SettingsInput label="Withdrawal Fee (%)" value={get("withdrawal_fee")} onChange={(v) => set("withdrawal_fee", v)} />
          </SettingsSection>
        )}

        {activeCard === "manual" && (
          <SettingsSection title="Manual Payment Accounts" icon={CreditCard}>
            <p className="text-xs text-muted-foreground mb-2">
              Multiple UPI IDs aur Bank accounts manage karne ke liye <strong>Pay Accounts</strong> tab use karein. Har deposit pe automatic rotation se alag account dikhega.
            </p>
            <Button
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={() => {
                if (onSwitchTab) onSwitchTab("payments");
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Go to Pay Accounts
            </Button>
          </SettingsSection>
        )}

        {activeCard === "telegram" && (
          <SettingsSection title="Telegram Notifications" icon={MessageSquare}>
            <SettingsInput label="Bot Token" value={get("telegram_bot_token")} onChange={(v) => set("telegram_bot_token", v)} />
            <SettingsInput label="Chat ID" value={get("telegram_chat_id")} onChange={(v) => set("telegram_chat_id", v)} />
          </SettingsSection>
        )}

        {activeCard === "alerts" && (
          <SettingsSection title="Notification Alerts" icon={Volume2}>
            <SettingsToggle label="Sound Alert for High-Value Bets" enabled={soundEnabled} onToggle={toggleSound} />
          </SettingsSection>
        )}

        {activeCard === "password" && <ChangePasswordSection />}

        {activeCard === "appearance" && (
          <SettingsSection title="Appearance" icon={Moon}>
            <ThemePresetPicker />
            <div className="border-t border-border pt-3 mt-3">
              <SettingsToggle label="Allow Dark Mode (Users)" enabled={adminDarkModeEnabled} onToggle={() => setAdminDarkModeEnabled(!adminDarkModeEnabled)} />
            </div>
          </SettingsSection>
        )}

        {activeCard === "controls" && (
          <SettingsSection title="System Controls" icon={Settings}>
            <SettingsToggle label="User Registration" enabled={getBool("registration_open")} onToggle={() => toggleBool("registration_open")} />
            <SettingsToggle label="Betting Enabled" enabled={getBool("betting_enabled")} onToggle={() => toggleBool("betting_enabled")} />
            <SettingsToggle label="Casino Enabled" enabled={getBool("casino_enabled")} onToggle={() => toggleBool("casino_enabled")} />
            <SettingsToggle label="Deposits Enabled" enabled={getBool("deposit_enabled")} onToggle={() => toggleBool("deposit_enabled")} />
            <SettingsToggle label="Withdrawals Enabled" enabled={getBool("withdrawal_enabled")} onToggle={() => toggleBool("withdrawal_enabled")} />
            <SettingsToggle label="KYC Required" enabled={getBool("kyc_required")} onToggle={() => toggleBool("kyc_required")} />
            <SettingsToggle label="Maintenance Mode" enabled={getBool("maintenance_mode")} onToggle={() => toggleBool("maintenance_mode")} danger />
          </SettingsSection>
        )}

        {activeCard !== "password" && (
          <Button onClick={handleSave} disabled={saving} className="w-full font-bold gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        )}
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">Settings</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {SETTINGS_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              className={`group relative flex flex-col items-start gap-2 rounded-xl border bg-gradient-to-br p-3.5 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] ${card.color}`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 shadow-sm">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">{card.title}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{card.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ HELPER COMPONENTS ============
function SettingsSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
      </div>
      <div className="p-3 space-y-2.5">{children}</div>
    </div>
  );
}

function SettingsInput({ label, value, onChange, placeholder, secret }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; secret?: boolean }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="flex items-center gap-3">
      <label className="w-36 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</label>
      <div className="relative flex-1">
        <input
          type={secret && !reveal ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-8 rounded-md border border-border bg-surface px-2.5 ${secret ? "pr-8" : ""} text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors`}
        />
        {secret && (
          <button type="button" onClick={() => setReveal((r) => !r)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SettingsToggle({ label, enabled, onToggle, danger }: { label: string; enabled: boolean; onToggle: () => void; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[11px] font-medium ${danger ? "text-live-red" : "text-muted-foreground"}`}>{label}</span>
      <button onClick={onToggle} className="flex items-center">
        {enabled ? (
          <ToggleRight className={`h-6 w-6 ${danger ? "text-live-red" : "text-live"}`} />
        ) : (
          <ToggleLeft className="h-6 w-6 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function SettingsSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-36 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User not found");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        toast({ title: "Error", description: "Current password is incorrect", variant: "destructive" });
        setSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: "Success", description: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <SettingsSection title="Change Password" icon={Lock}>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <label className="w-36 shrink-0 text-[11px] font-medium text-muted-foreground">Current Password</label>
          <div className="relative flex-1">
            <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password"
              className="w-full h-8 rounded-md border border-border bg-surface px-2.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-36 shrink-0 text-[11px] font-medium text-muted-foreground">New Password</label>
          <div className="relative flex-1">
            <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters"
              className="w-full h-8 rounded-md border border-border bg-surface px-2.5 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="w-36 shrink-0 text-[11px] font-medium text-muted-foreground">Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password"
            className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors" />
        </div>
        <Button onClick={handleChangePassword} disabled={saving} size="sm" className="w-full gap-2 mt-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
          Change Password
        </Button>
      </div>
    </SettingsSection>
  );
}

function LogoUploader({ currentUrl, onUploaded }: { currentUrl: string; onUploaded: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Error", description: "Only image files allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo.${ext}`;
      
      // Remove old logo if exists
      await supabase.storage.from("site-assets").remove([path]);
      
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      const publicUrl = urlData.publicUrl + "?t=" + Date.now();
      onUploaded(publicUrl);
      toast({ title: "Logo Uploaded!", description: "Save settings to apply" });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemove = () => {
    onUploaded("");
    toast({ title: "Logo Removed", description: "Save settings to apply" });
  };

  return (
    <div className="flex items-center gap-3">
      <label className="w-36 shrink-0 text-[11px] font-medium text-muted-foreground">Site Logo</label>
      <div className="flex-1 flex items-center gap-2">
        {currentUrl ? (
          <div className="flex items-center gap-2">
            <img src={currentUrl} alt="Logo" className="h-10 w-10 rounded border border-border object-contain bg-surface" />
            <button
              onClick={handleRemove}
              className="flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/5 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground">No custom logo (using default)</p>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-foreground hover:bg-surface transition-colors"
        >
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}

function ThrvexTestButton() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{ success: boolean; checks: Array<{ name: string; status: string; detail: string; httpStatus?: number }>; summary?: string } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("test-thrvex", { body: {} });
      if (error) {
        setResults({ success: false, checks: [{ name: "Connection", status: "fail", detail: error.message }] });
      } else {
        setResults(data);
      }
    } catch (err) {
      setResults({ success: false, checks: [{ name: "Error", status: "fail", detail: String(err) }] });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <Button size="sm" variant="outline" onClick={runTest} disabled={testing} className="w-full gap-2 text-xs font-bold">
        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
        {testing ? "Testing Connection..." : "🔌 Test THRVEX Connection"}
      </Button>
      {results && (
        <div className={`rounded-md border p-2.5 space-y-1.5 ${results.success ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
          <p className={`text-[10px] font-bold ${results.success ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
            {results.success ? "✅ All Checks Passed" : "❌ Connection Failed"}
          </p>
          {results.checks?.map((check, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-px">{check.status === "pass" ? "✅" : "❌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-foreground">{check.name}</p>
                <p className="text-[10px] text-muted-foreground break-all">{check.detail}</p>
              </div>
            </div>
          ))}
          {results.summary && (
            <p className="text-[10px] text-muted-foreground border-t border-border pt-1.5 mt-1">{results.summary}</p>
          )}
          {!results.success && (
            <div className="border-t border-border pt-1.5 mt-1">
              <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">💡 Suggestions:</p>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 mt-0.5">
                <li>• Verify Agent ID & Key with your THRVEX provider</li>
                <li>• Ask provider to whitelist your domain: <span className="font-mono text-foreground">royalbets.casino</span></li>
                <li>• Check if your IP/region is blocked by the provider</li>
                <li>• Ensure Server URL is correct (currently using v9095)</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CallbackTestButton() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    checks: Array<{ name: string; status: string; detail: string }>;
    success: boolean;
  } | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("test-callback", { body: {} });
      if (error) {
        setResults({ success: false, checks: [{ name: "Invoke", status: "fail", detail: error.message }] });
      } else {
        setResults(data);
      }
    } catch (err) {
      setResults({ success: false, checks: [{ name: "Error", status: "fail", detail: String(err) }] });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="mt-1 space-y-2">
      <Button size="sm" variant="outline" onClick={runTest} disabled={testing} className="w-full gap-2 text-xs font-bold">
        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Server className="h-3.5 w-3.5" />}
        {testing ? "Testing Callback..." : "🔗 Test Callback URL"}
      </Button>
      {results && (
        <div className={`rounded-md border p-2.5 space-y-1.5 ${results.success ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
          <p className={`text-[10px] font-bold ${results.success ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
            {results.success ? "✅ Callback Working" : "❌ Callback Issues"}
          </p>
          {results.checks?.map((check, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-[10px] mt-px">{check.status === "pass" ? "✅" : "❌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-foreground">{check.name}</p>
                <p className="text-[10px] text-muted-foreground break-all">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GameRouteOverridesPanel() {
  const [overrides, setOverrides] = useState<Array<{ id: string; game_uid: string; game_name: string; server_url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [newUid, setNewUid] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOverrides = async () => {
    setLoading(true);
    const { data } = await supabase.from("game_route_overrides").select("*").order("created_at", { ascending: false });
    setOverrides((data as any[]) || []);
    setLoading(false);
  };

  useState(() => { fetchOverrides(); });

  const handleAdd = async () => {
    if (!newUid.trim() || !newUrl.trim()) {
      toast({ title: "Error", description: "Game UID and Server URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("game_route_overrides").upsert(
      { game_uid: newUid.trim(), game_name: newName.trim(), server_url: newUrl.trim() },
      { onConflict: "game_uid" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: `Route override for ${newUid.trim()} added` });
      setNewUid(""); setNewName(""); setNewUrl("");
      fetchOverrides();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("game_route_overrides").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchOverrides();
  };

  return (
    <SettingsSection title="Per-Game Route Overrides" icon={Gamepad2}>
      <p className="text-[10px] text-muted-foreground mb-2">
        Yahan specific games ke liye custom server URL set karein. Override milega toh default URL skip hoga.
      </p>

      {/* Add form */}
      <div className="space-y-1.5 rounded-md border border-primary/20 bg-primary/5 p-2.5 mb-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Add Override</p>
        <div className="flex items-center gap-2">
          <input value={newUid} onChange={(e) => setNewUid(e.target.value)} placeholder="Game UID (e.g. 22_22001)"
            className="flex-1 h-7 rounded-md border border-border bg-surface px-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name (optional)"
            className="flex-1 h-7 rounded-md border border-border bg-surface px-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
        </div>
        <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Server URL (e.g. https://live.thrvex.site/v9095/play)"
          className="w-full h-7 rounded-md border border-border bg-surface px-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary" />
        <Button size="sm" onClick={handleAdd} disabled={saving} className="w-full gap-1.5 text-xs h-7">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {saving ? "Saving..." : "Add Override"}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
      ) : overrides.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-3">No per-game overrides yet. All games use default URL.</p>
      ) : (
        <div className="space-y-1.5">
          {overrides.map((o) => (
            <div key={o.id} className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-foreground truncate">
                  {o.game_uid} {o.game_name && <span className="font-normal text-muted-foreground">— {o.game_name}</span>}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{o.server_url}</p>
              </div>
              <button onClick={() => handleDelete(o.id)} className="shrink-0 text-destructive hover:text-destructive/80">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}
