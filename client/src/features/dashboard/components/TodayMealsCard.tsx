import { motion } from "framer-motion";
import { UtensilsCrossed, Check, X, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlanMeal, FoodItem } from "@/types";

interface MealStatus {
  mealName: string;
  status: "eaten" | "skipped" | "pending";
  items: FoodItem[];
}

interface TodayMealsCardProps {
  meals: PlanMeal[];
  mealStatuses?: MealStatus[];
  totalCalories: number;
  consumedCalories: number;
}

export function TodayMealsCard({
  meals,
  mealStatuses,
  totalCalories,
  consumedCalories,
}: TodayMealsCardProps) {
  const getMealStatus = (mealName: string): "eaten" | "skipped" | "pending" => {
    if (!mealStatuses) return "pending";
    const status = mealStatuses.find((s) => s.mealName === mealName);
    return status?.status || "pending";
  };

  const eatenCount = mealStatuses?.filter((m) => m.status === "eaten").length || 0;
  const totalMeals = meals.length;
  const progress = totalMeals > 0 ? (eatenCount / totalMeals) * 100 : 0;

  const getMealCalories = (meal: PlanMeal): number => {
    return meal.items.reduce((sum, item) => sum + item.calories, 0);
  };

  return (
    <Link to="/diet" className="block group">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
          "hover:border-neon-green/40 hover:shadow-lg hover:shadow-neon-green/10",
          eatenCount === totalMeals && totalMeals > 0
            ? "bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30"
            : eatenCount > 0
            ? "bg-gradient-to-br from-neon-yellow/10 to-transparent border-neon-yellow/30"
            : "bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/20"
        )}
      >
        {/* Progress bar background */}
        {progress > 0 && (
          <div
            className="absolute inset-0 bg-neon-green/5 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  eatenCount === totalMeals && totalMeals > 0
                    ? "bg-neon-green/20"
                    : "bg-neon-green/20"
                )}
              >
                <UtensilsCrossed className="w-6 h-6 text-neon-green" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Today's Meals</h4>
                <p className="text-sm text-muted-foreground">
                  {totalCalories} kcal planned
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-green transition-colors" />
          </div>

          {/* Meals list */}
          <div className="space-y-1.5">
            {meals.slice(0, 4).map((meal, idx) => {
              const status = getMealStatus(meal.name);
              const mealCalories = getMealCalories(meal);

              return (
                <MealPreviewItem
                  key={idx}
                  name={meal.name}
                  time={meal.time}
                  calories={mealCalories}
                  itemCount={meal.items.length}
                  status={status}
                />
              );
            })}
            {meals.length > 4 && (
              <p className="text-xs text-muted-foreground pl-6">
                +{meals.length - 4} more meals
              </p>
            )}
          </div>

          {/* Status & calories */}
          <div className="mt-3 flex items-center justify-between">
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1",
                eatenCount === totalMeals && totalMeals > 0
                  ? "bg-neon-green/10 text-neon-green"
                  : eatenCount > 0
                  ? "bg-neon-yellow/10 text-neon-yellow"
                  : "bg-neon-green/10 text-neon-green"
              )}
            >
              {eatenCount === totalMeals && totalMeals > 0 ? (
                <>
                  <Check className="w-3 h-3" /> All meals logged
                </>
              ) : eatenCount > 0 ? (
                <>
                  <Clock className="w-3 h-3" /> {eatenCount}/{totalMeals} logged
                </>
              ) : (
                `${totalMeals} meals planned`
              )}
            </span>
            {consumedCalories > 0 && (
              <span className="text-xs text-muted-foreground">
                {consumedCalories} / {totalCalories} kcal
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function MealPreviewItem({
  name,
  time,
  calories,
  itemCount,
  status,
}: {
  name: string;
  time?: string;
  calories: number;
  itemCount: number;
  status: "eaten" | "skipped" | "pending";
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={cn(
          "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
          status === "eaten"
            ? "bg-neon-green/20 text-neon-green"
            : status === "skipped"
            ? "bg-neon-red/20 text-neon-red"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {status === "eaten" ? (
          <Check className="w-2.5 h-2.5" />
        ) : status === "skipped" ? (
          <X className="w-2.5 h-2.5" />
        ) : (
          "•"
        )}
      </div>
      <span
        className={cn(
          "flex-1 truncate",
          status === "eaten" && "text-muted-foreground",
          status === "skipped" && "text-muted-foreground line-through"
        )}
      >
        {name}
        {time && <span className="text-muted-foreground ml-1">({time})</span>}
      </span>
      <span className="text-xs text-muted-foreground">
        {calories} kcal • {itemCount} items
      </span>
    </div>
  );
}
