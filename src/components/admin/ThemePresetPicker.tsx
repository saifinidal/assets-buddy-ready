import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, Palette, Loader2, Eye, X, RotateCcw } from "lucide-react";
import { applyThemeVars } from "@/components/ThemeApplier";

type Preset = {
  id: string;
  label: string;
  swatches: string[];
  values: Record<string, string>;
};

const PRESETS: Preset[] = [
  {
    id: "white-red",
    label: "White + Red",
    swatches: ["#ffffff", "#dc2626"],
    values: {
      theme_primary_hsl: "0 75% 50%",
      theme_accent_hsl: "0 75% 50%",
      theme_background_hsl: "0 0% 100%",
      theme_foreground_hsl: "220 25% 12%",
      theme_navbar_hsl: "0 75% 50%",
      theme_force_light: "true",
    },
  },
  {
    id: "white-orange",
    label: "White + Orange",
    swatches: ["#ffffff", "#f97316"],
    values: {
      theme_primary_hsl: "24 95% 53%",
      theme_accent_hsl: "24 95% 53%",
      theme_background_hsl: "0 0% 100%",
      theme_foreground_hsl: "220 25% 12%",
      theme_navbar_hsl: "24 95% 53%",
      theme_force_light: "true",
    },
  },
  {
    id: "dark-gold",
    label: "Dark + Gold",
    swatches: ["#0a0e1a", "#facc15"],
    values: {
      theme_primary_hsl: "45 100% 50%",
      theme_accent_hsl: "45 100% 50%",
      theme_background_hsl: "220 25% 8%",
      theme_foreground_hsl: "210 20% 92%",
      theme_navbar_hsl: "220 30% 10%",
      theme_force_light: "false",
    },
  },
  {
    id: "white-blue",
    label: "White + Blue",
    swatches: ["#ffffff", "#2563eb"],
    values: {
      theme_primary_hsl: "221 83% 53%",
      theme_accent_hsl: "221 83% 53%",
      theme_background_hsl: "0 0% 100%",
      theme_foreground_hsl: "220 25% 12%",
      theme_navbar_hsl: "221 83% 53%",
      theme_force_light: "true",
    },
  },
  {
    id: "white-green",
    label: "White + Green",
    swatches: ["#ffffff", "#16a34a"],
    values: {
      theme_primary_hsl: "142 71% 40%",
      theme_accent_hsl: "142 71% 40%",
      theme_background_hsl: "0 0% 100%",
      theme_foreground_hsl: "220 25% 12%",
      theme_navbar_hsl: "142 71% 40%",
      theme_force_light: "true",
    },
  },
  {
    id: "white-purple",
    label: "White + Purple",
    swatches: ["#ffffff", "#9333ea"],
    values: {
      theme_primary_hsl: "271 81% 56%",
      theme_accent_hsl: "271 81% 56%",
      theme_background_hsl: "0 0% 100%",
      theme_foreground_hsl: "220 25% 12%",
      theme_navbar_hsl: "271 81% 56%",
      theme_force_light: "true",
    },
  },
];

// Convert "#rrggbb" -> "h s% l%"
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Convert "h s% l%" -> "#rrggbb" for the color input
function hslToHex(hsl: string): string {
  const m = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!m) return "#000000";
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function ThemePresetPicker() {
  const [current, setCurrent] = useState<string>("");
  const [saving, setSaving] = useState<string | null>(null);
  const [customPrimary, setCustomPrimary] = useState("#dc2626");
  const [customBg, setCustomBg] = useState("#ffffff");
  const [customText, setCustomText] = useState("#1a1f2e");
  const [customNavbar, setCustomNavbar] = useState("#dc2626");
  const [loaded, setLoaded] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  // Snapshot of original saved theme — restored if admin cancels preview
  const originalRef = useRef<Record<string, string> | null>(null);

  // Load current saved values into the custom pickers
  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key, value")
      .like("key", "theme_%")
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        (data as any[]).forEach((r) => { map[r.key] = r.value; });
        originalRef.current = { ...map };
        if (map.theme_preset) setCurrent(map.theme_preset);
        if (map.theme_primary_hsl) setCustomPrimary(hslToHex(map.theme_primary_hsl));
        if (map.theme_background_hsl) setCustomBg(hslToHex(map.theme_background_hsl));
        if (map.theme_foreground_hsl) setCustomText(hslToHex(map.theme_foreground_hsl));
        if (map.theme_navbar_hsl) setCustomNavbar(hslToHex(map.theme_navbar_hsl));
        setLoaded(true);
      });
  }, []);

  // Build current custom theme map
  const buildCustomMap = (): Record<string, string> => {
    const bgHsl = hexToHsl(customBg);
    const bgL = parseInt(bgHsl.split(" ")[2]);
    const isDarkBg = bgL < 50;
    return {
      theme_primary_hsl: hexToHsl(customPrimary),
      theme_accent_hsl: hexToHsl(customPrimary),
      theme_background_hsl: bgHsl,
      theme_foreground_hsl: hexToHsl(customText),
      theme_navbar_hsl: hexToHsl(customNavbar),
      theme_force_light: isDarkBg ? "false" : "true",
      theme_preset: "custom",
    };
  };

  // LIVE PREVIEW: whenever any color changes while in preview mode,
  // apply to :root immediately so admin sees the whole site update in real time.
  useEffect(() => {
    if (!previewMode || !loaded) return;
    applyThemeVars(buildCustomMap());
  }, [previewMode, loaded, customPrimary, customBg, customText, customNavbar]);

  const startPreview = () => {
    if (!loaded) return;
    setPreviewMode(true);
    applyThemeVars(buildCustomMap());
    toast({ title: "Live Preview ON", description: "Sirf aap dekh rahe hain. 'Apply' se save hoga, 'Cancel' se restore." });
  };

  const cancelPreview = () => {
    setPreviewMode(false);
    if (originalRef.current) applyThemeVars(originalRef.current);
    // Reset pickers to original
    const o = originalRef.current;
    if (o) {
      if (o.theme_primary_hsl) setCustomPrimary(hslToHex(o.theme_primary_hsl));
      if (o.theme_background_hsl) setCustomBg(hslToHex(o.theme_background_hsl));
      if (o.theme_foreground_hsl) setCustomText(hslToHex(o.theme_foreground_hsl));
      if (o.theme_navbar_hsl) setCustomNavbar(hslToHex(o.theme_navbar_hsl));
    }
    toast({ title: "Preview Cancelled", description: "Original theme restore ho gayi." });
  };

  const previewPreset = (preset: Preset) => {
    if (!previewMode) setPreviewMode(true);
    applyThemeVars({ ...preset.values, theme_preset: preset.id });
    setCustomPrimary(hslToHex(preset.values.theme_primary_hsl));
    setCustomBg(hslToHex(preset.values.theme_background_hsl));
    setCustomText(hslToHex(preset.values.theme_foreground_hsl));
    setCustomNavbar(hslToHex(preset.values.theme_navbar_hsl));
  };

  const applyPreset = async (preset: Preset) => {
    setSaving(preset.id);
    const updates = { ...preset.values, theme_preset: preset.id };
    const rows = Object.entries(updates).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
      setSaving(null);
      return;
    }
    setCurrent(preset.id);
    originalRef.current = { ...updates };
    setPreviewMode(false);
    setCustomPrimary(hslToHex(preset.values.theme_primary_hsl));
    setCustomBg(hslToHex(preset.values.theme_background_hsl));
    setCustomText(hslToHex(preset.values.theme_foreground_hsl));
    setCustomNavbar(hslToHex(preset.values.theme_navbar_hsl));
    setSaving(null);
    toast({ title: "Theme Applied", description: `${preset.label} preset is now live for all users.` });
  };

  const applyCustom = async () => {
    setSaving("custom");
    const updates = buildCustomMap();
    const rows = Object.entries(updates).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
      setSaving(null);
      return;
    }
    setCurrent("custom");
    originalRef.current = { ...updates };
    setPreviewMode(false);
    setSaving(null);
    toast({ title: "Custom Theme Applied", description: "Your custom color theme is now live for all users." });
  };

  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 h-9 rounded border border-border bg-background px-2 text-xs font-mono uppercase"
          placeholder="#000000"
        />
      </div>
    </label>
  );

  return (
    <div className="space-y-4">
      {/* Sticky Live Preview banner */}
      {previewMode && (
        <div className="sticky top-0 z-30 -mx-3 px-3 py-2 bg-primary/10 border-y border-primary/30 flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-primary leading-tight">LIVE PREVIEW</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Sirf aapko dikh raha hai. Save karne ke liye Apply dabao.</p>
          </div>
          <Button onClick={cancelPreview} size="sm" variant="outline" className="h-7 px-2 gap-1 text-[11px]">
            <RotateCcw className="h-3 w-3" /> Cancel
          </Button>
          <Button onClick={applyCustom} disabled={saving !== null} size="sm" className="h-7 px-2 gap-1 text-[11px]">
            {saving === "custom" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            Apply
          </Button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-bold">Theme Presets</h4>
          </div>
          {!previewMode && (
            <button
              onClick={startPreview}
              disabled={!loaded}
              className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
            >
              <Eye className="h-3 w-3" /> Start Preview
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          {previewMode
            ? "Click any preset to preview live. Apply karne par sab users ko dikhega."
            : "Click a preset to instantly apply it across the entire site for all users."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => {
            const active = current === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => previewMode ? previewPreset(preset) : applyPreset(preset)}
                disabled={saving !== null}
                className={`relative flex items-center gap-2 rounded-md border-2 p-2.5 text-left transition-all ${
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex -space-x-1">
                  {preset.swatches.map((c, i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold flex-1">{preset.label}</span>
                {saving === preset.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                ) : active ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border border-border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            Custom Theme Builder
          </h4>
          {!previewMode ? (
            <Button onClick={startPreview} disabled={!loaded} size="sm" variant="outline" className="h-7 gap-1 text-[11px]">
              <Eye className="h-3 w-3" /> Live Preview
            </Button>
          ) : (
            <span className="text-[10px] font-bold text-primary flex items-center gap-1">
              <Eye className="h-3 w-3 animate-pulse" /> PREVIEWING
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {previewMode
            ? "Color change karte hi poori site update hogi (sirf aapke browser mein). Save ke liye Apply dabao."
            : "Set each color independently. Click 'Live Preview' to see changes instantly."}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Primary (Buttons)" value={customPrimary} onChange={setCustomPrimary} />
          <ColorField label="Navbar / Header" value={customNavbar} onChange={setCustomNavbar} />
          <ColorField label="Background" value={customBg} onChange={setCustomBg} />
          <ColorField label="Text Color" value={customText} onChange={setCustomText} />
        </div>

        {/* Mini swatch preview (always visible) */}
        <div
          className="rounded-md border border-border overflow-hidden"
          style={{ backgroundColor: customBg, color: customText }}
        >
          <div
            className="px-3 py-2 text-xs font-bold"
            style={{ backgroundColor: customNavbar, color: customBg }}
          >
            Mini Preview
          </div>
          <div className="p-3 space-y-2">
            <p className="text-xs">Body text on your background.</p>
            <button
              type="button"
              className="px-3 py-1.5 rounded text-xs font-bold"
              style={{ backgroundColor: customPrimary, color: customBg }}
            >
              Primary Button
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {previewMode && (
            <Button onClick={cancelPreview} variant="outline" size="sm" className="flex-1 gap-2">
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
          <Button onClick={applyCustom} disabled={saving !== null || !loaded} size="sm" className="flex-1 gap-2">
            {saving === "custom" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {previewMode ? "Apply & Save" : "Apply Custom Theme"}
          </Button>
        </div>
      </div>
    </div>
  );
}

