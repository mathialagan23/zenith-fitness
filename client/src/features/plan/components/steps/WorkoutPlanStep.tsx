import { useState } from "react";
import { usePlanStore } from "@/store";
import { PlanExercise, ExerciseType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GlowCard } from "@/components/GlowCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dumbbell,
  Plus,
  Trash2,
  ChevronDown,
  FileText,
  Edit2,
  X,
  Target,
  Zap,
  User,
} from "lucide-react";
import { parseWorkoutPlan, sampleWorkoutText, detectExerciseType } from "../../utils/planParser";
import { cn } from "@/lib/utils";

// Exercise type badge colors
const exerciseTypeStyles: Record<ExerciseType, { bg: string; text: string; icon: React.ReactNode }> = {
  compound: { bg: "bg-neon-purple/20", text: "text-neon-purple", icon: <Zap className="w-3 h-3" /> },
  isolation: { bg: "bg-neon-blue/20", text: "text-neon-blue", icon: <Target className="w-3 h-3" /> },
  bodyweight: { bg: "bg-neon-green/20", text: "text-neon-green", icon: <User className="w-3 h-3" /> },
};

// Exercise editor component - NO WEIGHT FIELD (weight belongs in logs only)
const ExerciseEditor = ({
  exercise,
  onSave,
  onCancel,
}: {
  exercise?: PlanExercise;
  onSave: (exercise: PlanExercise) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<PlanExercise>(
    exercise || { 
      name: "", 
      targetSets: 3, 
      targetReps: "8-12",
      exerciseType: "compound",
      notes: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Auto-detect exercise type if not set
    const finalData = {
      ...formData,
      exerciseType: formData.exerciseType || detectExerciseType(formData.name),
    };
    onSave(finalData);
  };

  // Common rep range presets
  const repRangePresets = [
    { label: "Strength (3-5)", value: "3-5" },
    { label: "Hypertrophy (6-8)", value: "6-8" },
    { label: "Hypertrophy (8-12)", value: "8-12" },
    { label: "Endurance (12-15)", value: "12-15" },
    { label: "High Rep (15-20)", value: "15-20" },
    { label: "Max/AMRAP", value: "max" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="exerciseName">Exercise Name</Label>
        <Input
          id="exerciseName"
          value={formData.name}
          onChange={(e) => {
            const name = e.target.value;
            setFormData({ 
              ...formData, 
              name,
              // Auto-suggest exercise type based on name
              exerciseType: formData.exerciseType || detectExerciseType(name),
            });
          }}
          placeholder="e.g., Bench Press, Squats, Bicep Curls"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sets">Sets</Label>
          <Input
            id="sets"
            type="number"
            min={1}
            max={20}
            value={formData.targetSets}
            onChange={(e) => setFormData({ ...formData, targetSets: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="reps">Rep Range</Label>
          <div className="flex gap-2">
            <Input
              id="reps"
              type="text"
              value={formData.targetReps}
              onChange={(e) => setFormData({ ...formData, targetReps: e.target.value })}
              placeholder="e.g., 6-8, 10, max"
              className="flex-1"
            />
            <Select
              value=""
              onValueChange={(value) => setFormData({ ...formData, targetReps: value })}
            >
              <SelectTrigger className="w-10 px-2">
                <ChevronDown className="w-4 h-4" />
              </SelectTrigger>
              <SelectContent>
                {repRangePresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use ranges like "6-8" or single values like "10"
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="exerciseType">Exercise Type</Label>
        <Select
          value={formData.exerciseType || "compound"}
          onValueChange={(value) => setFormData({ ...formData, exerciseType: value as ExerciseType })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compound">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-purple" />
                Compound (multi-joint)
              </div>
            </SelectItem>
            <SelectItem value="isolation">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-neon-blue" />
                Isolation (single-joint)
              </div>
            </SelectItem>
            <SelectItem value="bodyweight">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neon-green" />
                Bodyweight
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          value={formData.notes || ""}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="e.g., slow eccentric, pause at bottom"
        />
      </div>

      {/* Info box about weight */}
      <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
        <p className="font-medium mb-1">Why no weight field?</p>
        <p>Weight is tracked when you <strong>log your workout</strong>, not in the plan. This allows you to track progressive overload over time!</p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{exercise ? "Update" : "Add Exercise"}</Button>
      </div>
    </form>
  );
};

// Day type card component
const DayTypeCard = ({ dayTypeId }: { dayTypeId: string }) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // This is React's Rules of Hooks - hooks must be called in the same order every render
  const {
    wizardDayTypes,
    updateDayTypeName,
    removeDayType,
    addExercise,
    removeExercise,
    updateExercise,
  } = usePlanStore();

  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [showAddExercise, setShowAddExercise] = useState(false);

  const dayType = wizardDayTypes.find((dt) => dt.id === dayTypeId);
  
  // Early return AFTER all hooks are called
  if (!dayType) return null;

  return (
    <GlowCard className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
              {isEditing ? (
                <Input
                  value={dayType.name}
                  onChange={(e) => updateDayTypeName(dayTypeId, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
                  className="h-8 w-48"
                  autoFocus
                />
              ) : (
                <span className="font-semibold">{dayType.name}</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <Edit2 className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {dayType.exercises.length} exercises
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDayType(dayTypeId);
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {dayType.exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No exercises yet. Add some exercises to this workout day.
              </p>
            ) : (
              dayType.exercises.map((exercise, exerciseIndex) => {
                const typeStyle = exerciseTypeStyles[exercise.exerciseType || "compound"];
                
                return (
                  <div
                    key={exerciseIndex}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{exercise.name}</p>
                        {exercise.exerciseType && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1",
                            typeStyle.bg, typeStyle.text
                          )}>
                            {typeStyle.icon}
                            {exercise.exerciseType}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exercise.targetSets} sets × {exercise.targetReps} reps
                        {exercise.notes && <span className="ml-2 italic">• {exercise.notes}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog
                        open={editingExerciseIndex === exerciseIndex}
                        onOpenChange={(open) => setEditingExerciseIndex(open ? exerciseIndex : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Exercise</DialogTitle>
                          </DialogHeader>
                          <ExerciseEditor
                            exercise={exercise}
                            onSave={(updatedExercise) => {
                              updateExercise(dayTypeId, exerciseIndex, updatedExercise);
                              setEditingExerciseIndex(null);
                            }}
                            onCancel={() => setEditingExerciseIndex(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeExercise(dayTypeId, exerciseIndex)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}

            {showAddExercise ? (
              <div className="p-3 border rounded-lg">
                <ExerciseEditor
                  onSave={(exercise) => {
                    addExercise(dayTypeId, exercise);
                    setShowAddExercise(false);
                  }}
                  onCancel={() => setShowAddExercise(false)}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddExercise(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlowCard>
  );
};

export const WorkoutPlanStep = () => {
  const { wizardDayTypes, setWizardDayTypes, addDayType, nextStep, prevStep } = usePlanStore();
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const handleParsePlan = () => {
    const parsedDayTypes = parseWorkoutPlan(pasteText);
    if (parsedDayTypes.length > 0) {
      setWizardDayTypes(parsedDayTypes);
      setShowPasteDialog(false);
      setPasteText("");
    }
  };

  const handleLoadSample = () => {
    setPasteText(sampleWorkoutText);
  };

  const handleAddQuickTemplate = (template: "ppl" | "upper-lower" | "full-body") => {
    const templates = {
      ppl: [
        { id: "push", name: "Push Day", exercises: [] },
        { id: "pull", name: "Pull Day", exercises: [] },
        { id: "legs", name: "Leg Day", exercises: [] },
      ],
      "upper-lower": [
        { id: "upper", name: "Upper Body", exercises: [] },
        { id: "lower", name: "Lower Body", exercises: [] },
      ],
      "full-body": [
        { id: "fullbody-a", name: "Full Body A", exercises: [] },
        { id: "fullbody-b", name: "Full Body B", exercises: [] },
      ],
    };
    setWizardDayTypes(templates[template]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Dumbbell className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Workout Plan</h2>
        <p className="text-muted-foreground mt-2">
          Define your workout structure with sets and rep ranges.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          You'll track actual weights when logging workouts.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Paste Workout Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Workout Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste your workout plan in text format. Use rep ranges like "6-8" or "10-12".
                Weight is <strong>not</strong> included in the plan (tracked in logs).
              </p>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Push Day:
- Bench Press: 4 sets, 6-8 reps [compound]
- Overhead Press: 3x8-10
- Lateral Raises: 3x12-15 [isolation]

Pull Day:
- Deadlift: 3 sets, 5 reps
- Barbell Row: 4x8-10
- Pull-ups: 3xmax [bodyweight]"
                rows={12}
              />
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={handleLoadSample}>
                  Load Sample
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPasteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleParsePlan} disabled={!pasteText.trim()}>
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" size="sm" onClick={() => addDayType("New Workout")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Day Type
        </Button>
      </div>

      {/* Quick Templates */}
      {wizardDayTypes.length === 0 && (
        <GlowCard className="p-4">
          <h3 className="font-semibold mb-3 text-center">Quick Start Templates</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="secondary" size="sm" onClick={() => handleAddQuickTemplate("ppl")}>
              Push/Pull/Legs
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAddQuickTemplate("upper-lower")}>
              Upper/Lower
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleAddQuickTemplate("full-body")}>
              Full Body A/B
            </Button>
          </div>
        </GlowCard>
      )}

      {/* Day Types */}
      <div className="space-y-4">
        {wizardDayTypes.map((dayType) => (
          <DayTypeCard key={dayType.id} dayTypeId={dayType.id} />
        ))}
      </div>

      {wizardDayTypes.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No workout days defined yet. Use a template or add custom day types.
        </p>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep}>Continue to Schedule</Button>
      </div>
    </div>
  );
};
