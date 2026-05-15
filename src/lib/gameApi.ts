/**
 * THRVEX iGaming Platform - Game Launch API
 * Uses edge function to securely launch games via https://live.thrvex.site/v9095/beta
 * Game UIDs are sent directly as provided by THRVEX platform
 */

export function getGameUid(gameName: string): string {
  // Game UIDs from THRVEX are used directly (exact names from the platform)
  return gameName;
}
