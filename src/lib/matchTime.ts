/**
 * Format a match openDate like the AnnaExch listing:
 *   - In-Play   → "In-Play" (caller decides styling)
 *   - Today     → "HH:MM"            e.g. "21:30"
 *   - Tomorrow  → "Tomorrow HH:MM"   e.g. "Tomorrow 01:30"
 *   - Later     → "YYYY-MM-DD HH:MM" e.g. "2026-04-25 15:00"
 */
export function formatMatchTimeLabel(openDate: string | null | undefined): string {
  if (!openDate) return "";
  const d = new Date(openDate);
  if (isNaN(d.getTime())) return openDate;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfter = new Date(startOfTomorrow);
  startOfDayAfter.setDate(startOfDayAfter.getDate() + 1);

  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const time = `${hh}:${mm}`;

  if (d >= startOfToday && d < startOfTomorrow) return time;
  if (d >= startOfTomorrow && d < startOfDayAfter) return `Tomorrow ${time}`;

  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da} ${time}`;
}
