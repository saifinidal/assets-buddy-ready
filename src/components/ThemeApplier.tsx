import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/loose";

/**
 * Reads theme_* settings from site_settings and applies them as CSS variables
 * on :root. Auto-computes contrast colors (white/black) for any colored
 * surface (primary, navbar, accent) so text/icons always stay readable
 * regardless of which color the admin picks.
 */

const CACHE_KEY = "site-theme-cache-v2";

// Parse "h s% l%" -> { h, s, l }
function parseHsl(hsl: string): { h: number; s: number; l: number } | null {
  const m = hsl.match(/(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!m) return null;
  return { h: +m[1], s: +m[2], l: +m[3] };
}

// Pick black or white text for a given HSL background based on perceived luminance.
function contrastFor(hsl: string): string {
  const c = parseHsl(hsl);
  if (!c) return "0 0% 100%";
  // Use HSL lightness as a quick proxy, slightly biased so red/blue at L=50 still get white text
  return c.l > 62 ? "220 25% 12%" : "0 0% 100%";
}

// Slightly darker / lighter variant of an HSL string (for hover, surface, border)
function adjustL(hsl: string, delta: number): string {
  const c = parseHsl(hsl);
  if (!c) return hsl;
  const l = Math.max(0, Math.min(100, c.l + delta));
  return `${c.h} ${c.s}% ${l}%`;
}

export function applyThemeVars(map: Record<string, string>) {
  return applyVars(map);
}

function applyVars(map: Record<string, string>) {
  const root = document.documentElement;
  const primary = map.theme_primary_hsl;
  const accent = map.theme_accent_hsl || primary;
  const bg = map.theme_background_hsl;
  const fg = map.theme_foreground_hsl;
  const navbar = map.theme_navbar_hsl || primary;

  if (primary) {
    root.style.setProperty("--primary", primary);
    root.style.setProperty("--ring", primary);
    root.style.setProperty("--highlight", primary);
    root.style.setProperty("--sidebar-primary", primary);
    root.style.setProperty("--sidebar-ring", primary);
    root.style.setProperty("--login-bg", primary);
    // Auto-contrast for anything sitting ON primary (buttons, login button label)
    const primaryFg = contrastFor(primary);
    root.style.setProperty("--primary-foreground", primaryFg);
    root.style.setProperty("--login-fg", primaryFg);
    root.style.setProperty("--sidebar-primary-foreground", primaryFg);
  }

  if (accent) {
    root.style.setProperty("--accent", accent);
    root.style.setProperty("--accent-foreground", contrastFor(accent));
  }

  if (bg) {
    root.style.setProperty("--background", bg);
    root.style.setProperty("--card", bg);
    root.style.setProperty("--popover", bg);
    // Surfaces slightly darker (dark bg) or slightly grayer (light bg)
    const bgC = parseHsl(bg);
    const isDark = bgC ? bgC.l < 50 : false;
    const surface = isDark ? adjustL(bg, 4) : adjustL(bg, -4);
    const muted = isDark ? adjustL(bg, 6) : adjustL(bg, -6);
    const border = isDark ? adjustL(bg, 10) : adjustL(bg, -12);
    root.style.setProperty("--surface", surface);
    root.style.setProperty("--surface-hover", isDark ? adjustL(bg, 8) : adjustL(bg, -8));
    root.style.setProperty("--secondary", muted);
    root.style.setProperty("--muted", muted);
    root.style.setProperty("--input", muted);
    root.style.setProperty("--border", border);
    root.style.setProperty("--sport-strip", surface);
    root.style.setProperty("--sidebar-background", surface);
    root.style.setProperty("--sidebar-accent", muted);
    root.style.setProperty("--sidebar-border", border);
  }

  if (fg) {
    root.style.setProperty("--foreground", fg);
    root.style.setProperty("--card-foreground", fg);
    root.style.setProperty("--popover-foreground", fg);
    root.style.setProperty("--secondary-foreground", fg);
    root.style.setProperty("--sidebar-foreground", fg);
    root.style.setProperty("--sidebar-accent-foreground", fg);
    // Muted text = foreground at reduced opacity-ish (mid lightness)
    const fgC = parseHsl(fg);
    if (fgC) {
      const mutedL = fgC.l > 50 ? Math.max(40, fgC.l - 30) : Math.min(60, fgC.l + 35);
      root.style.setProperty("--muted-foreground", `${fgC.h} ${Math.max(8, fgC.s - 10)}% ${mutedL}%`);
    }
  }

  if (navbar) {
    root.style.setProperty("--navbar-bg", navbar);
    root.style.setProperty("--header-dark", adjustL(navbar, -6));
    root.style.setProperty("--ticker-bg", adjustL(navbar, -8));
    // Navbar contrast text — exposed as a custom var for components to use
    const navFg = contrastFor(navbar);
    root.style.setProperty("--navbar-fg", navFg);
    root.style.setProperty("--ticker-fg", navFg);
    // Logo drop-shadow tuned to navbar lightness:
    //  - light navbar  -> dark soft shadow (lifts logo off bg)
    //  - dark navbar   -> warm glow (makes gold/colored logo pop)
    const navC = parseHsl(navbar);
    const isLightNav = navC ? navC.l >= 62 : false;
    const logoShadow = isLightNav
      ? "0 1px 2px rgba(0,0,0,0.45), 0 0 6px rgba(0,0,0,0.25)"
      : "0 0 6px rgba(255,255,255,0.35), 0 1px 2px rgba(0,0,0,0.55)";
    root.style.setProperty("--logo-shadow", logoShadow);
    // Subtle ring around logo to separate it from same-hue navbar
    root.style.setProperty(
      "--logo-ring",
      isLightNav ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.22)"
    );
  }

  if (map.theme_force_light === "true") {
    root.classList.remove("dark");
  } else if (map.theme_force_light === "false" && map.theme_preset === "dark-gold") {
    root.classList.add("dark");
  }
}

// Apply cached theme synchronously at module import — runs before React mounts
try {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) applyVars(JSON.parse(cached));
} catch {}

export function ThemeApplier() {
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .like("key", "theme_%");
      if (cancelled || !data) return;
      const map: Record<string, string> = {};
      (data as any[]).forEach((r) => { map[r.key] = r.value; });
      applyVars(map);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(map)); } catch {}
    };
    load();

    const channel = supabase
      .channel("theme-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, load)
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);
  return null;
}
