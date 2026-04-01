import { useState } from "react";
import { usePlanStore } from "@/store";
import { FoodItem } from "@/types";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  ChevronDown,
  FileText,
  Edit2,
  X,
} from "lucide-react";
import { parseDietPlan, sampleDietText } from "../../utils/planParser";
import { cn } from "@/lib/utils";

// Food item editor component
const FoodItemEditor = ({
  item,
  onSave,
  onCancel,
}: {
  item?: FoodItem;
  onSave: (item: FoodItem) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState<FoodItem>(
    item || { name: "", calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="foodName">Food Name</Label>
        <Input
          id="foodName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Chicken breast (200g)"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="calories">Calories</Label>
          <Input
            id="calories"
            type="number"
            min={0}
            value={formData.calories}
            onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="protein">Protein (g)</Label>
          <Input
            id="protein"
            type="number"
            min={0}
            value={formData.protein}
            onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="carbs">Carbs (g)</Label>
          <Input
            id="carbs"
            type="number"
            min={0}
            value={formData.carbs}
            onChange={(e) => setFormData({ ...formData, carbs: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label htmlFor="fat">Fat (g)</Label>
          <Input
            id="fat"
            type="number"
            min={0}
            value={formData.fat}
            onChange={(e) => setFormData({ ...formData, fat: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{item ? "Update" : "Add"}</Button>
      </div>
    </form>
  );
};

// Meal card component
const MealCard = ({ mealIndex }: { mealIndex: number }) => {
  const {
    wizardMeals,
    updateMealName,
    removeMeal,
    addFoodItem,
    removeFoodItem,
    updateFoodItem,
  } = usePlanStore();
  const meal = wizardMeals[mealIndex];
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  const mealTotals = meal.items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

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
                  value={meal.name}
                  onChange={(e) => updateMealName(mealIndex, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => setIsEditing(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
                  className="h-8 w-40"
                  autoFocus
                />
              ) : (
                <span className="font-semibold">{meal.name}</span>
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
              <div className="text-sm text-muted-foreground">
                {mealTotals.calories} cal | {mealTotals.protein}g protein
              </div>
              {wizardMeals.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMeal(mealIndex);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {meal.items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No food items yet. Add some food to this meal.
              </p>
            ) : (
              meal.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog
                      open={editingItemIndex === itemIndex}
                      onOpenChange={(open) => setEditingItemIndex(open ? itemIndex : null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Food Item</DialogTitle>
                        </DialogHeader>
                        <FoodItemEditor
                          item={item}
                          onSave={(updatedItem) => {
                            updateFoodItem(mealIndex, itemIndex, updatedItem);
                            setEditingItemIndex(null);
                          }}
                          onCancel={() => setEditingItemIndex(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeFoodItem(mealIndex, itemIndex)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            {showAddItem ? (
              <div className="p-3 border rounded-lg">
                <FoodItemEditor
                  onSave={(item) => {
                    addFoodItem(mealIndex, item);
                    setShowAddItem(false);
                  }}
                  onCancel={() => setShowAddItem(false)}
                />
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddItem(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Food Item
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </GlowCard>
  );
};

export const DietPlanStep = () => {
  const { wizardMeals, setWizardMeals, addMeal, nextStep, prevStep } = usePlanStore();
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const totalMacros = wizardMeals.reduce(
    (acc, meal) =>
      meal.items.reduce(
        (mealAcc, item) => ({
          calories: mealAcc.calories + item.calories,
          protein: mealAcc.protein + item.protein,
          carbs: mealAcc.carbs + item.carbs,
          fat: mealAcc.fat + item.fat,
        }),
        acc
      ),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleParsePlan = () => {
    const parsedMeals = parseDietPlan(pasteText);
    if (parsedMeals.length > 0) {
      setWizardMeals(parsedMeals);
      setShowPasteDialog(false);
      setPasteText("");
    }
  };

  const handleLoadSample = () => {
    setPasteText(sampleDietText);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Diet Plan</h2>
        <p className="text-muted-foreground mt-2">
          Define your daily meals and food items. Targets will be auto-calculated.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Paste Diet Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Import Diet Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste your diet plan in text format. Each meal should have a header
                (e.g., "Breakfast:") followed by food items with nutritional info.
              </p>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Breakfast:
- Oats with milk: 300 cal, 12g protein, 45g carbs, 8g fat
- Boiled eggs (3): 210 cal, 18g protein

Lunch:
- Chicken breast (200g): 330 cal, 62g protein, 0g carbs, 7g fat"
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

        <Button variant="outline" size="sm" onClick={() => addMeal("New Meal")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Meal
        </Button>
      </div>

      {/* Daily Totals */}
      <GlowCard className="p-4">
        <h3 className="font-semibold mb-3">Daily Totals (Auto-calculated)</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{totalMacros.calories}</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">{totalMacros.protein}g</p>
            <p className="text-xs text-muted-foreground">Protein</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-500">{totalMacros.carbs}g</p>
            <p className="text-xs text-muted-foreground">Carbs</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-500">{totalMacros.fat}g</p>
            <p className="text-xs text-muted-foreground">Fat</p>
          </div>
        </div>
      </GlowCard>

      {/* Meals */}
      <div className="space-y-4">
        {wizardMeals.map((_, index) => (
          <MealCard key={index} mealIndex={index} />
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={nextStep}>Continue to Workout Plan</Button>
      </div>
    </div>
  );
};
