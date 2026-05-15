import { useSpribeBalanceSync } from "@/hooks/useSpribeBalanceSync";

/**
 * Mounted once near the app root. Silently pulls any Spribe (transfer wallet)
 * balance back into the main wallet on every route change.
 */
export function SpribeBalanceSync() {
  useSpribeBalanceSync();
  return null;
}
