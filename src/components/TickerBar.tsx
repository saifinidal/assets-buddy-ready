import { useSiteSettings } from "@/hooks/useSiteSettings";

export function TickerBar() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";
  const tickerText = `ICC Men's T20 World Cup 2026 • IPL Season 19 Live Now • Premier League Matchday 30 • ATP Finals Round Robin • Welcome to ${siteName} - Premium Betting Exchange • `;
  
  return (
    <div className="bg-ticker overflow-hidden h-7 flex items-center">
      <div className="animate-marquee whitespace-nowrap flex">
        <span className="text-ticker text-xs font-medium px-4">{tickerText}</span>
        <span className="text-ticker text-xs font-medium px-4">{tickerText}</span>
      </div>
    </div>
  );
}
