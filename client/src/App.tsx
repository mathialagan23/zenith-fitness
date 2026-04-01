import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout, ProtectedRoute } from "@/components/layout";
import { LoadingSkeleton, ErrorBoundary } from "@/components/common";
import { useAuthStore } from "@/store";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DietTracker = lazy(() => import("./pages/DietTracker"));
const WorkoutTracker = lazy(() => import("./pages/WorkoutTracker"));
const Progress = lazy(() => import("./pages/Progress"));
const Insights = lazy(() => import("./pages/Insights"));
const Settings = lazy(() => import("./pages/Settings"));
const PlanSetup = lazy(() => import("./pages/PlanSetup"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const MyPlan = lazy(() => import("./pages/MyPlan"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-background">
      <LoadingSkeleton type="page" />
    </div>
  );
}

// Auth check wrapper
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      checkAuth();
    }
  }, []);

  return <>{children}</>;
}

// Auth route guard (redirect if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();

  if (isLoading && !isInitialized) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Auth routes */}
                <Route
                  path="/login"
                  element={
                    <AuthRoute>
                      <Login />
                    </AuthRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthRoute>
                      <Register />
                    </AuthRoute>
                  }
                />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                 <Route
                    path="/plan/setup"
                    element={<PlanSetup />}
                  />

                  <Route
                    path="/"
                    element={
                      <Layout>
                        <Dashboard />
                      </Layout>
                    }
                  />
                  <Route
                    path="/diet"
                    element={
                      <Layout>
                        <DietTracker />
                      </Layout>
                    }
                  />
                  <Route
                    path="/workout"
                    element={
                      <Layout>
                        <WorkoutTracker />
                      </Layout>
                    }
                  />
                  <Route
                    path="/progress"
                    element={
                      <Layout>
                        <Progress />
                      </Layout>
                    }
                  />
                  <Route
                    path="/insights"
                    element={
                      <Layout>
                        <Insights />
                      </Layout>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Layout>
                        <Settings />
                      </Layout>
                    }
                  />
                  <Route
                    path="/plan"
                    element={
                      <Layout>
                        <MyPlan />
                      </Layout>
                    }
                  />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
