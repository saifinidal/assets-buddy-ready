import { useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Save, Loader2, Image, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export function AdminPopupSettings() {
  const { settings, loading, updateMultiple } = useSiteSettings();
  const [local, setLocal] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const get = (key: string) => local[key] !== undefined ? local[key] : (settings[key] || "");
  const set = (key: string, value: string) => setLocal(p => ({ ...p, [key]: value }));
  const getBool = (key: string) => get(key) === "true";
  const toggleBool = (key: string) => set(key, getBool(key) ? "false" : "true");

  const handleSave = async () => {
    setSaving(true);
    const toSave: Record<string, string> = {};
    Object.entries(local).forEach(([key, value]) => {
      if (settings[key] !== value) toSave[key] = value;
    });
    if (Object.keys(toSave).length > 0) await updateMultiple(toSave);
    toast({ title: "Popup Settings Saved" });
    setLocal({});
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 max-w-lg">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
          <Image className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Welcome Popup Settings</h3>
        </div>
        <div className="p-3 space-y-3">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Popup Enabled</span>
            <button onClick={() => toggleBool("popup_enabled")} className="flex items-center">
              {getBool("popup_enabled") ? <ToggleRight className="h-6 w-6 text-live" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
            </button>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Title</label>
            <input value={get("popup_title")} onChange={e => set("popup_title", e.target.value)}
              className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
          </div>

          {/* Subtitle */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Subtitle</label>
            <input value={get("popup_subtitle")} onChange={e => set("popup_subtitle", e.target.value)}
              className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
          </div>

          {/* Button text */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Button Text</label>
            <input value={get("popup_button_text")} onChange={e => set("popup_button_text", e.target.value)}
              className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
          </div>

          {/* Button link */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Button Link</label>
            <input value={get("popup_button_link")} onChange={e => set("popup_button_link", e.target.value)}
              className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
          </div>

          {/* Background color */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">BG Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={get("popup_bg_color")} onChange={e => set("popup_bg_color", e.target.value)}
                className="h-8 w-10 rounded border border-border cursor-pointer" />
              <input value={get("popup_bg_color")} onChange={e => set("popup_bg_color", e.target.value)}
                className="h-8 w-24 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none" />
            </div>
          </div>

          {/* Show mode */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Show Mode</label>
            <select value={get("popup_show_mode")} onChange={e => set("popup_show_mode", e.target.value)}
              className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none">
              <option value="once">Show Once Per User</option>
              <option value="always">Show Every Visit</option>
            </select>
          </div>

          {/* Delay */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Delay (sec)</label>
            <input type="number" min="0" max="30" value={get("popup_delay")} onChange={e => set("popup_delay", e.target.value)}
              className="w-20 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
          </div>

          {/* Auto close */}
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Auto Close (sec)</label>
            <input type="number" min="0" max="60" value={get("popup_auto_close")} onChange={e => set("popup_auto_close", e.target.value)}
              className="w-20 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
            <span className="text-[10px] text-muted-foreground">0 = off</span>
          </div>
        </div>
      </div>

      {/* Floating Support Buttons */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
          <Image className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Floating Support Buttons</h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Enabled</span>
            <button onClick={() => toggleBool("support_floating_enabled")} className="flex items-center">
              {getBool("support_floating_enabled") ? <ToggleRight className="h-6 w-6 text-live" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">WhatsApp #</label>
            <input value={get("support_whatsapp")} onChange={e => set("support_whatsapp", e.target.value)}
              placeholder="919876543210"
              className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-[11px] font-medium text-muted-foreground">Telegram</label>
            <input value={get("support_telegram")} onChange={e => set("support_telegram", e.target.value)}
              placeholder="@username or https://t.me/..."
              className="flex-1 h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full font-bold gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
}
