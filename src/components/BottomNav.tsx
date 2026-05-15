import { Link, useLocation } from "react-router-dom";
import { Home, Zap, Gamepad2, User, History } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { icon: Home, labelKey: "nav.home", to: "/" },
  { icon: Zap, labelKey: "nav.inplay", to: "/inplay" },
  { icon: Gamepad2, labelKey: "nav.casino", to: "/casino" },
  { icon: History, labelKey: "nav.history", to: "/bet-history", authRequired: true, fallbackLabel: "History" },
  { icon: User, labelKey: "nav.account", to: "/account" },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();

  return (
    <nav className="landscape-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-navbar backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around py-1.5">
        {navItems
          .filter(item => !item.authRequired || isLoggedIn)
          .map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.labelKey}
              to={item.to}
              className={`bottom-nav-item relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-all min-w-[48px] min-h-[44px] justify-center ${
                isActive ? "text-navbar-fg font-bold scale-105" : "text-navbar-fg/60 hover:text-navbar-fg"
              }`}
            >
              <item.icon className="bottom-nav-icon h-5 w-5" />
              <span className="bottom-nav-label text-[9px] font-semibold leading-tight">{t(item.labelKey)}</span>
              {isActive && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-navbar-fg" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
