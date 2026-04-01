import { usePlanStore } from "@/store";
import { StepIndicator } from "./StepIndicator";
import {
  ProfileStep,
  DietPlanStep,
  WorkoutPlanStep,
  ScheduleStep,
  ReviewStep,
} from "./steps";

const STEPS = [
  { title: "Profile", description: "Basic info" },
  { title: "Diet Plan", description: "Meals & food" },
  { title: "Workout", description: "Exercises" },
  { title: "Schedule", description: "Weekly plan" },
  { title: "Review", description: "Confirm & save" },
];

export const PlanWizard = () => {
  const { wizardStep, setWizardStep } = usePlanStore();

  const renderStep = () => {
    switch (wizardStep) {
      case 0:
        return <ProfileStep />;
      case 1:
        return <DietPlanStep />;
      case 2:
        return <WorkoutPlanStep />;
      case 3:
        return <ScheduleStep />;
      case 4:
        return <ReviewStep />;
      default:
        return <ProfileStep />;
    }
  };

  return (
    <div className="space-y-8">
      <StepIndicator
        steps={STEPS}
        currentStep={wizardStep}
        onStepClick={(step) => {
          // Only allow going back to previous steps
          if (step < wizardStep) {
            setWizardStep(step);
          }
        }}
      />

      <div className="min-h-[400px]">{renderStep()}</div>
    </div>
  );
};
