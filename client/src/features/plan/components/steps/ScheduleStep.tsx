import { usePlanStore } from "@/store";
import { WeeklySchedule, DAYS_OF_WEEK, DAY_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlowCard } from "@/components/GlowCard";
import { Calendar, Dumbbell, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export const ScheduleStep = () => {
  const { wizardDayTypes, wizardSchedule, setDayWorkout, nextStep, prevStep } = usePlanStore();

  const getWorkoutForDay = (day: keyof WeeklySchedule) => {
    const dayTypeId = wizardSchedule[day];
    if (!dayTypeId) return null;
    return wizardDayTypes.find((dt) => dt.id === dayTypeId);
  };

  const workoutDaysCount = Object.values(wizardSchedule).filter((v) => v !== null).length;
  const restDaysCount = 7 - workoutDaysCount;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Weekly Schedule</h2>
        <p className="text-muted-foreground mt-2">
          Assign your workout days to specific days of the week
        </p>
      </div>

      {/* Summary */}
      <GlowCard className="p-4">
        <div className="flex justify-center gap-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Dumbbell className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{workoutDaysCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Workout Days</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Moon className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold">{restDaysCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Rest Days</p>
          </div>
        </div>
      </GlowCard>

      {/* Warning if no workout types */}
      {wizardDayTypes.length === 0 && (
        <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-500 text-sm">
            You haven't created any workout day types yet. Go back to add some, or continue with rest days only.
          </p>
        </div>
      )}

      {/* Schedule Grid */}
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const workout = getWorkoutForDay(day);
          const isRest = !workout;

          return (
            <GlowCard
              key={day}
              className={cn(
                "p-4 transition-colors",
                isRest && "bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      isRest ? "bg-blue-500/10" : "bg-primary/10"
                    )}
                  >
                    {isRest ? (
                      <Moon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Dumbbell className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{DAY_LABELS[day]}</p>
                    <p className="text-sm text-muted-foreground">
                      {workout ? workout.name : "Rest Day"}
                    </p>
                  </div>
                </div>

                <Select
                  value={wizardSchedule[day] || "rest"}
                  onValueChange={(value) =>
                    setDayWorkout(day, value === "rest" ? null : value)
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select workout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rest">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-blue-400" />
                        Rest Day
                      </div>
                    </SelectItem>
                    {wizardDayTypes.map((dayType) => (
                      <SelectItem key={dayType.id} value={dayType.id}>
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-primary" />
                          {dayType.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </GlowCard>
          );
        })}
      </div>

      {/* Quick Assign Buttons */}
      {wizardDayTypes.length >= 3 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // PPL x2 schedule (Mon-Sat, Sun rest)
              const ppl = wizardDayTypes.slice(0, 3);
              if (ppl.length >= 3) {
                setDayWorkout("monday", ppl[0].id);
                setDayWorkout("tuesday", ppl[1].id);
                setDayWorkout("wednesday", ppl[2].id);
                setDayWorkout("thursday", ppl[0].id);
                setDayWorkout("friday", ppl[1].id);
                setDayWorkout("saturday", ppl[2].id);
                setDayWorkout("sunday", null);
              }
            }}
          >
            PPL x2 (6 days)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // PPL x1 schedule (Mon/Wed/Fri)
              const ppl = wizardDayTypes.slice(0, 3);
              if (ppl.length >= 3) {
                setDayWorkout("monday", ppl[0].id);
                setDayWorkout("tuesday", null);
                setDayWorkout("wednesday", ppl[1].id);
                setDayWorkout("thursday", null);
                setDayWorkout("friday", ppl[2].id);
                setDayWorkout("saturday", null);
                setDayWorkout("sunday", null);
              }
            }}
          >
            PPL (3 days)
          </Button>
        </div>
      )}

      {wizardDayTypes.length === 2 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Upper/Lower x2 schedule
              const ul = wizardDayTypes.slice(0, 2);
              if (ul.length >= 2) {
                setDayWorkout("monday", ul[0].id);
                setDayWorkout("tuesday", ul[1].id);
                setDayWorkout("wednesday", null);
                setDayWorkout("thursday", ul[0].id);
                setDayWorkout("friday", ul[1].id);
                setDayWorkout("saturday", null);
                setDayWorkout("sunday", null);
              }
            }}
          >
            Upper/Lower x2 (4 days)
          </Button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep}>Review Plan</Button>
      </div>
    </div>
  );
};
