import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store";
import { LoadingSkeleton } from "@/components/common";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuthStore();
  const location = useLocation();

  // Show loading only during actual auth operations, not during initial load
  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSkeleton type="page" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding guard: if user has not completed plan setup,
  // force them to the plan setup wizard (except when already there)
  if (user && !user.hasCompletedSetup && location.pathname !== "/plan/setup") {
    return <Navigate to="/plan/setup" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
