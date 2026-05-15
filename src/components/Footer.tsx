import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logo from "@/assets/logo-royalbet.png";

export function Footer() {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";

  return (
    <footer className="border-t border-border/50 bg-navbar py-6 pb-28 md:pb-8">
      <div className="px-6 max-w-4xl mx-auto space-y-4">
        {/* Logo + 18+ Badge */}
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="RoyalBet Logo" className="h-8 w-auto" />
          <span className="font-display text-sm font-bold text-white tracking-wider">{siteName}</span>
          <Link to="/responsible-gaming" className="touch-target flex items-center justify-center h-8 w-8 rounded-full bg-red-600/20 text-red-500 text-[10px] font-black border border-red-500/40 hover:bg-red-600/30 transition-colors" title="18+ Only">
            18+
          </Link>
        </div>

        {/* Main Links */}
        <div className="flex items-center justify-center gap-1 md:gap-2 text-[11px] flex-wrap">
          <Link to="/about" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">About</Link>
          <span className="text-white/40">•</span>
          <Link to="/rules" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">Rules</Link>
          <span className="text-white/40">•</span>
          <Link to="/terms" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">Terms</Link>
          <span className="text-white/40">•</span>
          <Link to="/privacy" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">Privacy</Link>
          <span className="text-white/40">•</span>
          <Link to="/responsible-gaming" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">18+ Gaming</Link>
          <span className="text-white/40">•</span>
          <Link to="/support" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">Support</Link>
        </div>

        {/* Quick Links — desktop only */}
        <div className="hidden md:flex items-center justify-center gap-2 text-[11px] flex-wrap">
          <Link to="/casino" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">Casino</Link>
          <span className="text-white/40">•</span>
          <Link to="/inplay" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">In-Play</Link>
          <span className="text-white/40">•</span>
          <Link to="/bet-history" className="touch-target px-2 py-1.5 text-white/90 hover:text-primary transition-colors">Bet History</Link>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-[10px] text-white/80 leading-relaxed space-y-1">
          <p>© 2026 {siteName}. All rights reserved.</p>
          <p className="text-[9px] text-white/60">This platform is strictly for users aged 18 and above. Gambling involves risk — please play responsibly.</p>
        </div>
      </div>
    </footer>
  );
}
