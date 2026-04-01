import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Plus,
  Droplets,
  X,
  SkipForward,
  Clock,
  Utensils,
  Flame,
  Target,
  TrendingUp,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react";
import { GlowCard } from "@/components/GlowCard";
import { ProgressBar } from "@/components/ProgressBar";
import { ProgressRing } from "@/components/ProgressRing";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/common";
import { useDietStore, usePlanStore } from "@/store";
import { toast } from "sonner";
import { MealStatus, ExtraFoodItem, PlannedMealLog } from "@/types";
import { Link } from "react-router-dom";

// Meal icon mapping
const getMealIcon = (mealName: string) => {
  const name = mealName.toLowerCase();
  if (name.includes("breakfast")) return Coffee;
  if (name.includes("lunch")) return Sun;
  if (name.includes("dinner")) return Moon;
  if (name.includes("snack")) return Cookie;
  return Utensils;
};

export default function DietTracker() {
  const {
    todayLog,
    fetchTodayLog,
    updateMealStatus,
    addExtraItem,
    removeExtraItem,
    updateWaterIntake,
    getConsumedTotals,
    isLoading,
  } = useDietStore();

  const { todayPlan, fetchTodayPlan, isLoading: planLoading } = usePlanStore();

  const [localWater, setLocalWater] = useState(0);
  const [showAddExtraModal, setShowAddExtraModal] = useState(false);
  const [extraItemForm, setExtraItemForm] = useState<ExtraFoodItem>({
    name: "",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealContext: "",
  });

  useEffect(() => {
    fetchTodayLog();
    fetchTodayPlan();
  }, []);

  useEffect(() => {
    if (todayLog) {
      setLocalWater(todayLog.waterIntake);
    }
  }, [todayLog]);

  // Get targets from plan
  const targets = todayPlan?.targets || {
    calories: 2200,
    protein: 140,
    carbs: 250,
    fat: 70,
    water: 3,
  };

  // Calculate consumed totals
  const consumed = getConsumedTotals();

  // Calculate planned totals from plan
  const plannedTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const meals = todayPlan?.meals || [];
    for (const meal of meals) {
      for (const item of meal.items) {
        totals.calories += item.calories;
        totals.protein += item.protein;
        totals.carbs += item.carbs;
        totals.fat += item.fat;
      }
    }
    return totals;
  }, [todayPlan?.meals]);

  // Get meals to display - from log if exists, otherwise from plan
  const displayMeals: PlannedMealLog[] = useMemo(() => {
    if (todayLog?.plannedMeals && todayLog.plannedMeals.length > 0) {
      return todayLog.plannedMeals;
    }
    // Fallback to plan meals with pending status
    if (todayPlan?.meals) {
      return todayPlan.meals.map((meal) => ({
        mealName: meal.name,
        status: "pending" as MealStatus,
        items: meal.items,
      }));
    }
    return [];
  }, [todayLog?.plannedMeals, todayPlan?.meals]);

  // Calculate meal completion stats
  const mealStats = useMemo(() => {
    const total = displayMeals.length;
    const eaten = displayMeals.filter((m) => m.status === "eaten").length;
    const skipped = displayMeals.filter((m) => m.status === "skipped").length;
    const pending = displayMeals.filter((m) => m.status === "pending").length;
    return { total, eaten, skipped, pending };
  }, [displayMeals]);

  // Calculate remaining calories/protein
  const remaining = {
    calories: Math.max(0, targets.calories - consumed.calories),
    protein: Math.max(0, targets.protein - consumed.protein),
  };

  // Status colors
  const calorieProgress = (consumed.calories / targets.calories) * 100;
  const calorieStatusColor =
    calorieProgress > 110
      ? "text-neon-red"
      : calorieProgress > 90
      ? "text-neon-yellow"
      : "text-neon-green";

  const proteinProgress = (consumed.protein / targets.protein) * 100;
  const proteinStatusColor =
    proteinProgress >= 85
      ? "text-neon-green"
      : proteinProgress >= 65
      ? "text-neon-yellow"
      : "text-neon-red";

  const handleMealStatusChange = async (index: number, status: MealStatus) => {
    console.log("[DietTracker] handleMealStatusChange called:", { index, status });
    try {
      await updateMealStatus(index, status);
      toast.success(
        status === "eaten"
          ? "Meal marked as eaten!"
          : status === "skipped"
          ? "Meal skipped"
          : "Meal status reset"
      );
    } catch (error) {
      console.error("[DietTracker] Failed to update meal status:", error);
      toast.error("Failed to update meal status");
    }
  };

  const handleWaterChange = async (delta: number) => {
    const newValue = Math.max(0, Math.min(localWater + delta, 10));
    setLocalWater(newValue);
    await updateWaterIntake(newValue);
  };

  const handleAddExtraItem = async () => {
    if (!extraItemForm.name.trim()) {
      toast.error("Please enter a name for the item");
      return;
    }
    await addExtraItem(extraItemForm);
    toast.success("Extra item added!");
    setShowAddExtraModal(false);
    setExtraItemForm({
      name: "",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealContext: "",
    });
  };

  const handleRemoveExtraItem = async (index: number) => {
    await removeExtraItem(index);
    toast.success("Extra item removed");
  };

  const getMealGlowColor = (status: MealStatus) => {
    switch (status) {
      case "eaten":
        return "green";
      case "skipped":
        return "yellow";
      default:
        return "purple";
    }
  };

  const getMealStatusBadge = (status: MealStatus) => {
    switch (status) {
      case "eaten":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green">
            <Check className="w-3 h-3" /> Done
          </span>
        );
      case "skipped":
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neon-yellow/20 text-neon-yellow">
            <SkipForward className="w-3 h-3" /> Skipped
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  if ((isLoading || planLoading) && !todayLog && !todayPlan) {
    return <LoadingSkeleton type="page" />;
  }

  // No plan scenario
  if (!todayPlan || todayPlan.meals.length === 0) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Diet Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your daily nutrition
          </p>
        </motion.div>

        <GlowCard glowColor="purple" className="mt-8">
          <div className="text-center py-8">
            <Utensils className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Diet Plan Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a plan to start tracking your meals and nutrition.
            </p>
            <Link to="/plan/setup">
              <Button variant="neon">Create Your Plan</Button>
            </Link>
          </div>
        </GlowCard>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Diet Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mealStats.eaten}/{mealStats.total} meals completed today
        </p>
      </motion.div>

      {/* Daily Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Calories Ring */}
        <GlowCard glowColor="purple" delay={0.1}>
          <div className="flex flex-col items-center gap-2">
            <ProgressRing
              value={consumed.calories}
              max={targets.calories}
              color="hsl(270 80% 60%)"
              sublabel={`/ ${targets.calories}`}
            />
            <span className="text-sm font-medium text-muted-foreground">
              Calories
            </span>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className={calorieStatusColor}>
                {remaining.calories > 0
                  ? `${remaining.calories} remaining`
                  : `${Math.abs(remaining.calories)} over`}
              </span>
            </div>
          </div>
        </GlowCard>

        {/* Macros */}
        <GlowCard glowColor="red" delay={0.2}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-neon-red" />
              <span className="text-sm font-medium text-foreground">Macros</span>
            </div>
            <ProgressBar
              value={consumed.protein}
              max={targets.protein}
              color="bg-neon-red"
              label="Protein (g)"
            />
            <ProgressBar
              value={consumed.carbs}
              max={targets.carbs}
              color="bg-neon-purple"
              label="Carbs (g)"
            />
            <ProgressBar
              value={consumed.fat}
              max={targets.fat}
              color="bg-neon-blue"
              label="Fat (g)"
            />
            <div className="pt-1 text-xs text-muted-foreground">
              <span className={proteinStatusColor}>
                {consumed.protein}g / {targets.protein}g protein
              </span>
            </div>
          </div>
        </GlowCard>

        {/* Water Intake */}
        <GlowCard glowColor="blue" delay={0.3}>
          <div className="flex flex-col items-center gap-3">
            <Droplets className="w-8 h-8 text-neon-blue" />
            <div className="text-center">
              <span className="text-3xl font-display font-bold text-foreground">
                {localWater.toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground ml-1">
                / {targets.water}L
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Water Intake</span>
            <div className="flex items-center gap-3 mt-1">
              <Button
                variant="glass"
                size="sm"
                onClick={() => handleWaterChange(-0.25)}
                disabled={localWater <= 0}
              >
                -0.25L
              </Button>
              <Button
                variant="neon"
                size="sm"
                onClick={() => handleWaterChange(0.25)}
                disabled={localWater >= 10}
              >
                +0.25L
              </Button>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Planned Meals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-foreground">
            Planned Meals
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neon-green" />
              {mealStats.eaten} eaten
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-neon-yellow" />
              {mealStats.skipped} skipped
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              {mealStats.pending} pending
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {displayMeals.map((meal, idx) => {
            const mealCalories = meal.items.reduce(
              (sum, i) => sum + i.calories,
              0
            );
            const mealProtein = meal.items.reduce(
              (sum, i) => sum + i.protein,
              0
            );
            const MealIcon = getMealIcon(meal.mealName);

            return (
              <motion.div
                key={`${meal.mealName}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <GlowCard
                  glowColor={getMealGlowColor(meal.status)}
                  className={meal.status === "eaten" ? "border-neon-green/20" : ""}
                >
                  {/* Meal Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          meal.status === "eaten"
                            ? "bg-neon-green/20"
                            : meal.status === "skipped"
                            ? "bg-neon-yellow/20"
                            : "bg-secondary/60"
                        }`}
                      >
                        <MealIcon
                          className={`w-5 h-5 ${
                            meal.status === "eaten"
                              ? "text-neon-green"
                              : meal.status === "skipped"
                              ? "text-neon-yellow"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground">
                          {meal.mealName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3" />
                            {mealCalories} cal
                          </span>
                          <span>·</span>
                          <span className="text-neon-red">
                            {mealProtein}g protein
                          </span>
                        </div>
                      </div>
                    </div>
                    {getMealStatusBadge(meal.status)}
                  </div>

                  {/* Food Items */}
                  <div className="space-y-2 mb-4">
                    {meal.items.map((item, itemIdx) => (
                      <div
                        key={`${item.name}-${itemIdx}`}
                        className={`flex items-center justify-between p-2.5 rounded-xl bg-secondary/40 ${
                          meal.status === "skipped" ? "opacity-50" : ""
                        }`}
                      >
                        <span className="text-sm text-foreground">
                          {item.name}
                        </span>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{item.calories} cal</span>
                          <span className="text-neon-red">{item.protein}g P</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {meal.status !== "eaten" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMealStatusChange(idx, "eaten")}
                        disabled={isLoading}
                        className="flex-1 bg-neon-green/20 text-neon-green border-neon-green/30 hover:bg-neon-green/30"
                      >
                        <Check className="w-4 h-4 mr-1" /> Mark as Done
                      </Button>
                    )}
                    {meal.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMealStatusChange(idx, "skipped")}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        <SkipForward className="w-4 h-4 mr-1" /> Skip
                      </Button>
                    )}
                    {meal.status !== "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMealStatusChange(idx, "pending")}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Extra Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-semibold text-foreground">
              Extra Items
            </h2>
            <p className="text-xs text-muted-foreground">
              Track food not in your plan
            </p>
          </div>
          <Button
            variant="neon"
            size="sm"
            onClick={() => setShowAddExtraModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Item
          </Button>
        </div>

        {todayLog?.extraItems && todayLog.extraItems.length > 0 ? (
          <GlowCard glowColor="cyan">
            <div className="space-y-2">
              {todayLog.extraItems.map((item, idx) => (
                <div
                  key={`extra-${idx}`}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/40"
                >
                  <div>
                    <span className="text-sm text-foreground">{item.name}</span>
                    {item.mealContext && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({item.mealContext})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{item.calories} cal</span>
                      <span className="text-neon-red">{item.protein}g P</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveExtraItem(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Extra items total:</span>
              <span className="text-foreground font-medium">
                {todayLog.extraItems.reduce((sum, i) => sum + i.calories, 0)} cal
                <span className="text-neon-red ml-2">
                  {todayLog.extraItems.reduce((sum, i) => sum + i.protein, 0)}g P
                </span>
              </span>
            </div>
          </GlowCard>
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No extra items logged today</p>
            <p className="text-xs mt-1">
              Had a snack or drink not in your plan? Track it here.
            </p>
          </div>
        )}
      </div>

      {/* Add Extra Item Modal */}
      <AnimatePresence>
        {showAddExtraModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddExtraModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-display font-semibold mb-4">
                Add Extra Food Item
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Name *</label>
                  <input
                    type="text"
                    value={extraItemForm.name}
                    onChange={(e) =>
                      setExtraItemForm({ ...extraItemForm, name: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:border-neon-purple focus:outline-none"
                    placeholder="e.g., Apple, Protein Bar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Calories
                    </label>
                    <input
                      type="number"
                      value={extraItemForm.calories}
                      onChange={(e) =>
                        setExtraItemForm({
                          ...extraItemForm,
                          calories: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:border-neon-purple focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      value={extraItemForm.protein}
                      onChange={(e) =>
                        setExtraItemForm({
                          ...extraItemForm,
                          protein: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:border-neon-purple focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      value={extraItemForm.carbs}
                      onChange={(e) =>
                        setExtraItemForm({
                          ...extraItemForm,
                          carbs: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:border-neon-purple focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Fat (g)</label>
                    <input
                      type="number"
                      value={extraItemForm.fat}
                      onChange={(e) =>
                        setExtraItemForm({
                          ...extraItemForm,
                          fat: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:border-neon-purple focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Context (optional)
                  </label>
                  <input
                    type="text"
                    value={extraItemForm.mealContext || ""}
                    onChange={(e) =>
                      setExtraItemForm({
                        ...extraItemForm,
                        mealContext: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-secondary rounded-lg border border-border focus:border-neon-purple focus:outline-none"
                    placeholder="e.g., with lunch, snack, post-workout"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="glass"
                  className="flex-1"
                  onClick={() => setShowAddExtraModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="neon"
                  className="flex-1"
                  onClick={handleAddExtraItem}
                  disabled={isLoading}
                >
                  Add Item
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
