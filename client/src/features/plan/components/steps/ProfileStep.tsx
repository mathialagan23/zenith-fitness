import { usePlanStore, useAuthStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlowCard } from "@/components/GlowCard";
import { User, Target, Ruler, Scale } from "lucide-react";
import { useEffect } from "react";

const GOALS = [
  { value: "cutting", label: "Cutting", description: "Lose fat while preserving muscle" },
  { value: "bulking", label: "Bulking", description: "Build muscle and gain weight" },
  { value: "maintenance", label: "Maintenance", description: "Maintain current weight" },
  { value: "recomposition", label: "Recomposition", description: "Lose fat and build muscle" },
] as const;

export const ProfileStep = () => {
  const { user } = useAuthStore();
  const { wizardProfile, setWizardProfile, nextStep } = usePlanStore();

  // Initialize from user data if available
  useEffect(() => {
    if (user) {
      setWizardProfile({
        weight: user.weight || 70,
        height: user.height || 170,
        goal: user.goal || "maintenance",
      });
    }
  }, [user, setWizardProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Your Profile</h2>
        <p className="text-muted-foreground mt-2">
          Let's start with some basic information to personalize your plan
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weight */}
        <GlowCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Scale className="w-5 h-5 text-blue-500" />
            </div>
            <Label htmlFor="weight" className="text-base font-medium">
              Current Weight
            </Label>
          </div>
          <div className="relative">
            <Input
              id="weight"
              type="number"
              min={30}
              max={300}
              value={wizardProfile.weight}
              onChange={(e) => setWizardProfile({ weight: Number(e.target.value) })}
              className="pr-12"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              kg
            </span>
          </div>
        </GlowCard>

        {/* Height */}
        <GlowCard className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Ruler className="w-5 h-5 text-green-500" />
            </div>
            <Label htmlFor="height" className="text-base font-medium">
              Height
            </Label>
          </div>
          <div className="relative">
            <Input
              id="height"
              type="number"
              min={100}
              max={250}
              value={wizardProfile.height}
              onChange={(e) => setWizardProfile({ height: Number(e.target.value) })}
              className="pr-12"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              cm
            </span>
          </div>
        </GlowCard>
      </div>

      {/* Goal */}
      <GlowCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Target className="w-5 h-5 text-purple-500" />
          </div>
          <Label className="text-base font-medium">Fitness Goal</Label>
        </div>
        <Select
          value={wizardProfile.goal}
          onValueChange={(value) => setWizardProfile({ goal: value as typeof wizardProfile.goal })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select your goal" />
          </SelectTrigger>
          <SelectContent>
            {GOALS.map((goal) => (
              <SelectItem key={goal.value} value={goal.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{goal.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {goal.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </GlowCard>

      {/* BMI Info */}
      {wizardProfile.weight > 0 && wizardProfile.height > 0 && (
        <div className="text-center p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Your BMI:{" "}
            <span className="font-semibold text-foreground">
              {(wizardProfile.weight / Math.pow(wizardProfile.height / 100, 2)).toFixed(1)}
            </span>
          </p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg">
          Continue to Diet Plan
        </Button>
      </div>
    </form>
  );
};
