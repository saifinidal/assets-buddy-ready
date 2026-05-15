import { useLocation } from "react-router-dom";
import { Wrench } from "lucide-react";
import { useSystemControls } from "@/hooks/useSystemControls";
import { useAuth } from "@/contexts/AuthContext";
import { SiteLogo } from "@/components/SiteLogo";

/**
 * Full-screen maintenance overlay shown to non-admins when `maintenance_mode` is ON.
 * Admin/Agent panel routes are always accessible so the team can fix things.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { maintenanceMode, loading } = useSystemControls();
  const { canAccessAdmin, canAccessAgent } = useAuth();
  const location = useLocation();

  // Always allow admin/agent routes
  const isStaffRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/agent") ||
    location.pathname.startsWith("/login");

  if (loading || !maintenanceMode || canAccessAdmin() || canAccessAgent() || isStaffRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center"><SiteLogo /></div>
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Wrench className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Under Maintenance</h1>
        <p className="text-sm text-muted-foreground">
          We're upgrading the system to serve you better. Please check back in a few minutes.
        </p>
      </div>
    </div>
  );
}
