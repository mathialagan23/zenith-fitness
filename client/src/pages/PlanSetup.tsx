import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, usePlanStore } from "@/store";
import { PlanWizard } from "@/features/plan";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

const PlanSetup = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { plan, fetchPlan, resetWizard, initializeWizardFromPlan } = usePlanStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch existing plan when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchPlan();
  }, [isAuthenticated, fetchPlan]);

  // Initialize wizard from plan once it has been loaded
  useEffect(() => {
    if (!isAuthenticated) return;

    if (plan) {
      initializeWizardFromPlan(plan);
    } else {
      resetWizard();
    }
  }, [isAuthenticated, plan, initializeWizardFromPlan, resetWizard]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {plan ? "Edit Your Plan" : "Create Your Plan"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user?.name ? `Welcome, ${user.name}!` : "Set up your personalized fitness plan"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PlanWizard />
      </div>
    </div>
  );
};

export default PlanSetup;
