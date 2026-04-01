import { useEffect } from "react";
import { GlowCard } from "@/components/GlowCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Target, Dumbbell, Flame, TrendingUp, TrendingDown, Minus, AlertCircle, Scale, ArrowDown, ArrowUp } from "lucide-react";
import { useInsightsStore, useProgressStore } from "@/store";

const Insights = () => {
  const { insights, isLoading, error, fetchInsights } = useInsightsStore();
  const { summary: progressSummary, fetchProgressSummary } = useProgressStore();

  useEffect(() => {
    fetchInsights();
    fetchProgressSummary();
  }, [fetchInsights, fetchProgressSummary]);

  // Build stats from insights data - only when insights is fully loaded
  const getStats = () => {
    if (!insights || typeof insights.avgCalories === 'undefined') return [];
    
    return [
      {
        icon: Target,
        label: "Protein Goal Hit",
        value: `${insights.proteinGoalDays ?? 0}/7 days`,
        color: "text-neon-green",
        glow: "green" as const,
      },
      {
        icon: Dumbbell,
        label: "Workouts Completed",
        value: `${insights.workoutsCompleted ?? 0} this week`,
        color: "text-neon-purple",
        glow: "purple" as const,
      },
      {
        icon: Flame,
        label: "Calories Avg",
        value: `${(insights.avgCalories ?? 0).toLocaleString()} / day`,
        color: "text-neon-red",
        glow: "red" as const,
      },
      {
        icon: (insights.weightChange ?? 0) < 0 ? TrendingDown : (insights.weightChange ?? 0) > 0 ? TrendingUp : Minus,
        label: "Weight Change",
        value: (insights.weightChange ?? 0) !== 0 
          ? `${(insights.weightChange ?? 0) > 0 ? "+" : ""}${(insights.weightChange ?? 0).toFixed(1)} kg`
          : "No change",
        color: "text-neon-blue",
        glow: "blue" as const,
      },
    ];
  };

  const stats = getStats();

  if (isLoading && !insights) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2 bg-secondary" />
          <Skeleton className="h-5 w-64 bg-secondary" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-secondary" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-foreground">Insights</h1>
        <p className="text-sm text-muted-foreground mt-1">Your weekly performance breakdown</p>
      </motion.div>

      {error && (
        <div className="p-4 rounded-xl bg-neon-red/10 border border-neon-red/30 text-neon-red text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Stat Cards */}
      {stats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat, idx) => (
            <GlowCard key={stat.label} glowColor={stat.glow} delay={idx * 0.1}>
              <div className="flex flex-col items-center text-center gap-3">
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      ) : !isLoading && (
        <GlowCard glowColor="purple">
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No insights available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start logging your meals and workouts to see your weekly insights
            </p>
          </div>
        </GlowCard>
      )}

      {/* Weekly Highlights */}
      {insights && insights.highlights && insights.highlights.length > 0 && (
        <GlowCard glowColor="purple" delay={0.4}>
          <h3 className="font-display font-semibold text-foreground mb-4">This Week's Highlights</h3>
          <div className="space-y-3">
            {insights.highlights.map((highlight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-neon-purple mt-2 shrink-0" />
                <p className="text-sm text-foreground">{highlight}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Recommendations */}
      {insights && insights.recommendations && insights.recommendations.length > 0 && (
        <GlowCard glowColor="blue" delay={0.5}>
          <h3 className="font-display font-semibold text-foreground mb-4">Recommendations</h3>
          <div className="space-y-3">
            {insights.recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-2 shrink-0" />
                <p className="text-sm text-foreground">{rec}</p>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Weekly Summary */}
      {insights && typeof insights.avgCalories !== 'undefined' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlowCard glowColor="green" delay={0.6}>
            <h3 className="font-display font-semibold text-foreground mb-4">Diet Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Calories</span>
                <span className="font-semibold text-foreground">
                  {((insights.avgCalories ?? 0) * 7).toLocaleString()} kcal
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Daily Protein</span>
                <span className="font-semibold text-foreground">{insights.avgProtein ?? 0}g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Protein Goal Days</span>
                <span className="font-semibold text-neon-green">{insights.proteinGoalDays ?? 0}/7</span>
              </div>
            </div>
          </GlowCard>

          <GlowCard glowColor="red" delay={0.7}>
            <h3 className="font-display font-semibold text-foreground mb-4">Workout Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Workouts Completed</span>
                <span className="font-semibold text-foreground">{insights.workoutsCompleted ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Volume</span>
                <span className="font-semibold text-foreground">
                  {(insights.totalVolume ?? 0).toLocaleString()} kg
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Est. Calories Burned</span>
                <span className="font-semibold text-neon-red">
                  {(insights.caloriesBurned ?? 0).toLocaleString()} kcal
               </span>
              </div>
            </div>
          </GlowCard>
        </div>
      )}

      {/* Weight Overview from progress summary (all-time) */}
      {progressSummary && (
        <GlowCard
          glowColor={
            progressSummary.changeFromStart < 0
              ? "green"
              : progressSummary.changeFromStart > 0
              ? "red"
              : "purple"
          }
          delay={0.8}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Scale className="w-8 h-8 text-neon-purple" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Weight Overview</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {progressSummary.currentWeight.toFixed(1)} kg
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Started at {progressSummary.startingWeight.toFixed(1)} kg
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-2">
                {progressSummary.changeFromStart !== 0 && (
                  progressSummary.changeFromStart < 0 ? (
                    <ArrowDown className="w-4 h-4 text-neon-green" />
                  ) : (
                    <ArrowUp className="w-4 h-4 text-neon-red" />
                  )
                )}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Since start</p>
                  <p
                    className={`text-sm font-semibold ${
                      progressSummary.changeFromStart < 0
                        ? "text-neon-green"
                        : progressSummary.changeFromStart > 0
                        ? "text-neon-red"
                        : "text-foreground"
                    }`}
                  >
                    {progressSummary.changeFromStart === 0
                      ? "No change"
                      : `${progressSummary.changeFromStart > 0 ? "+" : ""}${progressSummary.changeFromStart.toFixed(1)} kg`}
                  </p>
                </div>
              </div>

              {progressSummary.previousWeekWeight !== null && (
                <div className="flex items-center gap-2">
                  {progressSummary.changeFromPreviousWeek !== null &&
                    progressSummary.changeFromPreviousWeek !== 0 && (
                      progressSummary.changeFromPreviousWeek < 0 ? (
                        <ArrowDown className="w-4 h-4 text-neon-green" />
                      ) : (
                        <ArrowUp className="w-4 h-4 text-neon-red" />
                      )
                    )}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Vs previous point</p>
                    <p className="text-sm font-semibold text-foreground">
                      {progressSummary.changeFromPreviousWeek === null ||
                      progressSummary.changeFromPreviousWeek === 0
                        ? "No change"
                        : `${progressSummary.changeFromPreviousWeek > 0 ? "+" : ""}${progressSummary.changeFromPreviousWeek.toFixed(1)} kg`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlowCard>
      )}
    </div>
  );
};

export default Insights;
