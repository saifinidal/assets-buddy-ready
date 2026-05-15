import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  [key: string]: string;
}

// Module-level cache so every component shares the same live state and we
// only open ONE realtime channel for the entire app.
let cachedSettings: SiteSettings | null = null;
const subscribers = new Set<(s: SiteSettings) => void>();
let initPromise: Promise<void> | null = null;
let realtimeBound = false;

async function loadAll() {
  const { data } = await supabase.from("site_settings").select("key, value");
  const map: SiteSettings = {};
  (data as any[] | null)?.forEach((s) => { map[s.key] = s.value; });
  cachedSettings = map;
  subscribers.forEach((cb) => cb(map));
}

function bindRealtime() {
  if (realtimeBound) return;
  realtimeBound = true;
  supabase
    .channel("site-settings-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_settings" },
      (payload) => {
        const next: SiteSettings = { ...(cachedSettings || {}) };
        const row: any = payload.new || payload.old;
        if (!row?.key) return;
        if (payload.eventType === "DELETE") delete next[row.key];
        else next[row.key] = row.value;
        cachedSettings = next;
        subscribers.forEach((cb) => cb(next));
      }
    )
    .subscribe();
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || {});
  const [loading, setLoading] = useState(cachedSettings === null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const cb = (s: SiteSettings) => { if (mountedRef.current) setSettings(s); };
    subscribers.add(cb);

    if (!initPromise) initPromise = loadAll().finally(() => {});
    initPromise.then(() => { if (mountedRef.current) setLoading(false); });

    bindRealtime();

    return () => {
      mountedRef.current = false;
      subscribers.delete(cb);
    };
  }, []);

  const fetchSettings = useCallback(async () => {
    initPromise = loadAll();
    await initPromise;
  }, []);

  const updateSetting = useCallback(async (key: string, value: string) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      console.error("[useSiteSettings] upsert failed", key, error);
      throw error;
    }
    cachedSettings = { ...(cachedSettings || {}), [key]: value };
    subscribers.forEach((cb) => cb(cachedSettings!));
  }, []);

  const updateMultiple = useCallback(async (updates: Record<string, string>) => {
    const rows = Object.entries(updates).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    const { error } = await supabase
      .from("site_settings")
      .upsert(rows, { onConflict: "key" });
    if (error) {
      console.error("[useSiteSettings] bulk upsert failed", error);
      throw error;
    }
    cachedSettings = { ...(cachedSettings || {}), ...updates };
    subscribers.forEach((cb) => cb(cachedSettings!));
  }, []);

  return { settings, loading, fetchSettings, updateSetting, updateMultiple };
}
