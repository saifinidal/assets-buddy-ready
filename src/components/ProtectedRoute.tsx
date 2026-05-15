import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAgent?: boolean;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, allowedRoles, requireAgent, requireAdmin }: ProtectedRouteProps) {
  const { currentUser, isLoggedIn, loading, canAccessAdmin, canAccessAgent } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !canAccessAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requireAgent && !canAccessAgent()) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
