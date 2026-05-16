import { supabase } from "@/integrations/supabase/loose";

const DEFAULTS = {
  thrvex_server_url: "https://live.thrvex.site/v9095/beta",
  thrvex_spribe_url: "https://live.thrvex.site/v1001/spribe",
  thrvex_agent_id: "GD007",
  thrvex_agent_key: "",
  thrvex_callback_url: "",
};

let settingsCache: Record<string, string> | null = null;

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
 * Returns { ok, popupBlocked, url, error } so caller can show fallback UI.
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
    const isSpribe = /^22_2200[0-9]$/.test(params.gameId);
    const base = isSpribe ? s.thrvex_spribe_url : s.thrvex_server_url;

    const callback =
      s.thrvex_callback_url ||
      `${window.location.origin}/api/callback`;

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
