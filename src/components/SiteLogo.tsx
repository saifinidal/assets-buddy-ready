import { Link } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import defaultLogo from "@/assets/logo-royalbet.png";

interface SiteLogoProps {
  size?: "sm" | "md" | "lg";
  linkTo?: string;
  showName?: boolean;
}

export function SiteLogo({ size = "md", linkTo = "/", showName = true }: SiteLogoProps) {
  const { settings } = useSiteSettings();
  const siteName = settings.site_name || "ROYAL BET";
  const logoUrl = settings.site_logo_url || defaultLogo;

  const sizes = {
    sm: { box: "h-7 w-7", nameText: "text-base" },
    md: { box: "h-9 w-9", nameText: "text-xl" },
    lg: { box: "h-11 w-11", nameText: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <Link to={linkTo} className="inline-flex items-center gap-2">
      <img src={logoUrl} alt={siteName} className={`${s.box} rounded object-contain`} />
      {showName && (
        <span className={`font-display ${s.nameText} font-bold tracking-wider text-foreground`}>
          {siteName}
        </span>
      )}
    </Link>
  );
}
