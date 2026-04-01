import { useEffect, useState } from "react";
import { GlowCard } from "@/components/GlowCard";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Camera, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useProgressStore } from "@/store";
import { toast } from "@/components/ui/use-toast";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogDescription,
} from "@/components/ui/dialog";

const Progress = () => {
  const {
		progressHistory,
		isLoading,
		error,
		fetchProgress,
		logProgress,
		getWeightChartData,
		startingWeight,
		currentWeight,
		previousWeight,
		changeFromStart,
		changeFromPrevious,
  } = useProgressStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState("");

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

	// Ensure progressHistory is always an array
	const entries = progressHistory || [];

	// Use store helper for chart data (all entries, chronological)
	const chartData = getWeightChartData();

	const handleLogWeight = async () => {
		const weight = parseFloat(newWeight);
		if (isNaN(weight) || weight <= 0) {
			toast({
				title: "Invalid weight",
				description: "Please enter a valid weight value.",
			});
			return;
		}

		try {
			await logProgress({ weight });
			toast({
				title: "Weight logged",
				description: "Your progress has been updated.",
			});
			setNewWeight("");
			setIsDialogOpen(false);
		} catch {
			toast({
				title: "Logging failed",
				description: "Could not save your weight. Please try again.",
			});
		}
	};

  if (isLoading && entries.length === 0) {
    return (
	    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-9 w-48 mb-2 bg-secondary" />
          <Skeleton className="h-5 w-64 bg-secondary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-secondary" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl bg-secondary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your transformation</p>
        </div>
	        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
		      <DialogTrigger asChild>
            <Button variant="neon" size="sm" className="gap-2">
              <Scale className="w-4 h-4" />
              Log Weight
            </Button>
          </DialogTrigger>
		      <DialogContent className="bg-card border-border">
		        <DialogHeader>
		          <DialogTitle className="text-foreground">Log Today's Weight</DialogTitle>
		          <DialogDescription>
		            Log your current weight to track progress.
		          </DialogDescription>
		        </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="Enter your weight"
                  className="w-full bg-secondary/60 rounded-xl px-4 py-3 text-sm text-foreground border border-border focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-colors"
                />
              </div>
              <Button 
                variant="neon" 
                className="w-full" 
                onClick={handleLogWeight}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Weight"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

	      {error && (
        <div className="p-4 rounded-xl bg-neon-red/10 border border-neon-red/30 text-neon-red text-sm">
          {error}
        </div>
      )}

	      {/* Weight stats */}
	      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
	        <GlowCard glowColor="purple" delay={0.1}>
	          <p className="text-sm text-muted-foreground mb-1">Current Weight</p>
	          <p className="text-3xl font-display font-bold text-foreground">
	            {currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : "—"}
	          </p>
	        </GlowCard>
	        <GlowCard glowColor="blue" delay={0.2}>
	          <p className="text-sm text-muted-foreground mb-1">Previous Entry</p>
	          <p className="text-3xl font-display font-bold text-foreground">
	            {previousWeight !== null ? `${previousWeight.toFixed(1)} kg` : "—"}
	          </p>
	          {previousWeight !== null && changeFromPrevious !== null && (
	            <p className="text-xs text-muted-foreground mt-1">
	              Change vs previous: {changeFromPrevious > 0 ? "+" : ""}
	              {changeFromPrevious.toFixed(1)} kg
	            </p>
	          )}
	        </GlowCard>
	        <GlowCard
	          glowColor={
	            changeFromStart !== null && changeFromStart < 0
	              ? "green"
	              : changeFromStart !== null && changeFromStart > 0
	              ? "red"
	              : "purple"
	          }
	          delay={0.3}
	        >
	          <p className="text-sm text-muted-foreground mb-1">From Start</p>
	          <div className="flex items-center gap-2">
	            {changeFromStart !== null && changeFromStart !== 0 && (
	              changeFromStart < 0 ? (
	                <ArrowDown className="w-5 h-5 text-neon-green" />
	              ) : (
	                <ArrowUp className="w-5 h-5 text-neon-red" />
	              )
	            )}
	            <p
	              className={`text-3xl font-display font-bold ${
	                changeFromStart !== null && changeFromStart < 0
	                  ? "text-neon-green"
	                  : changeFromStart !== null && changeFromStart > 0
	                  ? "text-neon-red"
	                  : "text-foreground"
	              }`}
	            >
	              {changeFromStart !== null && changeFromStart !== 0
	                ? `${Math.abs(changeFromStart).toFixed(1)} kg`
	                : "—"}
	            </p>
	          </div>
	          <p className="text-xs text-muted-foreground mt-1">
	            Starting weight:{" "}
	            {startingWeight !== null ? `${startingWeight.toFixed(1)} kg` : "—"}
	          </p>
	        </GlowCard>
	      </div>

      {/* Weight Chart */}
       <GlowCard glowColor="purple" delay={0.4}>
        <h3 className="font-display font-semibold text-foreground mb-6">Weight Trend</h3>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
               <LineChart data={chartData}>
                 <XAxis dataKey="label" stroke="hsl(220 10% 50%)" fontSize={12} />
                <YAxis domain={["auto", "auto"]} stroke="hsl(220 10% 50%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 8% 8%)",
                    border: "1px solid hsl(240 6% 16%)",
                    borderRadius: "12px",
                    color: "hsl(220 20% 92%)",
                  }}
                   formatter={(value: number) => [`${value} kg`, "Weight"]}
                   labelFormatter={(_, payload) => {
                     if (payload && payload[0]) {
                       return new Date(payload[0].payload.date).toLocaleDateString();
                     }
                     return "";
                   }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(270 80% 60%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(270 80% 60%)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "hsl(270 80% 60%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No weight data yet</p>
              <p className="text-sm mt-1">Log your first weight to see the trend</p>
            </div>
          </div>
        )}
      </GlowCard>

      {/* Progress Photos (UI only - future feature) */}
      <GlowCard glowColor="blue" delay={0.5}>
        <h3 className="font-display font-semibold text-foreground mb-4">Progress Photos</h3>
        <p className="text-sm text-muted-foreground mb-4">Coming soon - track your visual transformation</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Week 1", "Week 4", "Week 6", "Add New"].map((label, i) => (
            <div
              key={label}
              className="aspect-[3/4] rounded-2xl bg-secondary/50 border border-border flex flex-col items-center justify-center gap-2 hover:border-primary/30 transition-colors cursor-pointer opacity-50"
            >
              {i === 3 ? (
                <>
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{label}</span>
              )}
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
};

export default Progress;
