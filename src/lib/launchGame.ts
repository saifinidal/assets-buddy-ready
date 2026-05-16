import { supabase } from "@/integrations/supabase/loose";

const DEFAULTS = {
  thrvex_server_url: "https://live.thrvex.site/v9095/play",
  thrvex_spribe_url: "https://live.thrvex.site/v9095/play",
  thrvex_agent_id: "ROYALBET",
  thrvex_agent_key: "sk_live_nijlyophvz6e9mn1ejfd0n33",
  thrvex_callback_url: "https://project--c531bf07-58db-41fa-957e-c3698f99f29d.lovable.app/api/public/callback",
};

let settingsCache: Record<string, string> | null = null;
const PROJECT_ID = "c531bf07-58db-41fa-957e-c3698f99f29d";

function getDefaultCallbackUrl() {
  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("preview--") ||
    host.includes("-dev.lovable.app") ||
    host.includes("lovableproject.com");

  const stableHost = isPreviewHost
    ? `project--${PROJECT_ID}-dev.lovable.app`
    : `project--${PROJECT_ID}.lovable.app`;

  return `https://${stableHost}/api/public/callback`;
}

async function loadSettings(): Promise<Record<string, string>> {
  if (settingsCache) return settingsCache;
  try {
    const { data } = await supabase
      .from("site_settings")
      .select("key,value")
      .like("key", "thrvex_%");
    const merged: Record<string, string> = { ...DEFAULTS };
    for (const row of (data as Array<{ key: string; value: string }> | null) || []) {
      if (row.value) merged[row.key] = row.value;
    }
    settingsCache = merged;
  } catch {
    settingsCache = { ...DEFAULTS };
  }
  return settingsCache;
}

/**
 * Build the THRVEX launch URL and open it directly in a new tab.
 */
export async function launchGameInNewTab(params: {
  gameId: string;
  userId: string;
  currency?: string;
}): Promise<{ ok: boolean; popupBlocked?: boolean; url?: string; error?: string }> {
  // Open the tab synchronously inside the click handler to avoid popup blockers
  const placeholder = window.open("about:blank", "_blank");

  try {
    const s = await loadSettings();
    const base = s.thrvex_server_url;

    const callback = s.thrvex_callback_url || getDefaultCallbackUrl();

    const q = new URLSearchParams({
      agentid: s.thrvex_agent_id,
      agentkey: s.thrvex_agent_key,
      userid: params.userId,
      gameid: params.gameId,
      callbackurl: callback,
      currency: params.currency || "INR",
    });

    const url = `${base}?${q.toString()}`;

    if (placeholder) {
      placeholder.location.href = url;
      return { ok: true, url };
    }
    return { ok: true, popupBlocked: true, url };
  } catch (e) {
    placeholder?.close();
    const msg = e instanceof Error ? e.message : "Failed to launch game";
    return { ok: false, error: msg };
  }
}
