import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Menu, X, LogOut, User, Shield, ChevronDown, MessageCircle } from "lucide-react";
import { useAuth, ROLE_LABELS } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import defaultLogoPng from "@/assets/logo-royalbet.png";
import defaultLogoSvg from "@/assets/logo-royalbet.svg";
import { ApkInstallBanner } from "@/components/ApkInstallBanner";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary text-primary-foreground",
  super_stockist: "bg-[hsl(var(--highlight)/.15)] text-[hsl(var(--highlight))]",
  stockist: "bg-primary/12 text-primary",
  master: "bg-[hsl(var(--back)/.15)] text-[hsl(var(--back))]",
  agent: "bg-[hsl(var(--live)/.15)] text-[hsl(var(--live))]",
  sub_agent: "bg-secondary text-muted-foreground",
  user: "bg-secondary text-muted-foreground",
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, isLoggedIn, logout, canAccessAdmin, canAccessAgent } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";
  // Prefer admin-uploaded logo; otherwise default to crisp SVG (vector, sharp at any DPI).
  const logoUrl = settings.site_logo_url || defaultLogoSvg;
  // Detect raster logos (uploaded PNG/JPG) so we only emit srcSet for those.
  const isRaster = /\.(png|jpe?g|webp|avif)(\?|$)/i.test(logoUrl);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <>
    <nav className="sticky top-0 z-50 bg-navbar border-b border-border/50 shadow-lg">
      <div className="landscape-nav mx-auto flex h-14 max-h-14 min-h-[56px] items-center justify-between px-2 sm:px-3">
        {/* Logo */}
        <Link to="/" className="flex h-9 items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          <span className="logo-themed-wrap flex h-9 w-9 items-center justify-center shrink-0 overflow-hidden">
            <img
              src={logoUrl}
              srcSet={isRaster ? `${logoUrl} 1x, ${logoUrl} 2x, ${defaultLogoPng} 3x` : undefined}
              alt={siteName}
              width={36}
              height={36}
              decoding="async"
              loading="eager"
              className="logo-themed h-8 w-8 sm:h-9 sm:w-9 object-contain"
              style={{ imageRendering: "auto" }}
            />
          </span>
          <div className="hidden sm:flex flex-col justify-center min-w-0">
            <span className="font-display text-sm md:text-base font-bold tracking-wider text-navbar-fg leading-tight block truncate">
              {siteName.split(" ")[0]}
            </span>
            {siteName.split(" ").length > 1 && (
              <span className="font-display text-[9px] md:text-[10px] font-medium tracking-widest text-navbar-fg/70 uppercase leading-tight block truncate">
                {siteName.split(" ").slice(1).join(" ")}
              </span>
            )}
          </div>
        </Link>

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          <Link to="/" className="touch-target px-3 py-2 text-xs font-semibold text-navbar-fg hover:opacity-75 rounded transition-colors">
            {t("nav.home")}
          </Link>
          <Link to="/inplay" className="touch-target px-3 py-2 text-xs font-semibold text-navbar-fg hover:opacity-75 rounded transition-colors">
            {t("nav.inplay")}
          </Link>
          <Link to="/casino" className="touch-target px-3 py-2 text-xs font-semibold text-navbar-fg hover:opacity-75 rounded transition-colors">
            Casino
          </Link>
          {isLoggedIn && (
            <Link to="/support" className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-navbar-fg hover:opacity-75 rounded transition-colors">
              <MessageCircle className="h-3 w-3" /> {t("nav.support")}
            </Link>
          )}
          {isLoggedIn && canAccessAgent() && (
            <Link to="/agent" className="px-3 py-1.5 text-xs font-semibold text-navbar-fg hover:opacity-75 rounded transition-colors">
              {t("nav.agentPanel")}
            </Link>
          )}
          {isLoggedIn && canAccessAdmin() && (
            <Link to="/admin" className="px-3 py-1.5 text-xs font-semibold text-navbar-fg hover:opacity-75 rounded transition-colors">
              {t("nav.adminPanel")}
            </Link>
          )}
        </div>

        {/* Search bar */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search Events"
              className="w-full h-8 rounded-md border border-border bg-surface pl-3 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link
            to="/rules"
            className="hidden sm:flex items-center rounded-md border border-navbar-fg/30 px-3 py-1.5 text-[10px] font-bold text-navbar-fg hover:bg-navbar-fg/10 transition-colors uppercase tracking-wide"
          >
            {t("nav.rules")}
          </Link>

          {isLoggedIn && currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 rounded-md bg-surface px-2.5 py-1.5 hover:bg-surface-hover transition-colors border border-border/50"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-3 w-3" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] font-semibold text-navbar-fg leading-none">{currentUser.name.split(" ")[0]}</p>
                  <span className={`inline-block mt-0.5 rounded px-1 py-0.5 text-[8px] font-bold uppercase ${ROLE_COLORS[currentUser.role] || "bg-secondary text-muted-foreground"}`}>
                    {ROLE_LABELS[currentUser.role]}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-border bg-surface/50">
                      <p className="text-xs font-semibold text-foreground">{currentUser.name}</p>
                      <p className="text-[10px] text-muted-foreground">{currentUser.email || currentUser.phone}</p>
                      <span className={`inline-block mt-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${ROLE_COLORS[currentUser.role]}`}>
                        {ROLE_LABELS[currentUser.role]}
                      </span>
                    </div>
                    <div className="py-1">
                      <Link to="/account" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface transition-colors">
                        <User className="h-3.5 w-3.5" /> My Account
                      </Link>
                      {canAccessAgent() && (
                        <Link to="/agent" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface transition-colors">
                          <Shield className="h-3.5 w-3.5" /> Agent Panel
                        </Link>
                      )}
                      {canAccessAdmin() && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-surface transition-colors">
                          <Shield className="h-3.5 w-3.5" /> Admin Panel
                        </Link>
                      )}
                      <button onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-surface transition-colors">
                        <LogOut className="h-3.5 w-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/signup" className="touch-target rounded-md bg-signup px-3.5 py-2 text-[11px] font-bold text-white hover:opacity-90 transition-opacity inline-flex items-center">
                {t("nav.signup")}
              </Link>
              <Link to="/login" className="touch-target rounded-md bg-login px-3.5 py-2 text-[11px] font-bold hover:opacity-90 transition-opacity inline-flex items-center">
                {t("nav.login")}
              </Link>
            </>
          )}

          <button
            className="md:hidden text-navbar-fg ml-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border/50 bg-navbar p-3 md:hidden">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search Events"
              className="w-full h-8 rounded-md border border-border bg-surface pl-3 pr-8 text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-0.5">
            <Link to="/" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/inplay" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface" onClick={() => setMobileOpen(false)}>In-Play</Link>
            <Link to="/casino" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface" onClick={() => setMobileOpen(false)}>Casino</Link>
            <Link to="/rules" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface" onClick={() => setMobileOpen(false)}>Rules</Link>
            {isLoggedIn && canAccessAgent() && (
              <Link to="/agent" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface" onClick={() => setMobileOpen(false)}>Agent Panel</Link>
            )}
            {isLoggedIn && canAccessAdmin() && (
              <Link to="/admin" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-surface" onClick={() => setMobileOpen(false)}>Admin Panel</Link>
            )}
            {isLoggedIn && (
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="rounded-md px-3 py-2 text-sm font-medium text-destructive hover:bg-surface text-left"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
    <ApkInstallBanner />
    </>
  );
}
