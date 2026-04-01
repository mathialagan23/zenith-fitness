import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK, WeeklySchedule, WorkoutDayType } from "@/types";

interface WeeklyScheduleBarProps {
  schedule: WeeklySchedule;
  dayTypes: WorkoutDayType[];
  currentDay: keyof WeeklySchedule;
}

const SHORT_DAY_LABELS: Record<keyof WeeklySchedule, string> = {
  monday: "M",
  tuesday: "T",
  wednesday: "W",
  thursday: "T",
  friday: "F",
  saturday: "S",
  sunday: "S",
};

export function WeeklyScheduleBar({ schedule, dayTypes, currentDay }: WeeklyScheduleBarProps) {
  const getDayTypeById = (id: string | null) => {
    if (!id) return null;
    return dayTypes.find((dt) => dt.id === id);
  };

  return (
    <div className="flex items-center justify-between gap-1">
      {DAYS_OF_WEEK.map((day, index) => {
        const dayTypeId = schedule[day];
        const dayType = getDayTypeById(dayTypeId);
        const isRestDay = !dayTypeId;
        const isToday = day === currentDay;

        return (
          <motion.div
            key={day}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex flex-col items-center gap-1 flex-1"
          >
            <span
              className={cn(
                "text-[10px] font-medium uppercase",
                isToday ? "text-neon-purple" : "text-muted-foreground"
              )}
            >
              {SHORT_DAY_LABELS[day]}
            </span>
            <div
              className={cn(
                "w-full h-8 rounded-lg flex items-center justify-center text-[9px] font-medium transition-all",
                isToday && "ring-2 ring-neon-purple ring-offset-1 ring-offset-background",
                isRestDay
                  ? "bg-secondary/50 text-muted-foreground"
                  : "bg-neon-purple/20 text-neon-purple"
              )}
              title={dayType?.name || "Rest"}
            >
              {isRestDay ? (
                <span className="opacity-50">R</span>
              ) : (
                <span className="truncate px-1">{dayType?.name?.charAt(0) || "W"}</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
