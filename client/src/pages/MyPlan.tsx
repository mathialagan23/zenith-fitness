import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  Calendar,
  Dumbbell,
  UtensilsCrossed,
  Droplets,
  ArrowLeft,
  Edit,
  Zap,
  Clock,
} from "lucide-react";
import { GlowCard } from "@/components/GlowCard";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/common";
import { usePlanStore } from "@/store";
import { DAYS_OF_WEEK, DAY_LABELS, WeeklySchedule, PlanMeal, WorkoutDayType } from "@/types";

export default function MyPlan() {
  const { plan, fetchPlan, isLoading, error } = usePlanStore();

  useEffect(() => {
    fetchPlan();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton type="page" />;
  }

  if (!plan) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <GlowCard>
          <div className="p-6 text-center space-y-3">
            <p className="text-lg font-medium">No plan found</p>
            <p className="text-sm text-muted-foreground">
              {error || "Create a plan to get started with your fitness journey."}
            </p>
            <Button asChild variant="neon" className="mt-2">
              <Link to="/plan/setup">Create Plan</Link>
            </Button>
          </div>
        </GlowCard>
      </div>
    );
  }

  const { diet, workout, targets } = plan;
  const workoutDaysCount = DAYS_OF_WEEK.filter((day) => workout.weeklySchedule[day] !== null).length;
  const restDaysCount = 7 - workoutDaysCount;

  // Get day type by ID
  const getDayTypeById = (id: string | null): WorkoutDayType | null => {
    if (!id) return null;
    return workout.dayTypes.find((dt) => dt.id === id) || null;
  };

  // Calculate total daily calories from meals
  const calculateMealCalories = (meal: PlanMeal): number => {
    return meal.items.reduce((sum, item) => sum + item.calories, 0);
  };

  const totalDailyCalories = diet.meals.reduce(
    (sum, meal) => sum + calculateMealCalories(meal),
    0
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              My Fitness Plan
            </h1>
            <p className="text-sm text-muted-foreground">
              {workoutDaysCount} workout days, {restDaysCount} rest days
            </p>
          </div>
        </div>
        <Button variant="neon" asChild>
          <Link to="/plan/setup">
            <Edit className="w-4 h-4 mr-2" />
            Edit Plan
          </Link>
        </Button>
      </motion.div>

      {/* Daily Targets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlowCard glowColor="purple">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-neon-purple" />
            <h2 className="text-lg font-display font-semibold text-foreground">Daily Targets</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <TargetCard
              icon={<Zap className="w-5 h-5 text-neon-purple" />}
              label="Calories"
              value={targets.calories}
              unit="kcal"
            />
            <TargetCard
              icon={<div className="w-5 h-5 rounded-full bg-neon-red/30 flex items-center justify-center text-xs font-bold text-neon-red">P</div>}
              label="Protein"
              value={targets.protein}
              unit="g"
            />
            <TargetCard
              icon={<div className="w-5 h-5 rounded-full bg-neon-purple/30 flex items-center justify-center text-xs font-bold text-neon-purple">C</div>}
              label="Carbs"
              value={targets.carbs}
              unit="g"
            />
            <TargetCard
              icon={<div className="w-5 h-5 rounded-full bg-neon-blue/30 flex items-center justify-center text-xs font-bold text-neon-blue">F</div>}
              label="Fat"
              value={targets.fat}
              unit="g"
            />
            <TargetCard
              icon={<Droplets className="w-5 h-5 text-neon-blue" />}
              label="Water"
              value={targets.water}
              unit="L"
            />
          </div>
        </GlowCard>
      </motion.div>

      {/* Weekly Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlowCard glowColor="blue">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-neon-blue" />
            <h2 className="text-lg font-display font-semibold text-foreground">Weekly Schedule</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const dayType = getDayTypeById(workout.weeklySchedule[day]);
              const isRestDay = !dayType;

              return (
                <div
                  key={day}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isRestDay
                      ? "bg-secondary/50 border border-border/50"
                      : "bg-neon-purple/10 border border-neon-purple/30"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    {DAY_LABELS[day].slice(0, 3)}
                  </p>
                  <p className={`text-sm font-medium truncate ${isRestDay ? "text-muted-foreground" : "text-neon-purple"}`}>
                    {isRestDay ? "Rest" : dayType?.name}
                  </p>
                  {!isRestDay && dayType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {dayType.exercises.length} exercises
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </GlowCard>
      </motion.div>

      {/* Workout Day Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlowCard glowColor="purple">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-neon-purple" />
            <h2 className="text-lg font-display font-semibold text-foreground">Workout Types</h2>
          </div>
          {workout.dayTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workout types defined yet.</p>
          ) : (
            <div className="space-y-4">
              {workout.dayTypes.map((dayType) => (
                <div
                  key={dayType.id}
                  className="p-4 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{dayType.name}</h3>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      {dayType.exercises.length} exercises
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {dayType.exercises.map((exercise, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                      >
                        <span className="text-sm text-foreground">{exercise.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {exercise.targetSets}×{exercise.targetReps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlowCard>
      </motion.div>

      {/* Meal Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlowCard glowColor="green">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-neon-green" />
              <h2 className="text-lg font-display font-semibold text-foreground">Meal Plan</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalDailyCalories} kcal/day
            </span>
          </div>
          {diet.meals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meals defined yet.</p>
          ) : (
            <div className="space-y-4">
              {diet.meals.map((meal, idx) => {
                const mealCalories = calculateMealCalories(meal);
                const mealProtein = meal.items.reduce((sum, item) => sum + item.protein, 0);
                const mealCarbs = meal.items.reduce((sum, item) => sum + item.carbs, 0);
                const mealFat = meal.items.reduce((sum, item) => sum + item.fat, 0);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{meal.name}</h3>
                        {meal.time && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {meal.time}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-neon-purple font-medium">{mealCalories} kcal</span>
                        <span>P: {mealProtein}g</span>
                        <span>C: {mealCarbs}g</span>
                        <span>F: {mealFat}g</span>
                      </div>
                    </div>
                    {meal.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No items in this meal.</p>
                    ) : (
                      <div className="space-y-1">
                        {meal.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                          >
                            <span className="text-sm text-foreground">{item.name}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{item.calories} kcal</span>
                              <span className="text-neon-red">P: {item.protein}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </GlowCard>
      </motion.div>

      {/* Plan Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground"
      >
        <p>
          Plan created on{" "}
          {new Date(plan.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        {plan.updatedAt !== plan.createdAt && (
          <p>
            Last updated on{" "}
            {new Date(plan.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
      </motion.div>
    </div>
  );
}

function TargetCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/30">
      {icon}
      <span className="text-2xl font-bold text-foreground mt-2">{value}</span>
      <span className="text-xs text-muted-foreground">{unit}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
