import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
	Droplets,
	Dumbbell,
	UtensilsCrossed,
	Zap,
	Plus,
	Minus,
	Play,
	ChefHat,
	ArrowRight,
	Sparkles,
	Scale,
} from "lucide-react";
import { GlowCard } from "@/components/GlowCard";
import { ProgressRing } from "@/components/ProgressRing";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/common";
import { useAuthStore, usePlanStore, useDietStore, useWorkoutStore, useProgressStore } from "@/store";
import { DAY_LABELS, WeeklySchedule, PlanTargets } from "@/types";
import { MyPlanSection } from "@/features/dashboard";

export default function Dashboard() {
  const { user } = useAuthStore();
  const {
    todayPlan,
    plan,
    fetchTodayPlan,
    fetchPlan,
    isLoading: planLoading,
    error,
  } = usePlanStore();
  const {
    todayLog,
    fetchTodayLog,
    getConsumedTotals,
    updateWaterIntake,
  } = useDietStore();
  const {
    todayLog: workoutLog,
    fetchTodayLog: fetchWorkoutLog,
    getCompletionStats,
  } = useWorkoutStore();

	const { summary: progressSummary, fetchProgressSummary } = useProgressStore();

  useEffect(() => {
    fetchTodayPlan();
    fetchPlan();
    fetchTodayLog();
    fetchWorkoutLog();
    fetchProgressSummary();
  }, []);

  // Planned targets from today's plan (source of truth)
  const plannedTargets: PlanTargets = todayPlan?.targets || {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 60,
    water: 3,
  };

  // Get actual consumed values from diet store
  const consumedTotals = getConsumedTotals();
  const waterIntake = todayLog?.waterIntake || 0;

  // Get workout completion stats
  const workoutStats = getCompletionStats();

  // Calculate meal completion with statuses
  const mealStatuses = todayLog?.plannedMeals.map((m) => ({
    mealName: m.mealName,
    status: m.status,
    items: m.items,
  }));

  // Calculate quick stats for action buttons
  const mealsCompleted = todayLog?.plannedMeals.filter((m) => m.status === "eaten").length || 0;
  const totalMeals = todayLog?.plannedMeals.length || todayPlan?.meals?.length || 0;
  const workoutCompleted = workoutStats.completed === workoutStats.total && workoutStats.total > 0;

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Water intake handlers
  const handleAddWater = () => {
    if (todayLog) {
      updateWaterIntake(Math.min(waterIntake + 0.25, plannedTargets.water * 2));
    }
  };

  const handleRemoveWater = () => {
    if (todayLog && waterIntake > 0) {
      updateWaterIntake(Math.max(waterIntake - 0.25, 0));
    }
  };

  if (planLoading) {
    return <LoadingSkeleton type="page" />;
  }

  if (!todayPlan) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{dateStr}</p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0] || "Warrior"}
          </h1>
        </div>
        <GlowCard>
          <div className="p-6 text-center space-y-3">
            <p className="text-lg font-medium">No plan found for today</p>
            <p className="text-sm text-muted-foreground">
              {error || "Head to plan setup to create or update your plan."}
            </p>
            <Button asChild variant="neon" className="mt-2">
              <Link to="/plan/setup">Open Plan Setup</Link>
            </Button>
          </div>
        </GlowCard>
      </div>
    );
  }

  const dayLabel = DAY_LABELS[todayPlan.dayOfWeek as keyof WeeklySchedule];

  // Calculate calorie progress percentage
  const calorieProgress =
    plannedTargets.calories > 0
      ? Math.round((consumedTotals.calories / plannedTargets.calories) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <p className="text-sm text-muted-foreground">
          {dateStr}
          <span className="mx-1">·</span>
          <span className="font-medium">{dayLabel}</span>
        </p>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Welcome back,{" "}
          <span className="text-glow-purple text-neon-purple">
            {user?.name?.split(" ")[0] || "Warrior"}
          </span>
        </h1>
      </motion.div>

      {/* QUICK ACTIONS - TOP PRIORITY */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlowCard glowColor="purple" className="overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-neon-purple" />
            <h3 className="font-display font-semibold text-foreground">
              Quick Actions
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Log Meal Button */}
            <Link to="/diet" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  mealsCompleted === totalMeals && totalMeals > 0
                    ? "bg-neon-green/10 border-neon-green/30"
                    : "bg-gradient-to-br from-neon-purple/10 to-neon-purple/5 border-neon-purple/30 hover:border-neon-purple/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      mealsCompleted === totalMeals && totalMeals > 0
                        ? "bg-neon-green/20"
                        : "bg-neon-purple/20"
                    }`}
                  >
                    <ChefHat
                      className={`w-7 h-7 ${
                        mealsCompleted === totalMeals && totalMeals > 0
                          ? "text-neon-green"
                          : "text-neon-purple"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-lg">
                      Log Meal
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {mealsCompleted === totalMeals && totalMeals > 0
                        ? "All meals logged!"
                        : `${mealsCompleted}/${totalMeals} meals logged`}
                    </p>
                  </div>
                  <ArrowRight
                    className={`w-5 h-5 ${
                      mealsCompleted === totalMeals && totalMeals > 0
                        ? "text-neon-green"
                        : "text-neon-purple"
                    }`}
                  />
                </div>

                {/* Progress indicator */}
                {totalMeals > 0 && (
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: totalMeals }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < mealsCompleted
                            ? mealsCompleted === totalMeals
                              ? "bg-neon-green"
                              : "bg-neon-purple"
                            : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </Link>

            {/* Start Workout Button */}
            <Link to="/workout" className="block">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  todayPlan.isRestDay
                    ? "bg-secondary/50 border-border"
                    : workoutCompleted
                    ? "bg-neon-green/10 border-neon-green/30"
                    : "bg-gradient-to-br from-neon-blue/10 to-neon-blue/5 border-neon-blue/30 hover:border-neon-blue/50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                      todayPlan.isRestDay
                        ? "bg-secondary"
                        : workoutCompleted
                        ? "bg-neon-green/20"
                        : "bg-neon-blue/20"
                    }`}
                  >
                    {todayPlan.isRestDay ? (
                      <Sparkles className="w-7 h-7 text-muted-foreground" />
                    ) : workoutCompleted ? (
                      <Dumbbell className="w-7 h-7 text-neon-green" />
                    ) : (
                      <Play className="w-7 h-7 text-neon-blue" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground text-lg">
                      {todayPlan.isRestDay
                        ? "Rest Day"
                        : workoutCompleted
                        ? "Workout Done!"
                        : "Start Workout"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {todayPlan.isRestDay
                        ? "Recovery time"
                        : workoutStats.total > 0
                        ? `${workoutStats.completed}/${workoutStats.total} exercises`
                        : todayPlan.workout?.name || "Today's session"}
                    </p>
                  </div>
                  <ArrowRight
                    className={`w-5 h-5 ${
                      todayPlan.isRestDay
                        ? "text-muted-foreground"
                        : workoutCompleted
                        ? "text-neon-green"
                        : "text-neon-blue"
                    }`}
                  />
                </div>

                {/* Progress indicator for workout */}
                {!todayPlan.isRestDay && workoutStats.total > 0 && (
                  <div className="mt-3 flex gap-1">
                    {Array.from({ length: workoutStats.total }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < workoutStats.completed
                            ? workoutCompleted
                              ? "bg-neon-green"
                              : "bg-neon-blue"
                            : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </Link>
          </div>

          {/* Quick water tracker */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-neon-blue" />
                <span className="text-sm text-muted-foreground">
                  Water: {waterIntake.toFixed(1)}L / {plannedTargets.water}L
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-neon-blue/10"
                  onClick={handleRemoveWater}
                  disabled={waterIntake <= 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.ceil(plannedTargets.water * 4) }).map(
                    (_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-4 rounded-full transition-all ${
                          i < Math.floor(waterIntake * 4)
                            ? "bg-neon-blue"
                            : "bg-secondary"
                        }`}
                      />
                    )
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-neon-blue/10"
                  onClick={handleAddWater}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* My Plan Section */}
      <MyPlanSection
        todayPlan={todayPlan}
        plan={plan}
        workoutStats={workoutStats}
        mealStatuses={mealStatuses}
        consumedCalories={consumedTotals.calories}
      />

      {/* Progress Tracking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-lg font-display font-semibold text-foreground mb-4">
          Today's Progress
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Calorie Progress */}
          <GlowCard glowColor="purple" delay={0.1}>
            <div className="flex flex-col items-center gap-3">
              <ProgressRing
                value={consumedTotals.calories}
                max={plannedTargets.calories}
                color="hsl(270 80% 60%)"
                sublabel={`/ ${plannedTargets.calories}`}
              />
              <span className="text-sm font-medium text-muted-foreground">
                Calories
              </span>
              {calorieProgress > 0 && (
                <span
                  className={`text-xs ${
                    calorieProgress > 100
                      ? "text-neon-red"
                      : calorieProgress > 80
                      ? "text-neon-yellow"
                      : "text-neon-green"
                  }`}
                >
                  {calorieProgress}% of daily goal
                </span>
              )}
            </div>
          </GlowCard>

          {/* Macros */}
          <GlowCard glowColor="red" delay={0.2}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-red" />
                <span className="text-sm font-medium text-foreground">Macros</span>
              </div>
              <ProgressBar
                value={consumedTotals.protein}
                max={plannedTargets.protein}
                color="bg-neon-red"
                label="Protein (g)"
              />
              <ProgressBar
                value={consumedTotals.carbs}
                max={plannedTargets.carbs}
                color="bg-neon-purple"
                label="Carbs (g)"
              />
              <ProgressBar
                value={consumedTotals.fat}
                max={plannedTargets.fat}
                color="bg-neon-blue"
                label="Fat (g)"
              />
            </div>
          </GlowCard>

          {/* Water Intake - Interactive */}
	      <GlowCard glowColor="blue" delay={0.3} className="sm:col-span-2 lg:col-span-1">
            <div className="flex flex-col items-center gap-4">
              <Droplets className="w-8 h-8 text-neon-blue" />
              <div className="text-center">
                <span className="text-3xl font-display font-bold text-foreground">
                  {waterIntake.toFixed(1)}
                </span>
                <span className="text-lg text-muted-foreground ml-1">
                  / {plannedTargets.water}L
                </span>
              </div>
              <span className="text-sm text-muted-foreground">Water Intake</span>

              {/* Interactive water controls */}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-secondary hover:bg-neon-blue/20"
                  onClick={handleRemoveWater}
                  disabled={waterIntake <= 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex gap-1">
                  {Array.from({
                    length: Math.ceil(plannedTargets.water * 4),
                  }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-6 rounded-full transition-all ${
                        i < Math.floor(waterIntake * 4)
                          ? "bg-neon-blue"
                          : "bg-secondary"
                      }`}
                      style={
                        i < Math.floor(waterIntake * 4)
                          ? { boxShadow: "0 0 8px hsl(210 100% 60% / 0.3)" }
                          : {}
                      }
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-secondary hover:bg-neon-blue/20"
                  onClick={handleAddWater}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                Tap +/- to log (0.25L)
              </span>
            </div>
	          </GlowCard>

	          {/* Weight Summary - from backend progress summary */}
	          <GlowCard
	            glowColor={
	              progressSummary
	                ? progressSummary.changeFromStart < 0
	                  ? "green"
	                  : progressSummary.changeFromStart > 0
	                  ? "red"
	                  : "purple"
	                : "purple"
	            }
	            delay={0.4}
	          >
	            <div className="flex flex-col items-center gap-3">
	              <Scale className="w-8 h-8 text-neon-purple" />
	              <div className="text-center">
	                <span className="text-xs text-muted-foreground block mb-1">
	                  Current Weight
	                </span>
	                <span className="text-3xl font-display font-bold text-foreground">
	                  {progressSummary && progressSummary.currentWeight > 0
	                    ? `${progressSummary.currentWeight.toFixed(1)} kg`
	                    : "—"}
	                </span>
	              </div>
	              {progressSummary && (
	                <p className="text-xs text-muted-foreground mt-1">
	                  {progressSummary.changeFromStart !== 0
	                    ? `Since start: ${
	                        progressSummary.changeFromStart > 0 ? "+" : ""
	                      }${progressSummary.changeFromStart.toFixed(1)} kg`
	                    : "No change from starting weight yet"}
	                </p>
	              )}
	            </div>
	          </GlowCard>
        </div>
      </motion.div>

      {/* Motivation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-center"
      >
        <div className="absolute inset-0 gradient-purple-red opacity-10 animate-pulse-glow" />
        <div className="relative z-10">
          <p className="text-xl sm:text-2xl font-display font-bold text-foreground text-glow-purple">
            "Consistency beats perfection."
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Keep pushing forward
          </p>
        </div>
      </motion.div>
    </div>
  );
}
