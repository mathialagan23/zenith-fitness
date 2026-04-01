import { motion } from "framer-motion";
import { Dumbbell, Clock, Check, ChevronRight, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { WorkoutDayType, PlanExercise } from "@/types";

interface TodayWorkoutCardProps {
  workout: WorkoutDayType | null;
  isRestDay: boolean;
  completedExercises: number;
  totalExercises: number;
}

export function TodayWorkoutCard({
  workout,
  isRestDay,
  completedExercises,
  totalExercises,
}: TodayWorkoutCardProps) {
  const isCompleted = completedExercises === totalExercises && totalExercises > 0;
  const isInProgress = completedExercises > 0 && !isCompleted;
  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  if (isRestDay) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-neon-blue/10 to-transparent border border-neon-blue/20 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-neon-blue" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">Rest Day</h4>
            <p className="text-sm text-muted-foreground">Recovery & muscle repair</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-neon-blue/80">
          Rest is essential for muscle growth. Stay hydrated!
        </div>
      </motion.div>
    );
  }

  if (!workout) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-xl bg-secondary/30 border border-border/50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-muted-foreground">No workout scheduled</h4>
            <p className="text-sm text-muted-foreground">Plan your workout in settings</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <Link to="/workout" className="block group">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "relative overflow-hidden rounded-xl border p-4 transition-all duration-300",
          "hover:border-neon-purple/40 hover:shadow-lg hover:shadow-neon-purple/10",
          isCompleted
            ? "bg-gradient-to-br from-neon-green/10 to-transparent border-neon-green/30"
            : isInProgress
            ? "bg-gradient-to-br from-neon-yellow/10 to-transparent border-neon-yellow/30"
            : "bg-gradient-to-br from-neon-purple/10 to-transparent border-neon-purple/20"
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
                  isCompleted
                    ? "bg-neon-green/20"
                    : isInProgress
                    ? "bg-neon-yellow/20"
                    : "bg-neon-purple/20"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-neon-green" />
                ) : (
                  <Dumbbell
                    className={cn(
                      "w-6 h-6",
                      isInProgress ? "text-neon-yellow" : "text-neon-purple"
                    )}
                  />
                )}
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{workout.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {workout.exercises.length} exercises
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-neon-purple transition-colors" />
          </div>

          {/* Exercise preview */}
          <div className="space-y-1.5">
            {workout.exercises.slice(0, 3).map((exercise, idx) => (
              <ExercisePreviewItem
                key={idx}
                exercise={exercise}
                isCompleted={idx < completedExercises}
              />
            ))}
            {workout.exercises.length > 3 && (
              <p className="text-xs text-muted-foreground pl-6">
                +{workout.exercises.length - 3} more exercises
              </p>
            )}
          </div>

          {/* Status badge */}
          <div className="mt-3 flex items-center justify-between">
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1",
                isCompleted
                  ? "bg-neon-green/10 text-neon-green"
                  : isInProgress
                  ? "bg-neon-yellow/10 text-neon-yellow"
                  : "bg-neon-purple/10 text-neon-purple"
              )}
            >
              {isCompleted ? (
                <>
                  <Check className="w-3 h-3" /> Completed
                </>
              ) : isInProgress ? (
                <>
                  <Clock className="w-3 h-3" /> {completedExercises}/{totalExercises} done
                </>
              ) : (
                "Ready to start"
              )}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function ExercisePreviewItem({
  exercise,
  isCompleted,
}: {
  exercise: PlanExercise;
  isCompleted: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={cn(
          "w-4 h-4 rounded-full flex items-center justify-center text-[10px]",
          isCompleted ? "bg-neon-green/20 text-neon-green" : "bg-secondary text-muted-foreground"
        )}
      >
        {isCompleted ? <Check className="w-2.5 h-2.5" /> : "•"}
      </div>
      <span className={cn("flex-1 truncate", isCompleted && "text-muted-foreground line-through")}>
        {exercise.name}
      </span>
      <span className="text-xs text-muted-foreground">
        {exercise.targetSets}×{exercise.targetReps}
      </span>
    </div>
  );
}
