import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function ApkInstallBanner() {
  const { settings, loading } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (loading) return;
    const enabled = settings.apk_download_enabled === "true";
    const url = settings.apk_download_url;
    if (!enabled || !url) return;

    // Only show on mobile / don't show if already dismissed this session
    const wasDismissed = sessionStorage.getItem("apk-banner-dismissed");
    if (wasDismissed) return;

    setShow(true);
  }, [loading, settings]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    sessionStorage.setItem("apk-banner-dismissed", "true");
  };

  if (!show || dismissed) return null;

  const apkUrl = settings.apk_download_url;

  return (
    <div className="bg-primary text-primary-foreground px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2 min-w-0">
        <Download className="h-4 w-4 shrink-0" />
        <p className="text-[11px] font-medium truncate">
          Download our App for better experience!
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={apkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-primary-foreground text-primary px-3 py-1 text-[10px] font-bold hover:opacity-90 transition-opacity"
        >
          Install APK
        </a>
        <button
          onClick={handleDismiss}
          className="rounded p-0.5 hover:bg-primary-foreground/20 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
