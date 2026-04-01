import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Save,
  Dumbbell,
  Moon,
  TrendingUp,
  Info,
} from "lucide-react";
import { GlowCard } from "@/components/GlowCard";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/common";
import { useWorkoutStore, usePlanStore } from "@/store";
import { WorkoutLogExercise, WorkoutSet, parseRepRange, formatRepRange, PreviousBest } from "@/types";
import { ExerciseType } from "@/types/plan.types";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// Exercise type badge component
const ExerciseTypeBadge = ({ type }: { type?: ExerciseType }) => {
  if (!type) return null;

  const styles: Record<ExerciseType, { bg: string; text: string; label: string }> = {
    compound: { bg: "bg-neon-purple/20", text: "text-neon-purple", label: "Compound" },
    isolation: { bg: "bg-neon-blue/20", text: "text-neon-blue", label: "Isolation" },
    bodyweight: { bg: "bg-neon-green/20", text: "text-neon-green", label: "Bodyweight" },
  };

  const style = styles[type];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

// Previous best hint component
const PreviousBestHint = ({ previousBest }: { previousBest?: PreviousBest }) => {
  if (!previousBest) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-neon-green">
      <TrendingUp className="w-3 h-3" />
      <span>
        Last: {previousBest.weight}kg × {previousBest.reps}
      </span>
    </div>
  );
};

export default function WorkoutTracker() {
  const {
    todayLog,
    fetchTodayWorkout,
    fetchTodayLog,
    logWorkout,
    isLoading,
  } = useWorkoutStore();

  const { todayPlan, fetchTodayPlan } = usePlanStore();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [localExercises, setLocalExercises] = useState<WorkoutLogExercise[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchTodayWorkout();
    fetchTodayLog();
    fetchTodayPlan();
  }, []);

  // Initialize local exercises from log or scheduled workout
  useEffect(() => {
    if (todayLog && todayLog.exercises.length > 0) {
      // Use existing log data
      setLocalExercises(todayLog.exercises);
    } else if (todayPlan?.workout && !todayPlan.isRestDay) {
      // Initialize from plan's scheduled workout - NO weight in plan!
      const planExercises: WorkoutLogExercise[] = todayPlan.workout.exercises.map((e) => {
        // Parse rep range to get default rep count for initial sets
        const { min: minReps } = parseRepRange(e.targetReps);
        const defaultReps = minReps > 0 ? minReps : 8;

        // Create empty sets - user fills in weight during workout
        const sets: WorkoutSet[] = Array(e.targetSets)
          .fill(null)
          .map(() => ({
            weight: 0, // User enters actual weight during workout
            reps: defaultReps, // Default to lower end of rep range
            completed: false,
          }));

        return {
          name: e.name,
          sets,
          completed: false,
          // Store plan references for display
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          exerciseType: e.exerciseType,
          // Note: previousBest would come from backend workout history in the future
          // For now, it's not populated from the plan
        };
      });
      setLocalExercises(planExercises);
    }
  }, [todayLog, todayPlan]);

  const toggleComplete = (exerciseIndex: number) => {
    setLocalExercises((prev) =>
      prev.map((e, idx) => {
        if (idx === exerciseIndex) {
          const newCompleted = !e.completed;
          return {
            ...e,
            completed: newCompleted,
            sets: e.sets.map((s) => ({ ...s, completed: newCompleted })),
          };
        }
        return e;
      })
    );
    setHasChanges(true);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    setLocalExercises((prev) =>
      prev.map((e, idx) => {
        if (idx === exerciseIndex) {
          const newSets = e.sets.map((s, si) =>
            si === setIndex ? { ...s, completed: !s.completed } : s
          );
          // Auto-complete exercise if all sets are done
          const allSetsCompleted = newSets.every((s) => s.completed);
          return {
            ...e,
            sets: newSets,
            completed: allSetsCompleted,
          };
        }
        return e;
      })
    );
    setHasChanges(true);
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps",
    value: number
  ) => {
    setLocalExercises((prev) =>
      prev.map((e, idx) => {
        if (idx === exerciseIndex) {
          return {
            ...e,
            sets: e.sets.map((s, si) =>
              si === setIndex ? { ...s, [field]: value } : s
            ),
          };
        }
        return e;
      })
    );
    setHasChanges(true);
  };

  // Copy weight from previous set
  const copyFromPreviousSet = (exerciseIndex: number, setIndex: number) => {
    if (setIndex === 0) return;

    setLocalExercises((prev) =>
      prev.map((e, idx) => {
        if (idx === exerciseIndex) {
          const prevSet = e.sets[setIndex - 1];
          return {
            ...e,
            sets: e.sets.map((s, si) =>
              si === setIndex ? { ...s, weight: prevSet.weight, reps: prevSet.reps } : s
            ),
          };
        }
        return e;
      })
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!todayPlan?.workout) return;

    await logWorkout(
      todayPlan.workout.id,
      todayPlan.workout.name,
      localExercises
    );
    setHasChanges(false);
    toast.success("Workout saved!");
  };

  const completedCount = localExercises.filter((e) => e.completed).length;
  const totalExercises = localExercises.length;

  // Use calories from backend (single source of truth) - only available after saving
  const caloriesBurned = todayLog?.caloriesBurned ?? 0;

  // Calculate total completed sets
  const totalCompletedSets = localExercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = localExercises.reduce((sum, e) => sum + e.sets.length, 0);

  if (isLoading && !todayPlan) {
    return <LoadingSkeleton type="page" />;
  }

  // No plan scenario
  if (!todayPlan) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Workout Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log your sets, reps, and weights
          </p>
        </motion.div>

        <GlowCard glowColor="purple" className="mt-8">
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Workout Plan Yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a plan to start tracking your workouts.
            </p>
            <Link to="/plan/setup">
              <Button variant="neon">Create Your Plan</Button>
            </Link>
          </div>
        </GlowCard>
      </div>
    );
  }

  // Rest day scenario
  if (todayPlan.isRestDay) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Workout Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log your sets, reps, and weights
          </p>
        </motion.div>

        <GlowCard glowColor="blue">
          <div className="text-center py-8">
            <Moon className="w-12 h-12 mx-auto text-neon-blue mb-4" />
            <p className="text-2xl font-display font-bold text-foreground">
              Rest & Recover
            </p>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Today is a rest day. Your muscles grow during rest. Stay hydrated
              and get good sleep!
            </p>
            <p className="text-sm text-muted-foreground mt-4 capitalize">
              Scheduled: {todayPlan.dayOfWeek}
            </p>
          </div>
        </GlowCard>

        <GlowCard glowColor="purple">
          <h3 className="font-display font-semibold text-foreground mb-3">
            Recovery Tips
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-neon-green">•</span>
              Get 7-9 hours of quality sleep
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-blue">•</span>
              Stay hydrated - drink plenty of water
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-purple">•</span>
              Consider light stretching or yoga
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neon-red">•</span>
              Eat protein to support muscle recovery
            </li>
          </ul>
        </GlowCard>
      </div>
    );
  }

  const workoutName = todayPlan.workout?.name || "Today's Workout";

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 md:space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Workout Tracker
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log your sets, reps, and weights
        </p>
      </motion.div>

      {/* Today's Workout Header */}
      <GlowCard glowColor="purple">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-neon-purple" />
              <h3 className="font-display font-semibold text-foreground">
                {workoutName}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {completedCount}/{totalExercises} exercises • {totalCompletedSets}/
              {totalSets} sets
              <span className="text-xs ml-2 capitalize">
                ({todayPlan.dayOfWeek})
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-neon-red">
              <Flame className="w-5 h-5" />
              <span className="text-sm font-medium">{caloriesBurned} cal</span>
            </div>
            {hasChanges && (
              <Button
                variant="neon"
                size="sm"
                onClick={handleSave}
                disabled={isLoading}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            )}
          </div>
        </div>
      </GlowCard>

      {/* Progressive Overload Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start gap-2 p-3 rounded-lg bg-neon-blue/5 border border-neon-blue/20"
      >
        <Info className="w-4 h-4 text-neon-blue shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <span className="text-neon-blue font-medium">Progressive Overload:</span>{" "}
          Try to beat your previous best by adding weight or reps each session. 
          Look for the <TrendingUp className="w-3 h-3 inline text-neon-green" /> hints.
        </p>
      </motion.div>

      {/* Exercises */}
      <div className="space-y-3">
        {localExercises.map((exercise, idx) => {
          const targetExercise = todayPlan.workout?.exercises[idx];
          const completedSets = exercise.sets.filter((s) => s.completed).length;

          return (
            <motion.div
              key={`${exercise.name}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlowCard
                glowColor={exercise.completed ? "green" : "purple"}
                className={exercise.completed ? "border-neon-green/20" : ""}
              >
                {/* Exercise Header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpanded(expanded === exercise.name ? null : exercise.name)
                  }
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-sm font-medium ${
                        exercise.completed ? "text-neon-green" : "text-foreground"
                      }`}
                    >
                      {exercise.name}
                    </span>
                    {exercise.completed && (
                      <Check className="w-4 h-4 text-neon-green" />
                    )}
                    <ExerciseTypeBadge type={exercise.exerciseType} />
                  </div>
                  <div className="flex items-center gap-3">
                    {targetExercise && (
                      <span className="text-xs text-muted-foreground">
                        {completedSets}/{targetExercise.targetSets} sets •{" "}
                        {formatRepRange(targetExercise.targetReps)}
                      </span>
                    )}
                    {expanded === exercise.name ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Sets View */}
                <AnimatePresence>
                  {expanded === exercise.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-3">
                        {/* Previous Best Hint */}
                        <PreviousBestHint previousBest={exercise.previousBest} />

                        {/* Column Headers */}
                        <div className="grid grid-cols-[40px_1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium">
                          <span>Set</span>
                          <span>Weight (kg)</span>
                          <span>Reps</span>
                          <span></span>
                        </div>

                        {/* Sets */}
                        {exercise.sets.map((set, si) => (
                          <div
                            key={si}
                            className={`grid grid-cols-[40px_1fr_1fr_40px] gap-2 items-center ${
                              set.completed ? "opacity-60" : ""
                            }`}
                          >
                            <span className="text-sm text-muted-foreground">
                              {si + 1}
                            </span>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={set.weight || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  updateSet(idx, si, "weight", Number(e.target.value))
                                }
                                className="bg-secondary/60 rounded-lg px-2 py-1.5 text-sm text-foreground border border-border focus:border-primary/30 focus:outline-none w-full"
                              />
                              {si > 0 && !set.weight && (
                                <button
                                  type="button"
                                  onClick={() => copyFromPreviousSet(idx, si)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-neon-blue hover:text-neon-blue/80"
                                  title="Copy from previous set"
                                >
                                  Copy↑
                                </button>
                              )}
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={set.reps || ""}
                              placeholder="0"
                              onChange={(e) =>
                                updateSet(idx, si, "reps", Number(e.target.value))
                              }
                              className="bg-secondary/60 rounded-lg px-2 py-1.5 text-sm text-foreground border border-border focus:border-primary/30 focus:outline-none w-full"
                            />
                            <button
                              type="button"
                              onClick={() => toggleSetComplete(idx, si)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                set.completed
                                  ? "bg-neon-green/20 text-neon-green"
                                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                              }`}
                              title={set.completed ? "Mark incomplete" : "Mark complete"}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        ))}

                        {/* Target Rep Range Info */}
                        {targetExercise && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Target: {formatRepRange(targetExercise.targetReps)} per set
                            {targetExercise.notes && (
                              <span className="block mt-1 italic">
                                Note: {targetExercise.notes}
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      {/* Mark Exercise Complete Button */}
                      <Button
                        variant={exercise.completed ? "outline" : "neon"}
                        size="sm"
                        className="mt-4 w-full rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleComplete(idx);
                        }}
                      >
                        {exercise.completed ? "Undo" : "Mark Exercise Complete"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state if no exercises */}
      {localExercises.length === 0 && (
        <GlowCard glowColor="purple">
          <div className="text-center py-8">
            <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Exercises Scheduled</h2>
            <p className="text-muted-foreground mb-4">
              This workout type doesn't have any exercises defined yet.
            </p>
            <Link to="/plan/setup">
              <Button variant="neon">Edit Your Plan</Button>
            </Link>
          </div>
        </GlowCard>
      )}
    </div>
  );
}
