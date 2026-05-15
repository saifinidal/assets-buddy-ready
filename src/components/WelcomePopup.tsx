import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function WelcomePopup() {
  const { settings, loading } = useSiteSettings();
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (loading) return;
    const enabled = settings.popup_enabled !== "false";
    if (!enabled) return;

    const showMode = settings.popup_show_mode || "once";
    const delay = parseInt(settings.popup_delay || "1") * 1000;

    if (showMode === "once") {
      const seen = localStorage.getItem("popup-seen");
      if (seen) return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => setAnimate(true));
    }, delay);

    // Auto close
    const autoClose = parseInt(settings.popup_auto_close || "0") * 1000;
    let closeTimer: ReturnType<typeof setTimeout>;
    if (autoClose > 0) {
      closeTimer = setTimeout(() => handleClose(), delay + autoClose);
    }

    return () => { clearTimeout(timer); clearTimeout(closeTimer); };
  }, [loading, settings]);

  const handleClose = () => {
    setAnimate(false);
    localStorage.setItem("popup-seen", "true");
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible) return null;

  const title = settings.popup_title || "Welcome to ROYAL BET";
  const subtitle = settings.popup_subtitle || "Fast, Secure, Smart Experience";
  const btnText = settings.popup_button_text || "Get Started Now";
  const btnLink = settings.popup_button_link || "/signup";
  const bgColor = settings.popup_bg_color || "#1a1a2e";

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${animate ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Popup Card */}
      <div
        className={`relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${
          animate ? "scale-100 translate-y-0" : "scale-90 translate-y-8"
        }`}
        style={{ background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 50%, hsl(0 80% 35%) 100%)` }}
      >
        {/* Glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/15 rounded-full blur-2xl" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 rounded-full bg-white/10 p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="relative px-6 py-10 text-center">
          {/* Sparkle icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent to-primary shadow-lg shadow-primary/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>

          <h2 className="font-display text-2xl font-bold text-white mb-2 tracking-wide">
            {title}
          </h2>
          <p className="text-white/70 text-sm mb-6 max-w-xs mx-auto">
            {subtitle}
          </p>

          {/* CTA Button */}
          <Link
            to={btnLink}
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 font-display text-sm font-bold text-white uppercase tracking-wider shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
          >
            {btnText}
          </Link>

          {/* Bottom decorative line */}
          <div className="mt-6 flex justify-center gap-1">
            <div className="h-1 w-8 rounded-full bg-primary/50" />
            <div className="h-1 w-4 rounded-full bg-accent/50" />
            <div className="h-1 w-2 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
