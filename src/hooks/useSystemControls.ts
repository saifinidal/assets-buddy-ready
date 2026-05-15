import { useSiteSettings } from "./useSiteSettings";

/**
 * Centralized read of admin "System Controls" toggles.
 * Defaults are PERMISSIVE so a fresh DB (no row) doesn't lock users out —
 * except `maintenance_mode` which defaults to OFF.
 */
export function useSystemControls() {
  const { settings, loading } = useSiteSettings();
  const flag = (key: string, fallback: boolean) => {
    const v = settings[key];
    if (v === undefined || v === null || v === "") return fallback;
    return v === "true";
  };

  return {
    loading,
    registrationOpen: flag("registration_open", true),
    bettingEnabled: flag("betting_enabled", true),
    casinoEnabled: flag("casino_enabled", true),
    depositEnabled: flag("deposit_enabled", true),
    withdrawalEnabled: flag("withdrawal_enabled", true),
    kycRequired: flag("kyc_required", false),
    maintenanceMode: flag("maintenance_mode", false),
  };
}

/**
 * Currency helper: returns symbol + formatter that respects the admin-configured
 * `site_currency`. Common codes are mapped to symbols; unknown codes fall back
 * to the code itself ("USDT 100.00").
 */
const SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", PKR: "₨", BDT: "৳",
  AED: "د.إ", AUD: "A$", CAD: "C$",
};

export function useCurrency() {
  const { settings } = useSiteSettings();
  const code = (settings.site_currency || "INR").toUpperCase();
  const symbol = SYMBOLS[code] || code + " ";
  const format = (n: number | string | null | undefined, opts?: { decimals?: number }) => {
    const num = Number(n ?? 0);
    const d = opts?.decimals ?? (Number.isInteger(num) ? 0 : 2);
    return `${symbol}${num.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;
  };
  return { code, symbol, format };
}
