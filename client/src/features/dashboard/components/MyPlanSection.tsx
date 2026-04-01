import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Target,
  Calendar,
  Settings2,
  Sparkles,
  TrendingUp,
  Eye,
} from "lucide-react";
import { GlowCard } from "@/components/GlowCard";
import { Button } from "@/components/ui/button";
import { TodayPlan, Plan, WeeklySchedule, DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import { WeeklyScheduleBar } from "./WeeklyScheduleBar";
import { TodayWorkoutCard } from "./TodayWorkoutCard";
import { TodayMealsCard } from "./TodayMealsCard";

interface MealStatus {
  mealName: string;
  status: "eaten" | "skipped" | "pending";
  items: { name: string; calories: number; protein: number; carbs: number; fat: number }[];
}

interface MyPlanSectionProps {
  todayPlan: TodayPlan;
  plan?: Plan | null;
  workoutStats: {
    completed: number;
    total: number;
  };
  mealStatuses?: MealStatus[];
  consumedCalories: number;
}

export function MyPlanSection({
  todayPlan,
  plan,
  workoutStats,
  mealStatuses,
  consumedCalories,
}: MyPlanSectionProps) {
  const dayLabel = DAY_LABELS[todayPlan.dayOfWeek as keyof WeeklySchedule];

  // Calculate total planned calories from meals
  const totalPlannedCalories = todayPlan.meals.reduce(
    (sum, meal) => sum + meal.items.reduce((mealSum, item) => mealSum + item.calories, 0),
    0
  );

  // Get workout day types from plan for schedule display
  const dayTypes = plan?.workout.dayTypes || [];
  const schedule = plan?.workout.weeklySchedule || {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  };

  // Count workout days and rest days
  const workoutDaysCount = DAYS_OF_WEEK.filter((day) => schedule[day] !== null).length;
  const restDaysCount = 7 - workoutDaysCount;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-neon-purple" />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">My Plan</h2>
            <p className="text-xs text-muted-foreground">
              {dayLabel} · {workoutDaysCount} workout days, {restDaysCount} rest days
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/plan">
              <Eye className="w-4 h-4 mr-1" />
              View
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/plan/setup">
              <Settings2 className="w-4 h-4 mr-1" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Weekly Schedule Overview */}
      <GlowCard glowColor="purple" delay={0.1} className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-neon-purple" />
          <span className="text-sm font-medium text-foreground">This Week</span>
        </div>
        <WeeklyScheduleBar
          schedule={schedule}
          dayTypes={dayTypes}
          currentDay={todayPlan.dayOfWeek}
        />
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-neon-purple/20" />
            <span>Workout</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-secondary/50" />
            <span>Rest</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded ring-2 ring-neon-purple ring-offset-1 ring-offset-background" />
            <span>Today</span>
          </div>
        </div>
      </GlowCard>

      {/* Today's Workout & Meals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <span className="text-sm font-medium text-foreground">Today's Workout</span>
          </div>
          <TodayWorkoutCard
            workout={todayPlan.workout}
            isRestDay={todayPlan.isRestDay}
            completedExercises={workoutStats.completed}
            totalExercises={workoutStats.total}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-neon-green" />
            <span className="text-sm font-medium text-foreground">Today's Diet</span>
          </div>
          <TodayMealsCard
            meals={todayPlan.meals}
            mealStatuses={mealStatuses}
            totalCalories={totalPlannedCalories}
            consumedCalories={consumedCalories}
          />
        </div>
      </div>

      {/* Plan Targets Summary */}
      <GlowCard glowColor="blue" delay={0.3} className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-neon-blue" />
          <span className="text-sm font-medium text-foreground">Daily Targets</span>
        </div>
        <div className="grid grid-cols-5 gap-2 text-center">
          <TargetItem
            label="Calories"
            value={todayPlan.targets.calories}
            unit="kcal"
            color="purple"
          />
          <TargetItem
            label="Protein"
            value={todayPlan.targets.protein}
            unit="g"
            color="red"
          />
          <TargetItem
            label="Carbs"
            value={todayPlan.targets.carbs}
            unit="g"
            color="purple"
          />
          <TargetItem
            label="Fat"
            value={todayPlan.targets.fat}
            unit="g"
            color="blue"
          />
          <TargetItem
            label="Water"
            value={todayPlan.targets.water}
            unit="L"
            color="blue"
          />
        </div>
      </GlowCard>
    </motion.section>
  );
}

function TargetItem({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: "purple" | "red" | "blue" | "green";
}) {
  const colorMap = {
    purple: "text-neon-purple",
    red: "text-neon-red",
    blue: "text-neon-blue",
    green: "text-neon-green",
  };

  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg font-bold ${colorMap[color]}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase">{unit}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
