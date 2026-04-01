import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore, useAuthStore } from "@/store";
import { DAYS_OF_WEEK, DAY_LABELS, WeeklySchedule } from "@/types";
import { userService } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlowCard } from "@/components/GlowCard";
import {
  Check,
  UtensilsCrossed,
  Dumbbell,
  Calendar,
  Droplets,
  Flame,
  Loader2,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ReviewStep = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const {
    wizardProfile,
    wizardMeals,
    wizardDayTypes,
    wizardSchedule,
    wizardWaterTarget,
    setWizardWaterTarget,
    getCalculatedTargets,
    submitWizard,
    prevStep,
    isLoading,
    error,
  } = usePlanStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const targets = getCalculatedTargets();

  const getWorkoutForDay = (day: keyof WeeklySchedule) => {
    const dayTypeId = wizardSchedule[day];
    if (!dayTypeId) return null;
    return wizardDayTypes.find((dt) => dt.id === dayTypeId);
  };

  const workoutDaysCount = Object.values(wizardSchedule).filter((v) => v !== null).length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // First update user profile if changed
      if (user) {
        const profileUpdates: Record<string, unknown> = {};
        if (user.weight !== wizardProfile.weight) profileUpdates.weight = wizardProfile.weight;
        if (user.height !== wizardProfile.height) profileUpdates.height = wizardProfile.height;
        if (user.goal !== wizardProfile.goal) profileUpdates.goal = wizardProfile.goal;

        if (Object.keys(profileUpdates).length > 0) {
          const updatedUser = await userService.updateUser(profileUpdates);
          setUser(updatedUser);
        }
      }

      // Submit the plan
      await submitWizard();

      // Update user's hasCompletedSetup locally (server already updated it)
      if (user) {
        setUser({ ...user, hasCompletedSetup: true });
      }

      // Navigate to dashboard
      navigate("/");
    } catch (err) {
      console.error("Failed to create plan:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Review Your Plan</h2>
        <p className="text-muted-foreground mt-2">
          Review your plan details and set your water target
        </p>
      </div>

      {/* Daily Targets */}
      <GlowCard className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Daily Targets (Auto-calculated from meals)
        </h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{targets.calories}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-500">{targets.protein}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-500">{targets.carbs}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-500">{targets.fat}g</p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
        </div>
      </GlowCard>

      {/* Water Target */}
      <GlowCard className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          Water Target
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="waterTarget">Daily water intake goal</Label>
            <div className="relative mt-1">
              <Input
                id="waterTarget"
                type="number"
                min={1}
                max={10}
                step={0.5}
                value={wizardWaterTarget}
                onChange={(e) => setWizardWaterTarget(Number(e.target.value))}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                liters
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {[2, 2.5, 3, 3.5, 4].map((val) => (
              <Button
                key={val}
                variant={wizardWaterTarget === val ? "default" : "outline"}
                size="sm"
                onClick={() => setWizardWaterTarget(val)}
              >
                {val}L
              </Button>
            ))}
          </div>
        </div>
      </GlowCard>

      {/* Diet Summary */}
      <GlowCard className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-green-500" />
          Diet Plan ({wizardMeals.length} meals)
        </h3>
        <div className="space-y-2">
          {wizardMeals.map((meal, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
              <span className="font-medium">{meal.name}</span>
              <span className="text-sm text-muted-foreground">
                {meal.items.length} items |{" "}
                {meal.items.reduce((sum, item) => sum + item.calories, 0)} cal
              </span>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Workout Summary */}
      <GlowCard className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-purple-500" />
          Workout Days ({wizardDayTypes.length} day types)
        </h3>
        {wizardDayTypes.length > 0 ? (
          <div className="space-y-2">
            {wizardDayTypes.map((dayType) => (
              <div
                key={dayType.id}
                className="flex justify-between items-center p-2 bg-muted/50 rounded"
              >
                <span className="font-medium">{dayType.name}</span>
                <span className="text-sm text-muted-foreground">
                  {dayType.exercises.length} exercises
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workout days defined</p>
        )}
      </GlowCard>

      {/* Schedule Summary */}
      <GlowCard className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Weekly Schedule ({workoutDaysCount} workout days, {7 - workoutDaysCount} rest days)
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const workout = getWorkoutForDay(day);
            const isRest = !workout;

            return (
              <div
                key={day}
                className={cn(
                  "p-2 rounded-lg text-center",
                  isRest ? "bg-blue-500/10" : "bg-primary/10"
                )}
              >
                <p className="text-xs font-medium mb-1">{DAY_LABELS[day].slice(0, 3)}</p>
                {isRest ? (
                  <Moon className="w-4 h-4 mx-auto text-blue-400" />
                ) : (
                  <Dumbbell className="w-4 h-4 mx-auto text-primary" />
                )}
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {workout?.name || "Rest"}
                </p>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting || isLoading} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Plan...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Create Plan
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
