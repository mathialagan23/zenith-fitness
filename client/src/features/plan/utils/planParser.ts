import { PlanMeal, FoodItem, WorkoutDayType, PlanExercise, ExerciseType } from "@/types";

/**
 * Parse diet plan text into structured meals
 * 
 * Supported formats:
 * - "Food name: 300 cal, 20g protein" or "Food name: 300cal, 20g protein, 30g carbs, 10g fat"
 * - "Food name (300 cal, 20g protein)"
 * - Meal headers: "Breakfast:", "Lunch:", "Dinner:", "Snacks:", or custom "## Meal Name"
 * 
 * Example:
 * ```
 * Breakfast:
 * - Oats with milk: 300 cal, 12g protein, 45g carbs, 8g fat
 * - Boiled eggs (3): 210 cal, 18g protein
 * 
 * Lunch:
 * - Chicken breast (200g): 330 cal, 62g protein, 0g carbs, 7g fat
 * ```
 */
export const parseDietPlan = (text: string): PlanMeal[] => {
  const meals: PlanMeal[] = [];
  let currentMeal: PlanMeal | null = null;

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    // Check for meal header
    const mealHeaderMatch = line.match(/^(?:##\s*)?(.+?):\s*$/i) || 
                           line.match(/^(?:##\s*)(.+)$/);
    
    if (mealHeaderMatch) {
      const mealName = mealHeaderMatch[1].trim();
      // Save previous meal if exists
      if (currentMeal && currentMeal.items.length > 0) {
        meals.push(currentMeal);
      }
      currentMeal = { name: mealName, items: [] };
      continue;
    }

    // Check for food item
    const foodItem = parseFoodItem(line);
    if (foodItem) {
      if (!currentMeal) {
        // No meal header yet, create a default one
        currentMeal = { name: "Meal", items: [] };
      }
      currentMeal.items.push(foodItem);
    }
  }

  // Don't forget the last meal
  if (currentMeal && currentMeal.items.length > 0) {
    meals.push(currentMeal);
  }

  return meals;
};

/**
 * Parse a single food item line
 */
const parseFoodItem = (line: string): FoodItem | null => {
  // Remove leading dash or bullet
  const cleanLine = line.replace(/^[-*•]\s*/, "").trim();
  if (!cleanLine) return null;

  // Try to match: "Food name: XXX cal, XXg protein, XXg carbs, XXg fat"
  // or: "Food name (XXX cal, XXg protein)"
  const colonMatch = cleanLine.match(
    /^(.+?):\s*(\d+)\s*(?:cal|kcal)(?:,?\s*(\d+)g?\s*protein)?(?:,?\s*(\d+)g?\s*carbs?)?(?:,?\s*(\d+)g?\s*fat)?/i
  );
  
  const parenMatch = cleanLine.match(
    /^(.+?)\s*\((\d+)\s*(?:cal|kcal)(?:,?\s*(\d+)g?\s*protein)?(?:,?\s*(\d+)g?\s*carbs?)?(?:,?\s*(\d+)g?\s*fat)?\)/i
  );

  const match = colonMatch || parenMatch;

  if (match) {
    return {
      name: match[1].trim(),
      calories: parseInt(match[2]) || 0,
      protein: parseInt(match[3]) || 0,
      carbs: parseInt(match[4]) || 0,
      fat: parseInt(match[5]) || 0,
    };
  }

  return null;
};

/**
 * Parse workout plan text into structured day types
 * 
 * NEW FORMAT - Supports rep ranges, no weight in plan:
 * - "Exercise name: 3 sets, 6-8 reps"
 * - "Exercise name: 4x8-12"
 * - "Exercise name: 3x10 [compound]"
 * 
 * LEGACY FORMAT - Also supported for migration:
 * - "Exercise name: 3x10 @ 60kg" (weight will be IGNORED in plan)
 * 
 * Example:
 * ```
 * Push Day:
 * - Bench Press: 4 sets, 6-8 reps [compound]
 * - Overhead Press: 3x8-10
 * - Lateral Raises: 3x12-15 [isolation]
 * 
 * Pull Day:
 * - Deadlift: 3 sets, 5 reps [compound]
 * - Barbell Row: 4x8-10
 * ```
 */
export const parseWorkoutPlan = (text: string): WorkoutDayType[] => {
  const dayTypes: WorkoutDayType[] = [];
  let currentDayType: WorkoutDayType | null = null;
  let idCounter = 1;

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    // Check for day type header
    const headerMatch = line.match(/^(?:##\s*)?(.+?):\s*$/i) ||
                       line.match(/^(?:##\s*)(.+)$/);
    
    if (headerMatch) {
      const dayTypeName = headerMatch[1].trim();
      // Save previous day type if exists
      if (currentDayType && currentDayType.exercises.length > 0) {
        dayTypes.push(currentDayType);
      }
      currentDayType = {
        id: `dt_${idCounter++}`,
        name: dayTypeName,
        exercises: [],
      };
      continue;
    }

    // Check for exercise
    const exercise = parseExercise(line);
    if (exercise) {
      if (!currentDayType) {
        // No day type header yet, create a default one
        currentDayType = {
          id: `dt_${idCounter++}`,
          name: "Workout",
          exercises: [],
        };
      }
      currentDayType.exercises.push(exercise);
    }
  }

  // Don't forget the last day type
  if (currentDayType && currentDayType.exercises.length > 0) {
    dayTypes.push(currentDayType);
  }

  return dayTypes;
};

/**
 * Parse a single exercise line - NEW FORMAT
 * Supports:
 * - "Bench Press: 4 sets, 6-8 reps"
 * - "Bench Press: 4x6-8"
 * - "Bench Press: 4x8"
 * - "Bench Press: 4x8 @ 70kg" (legacy - weight is IGNORED)
 * - "Bench Press: 3x10 [compound]"
 * - "Pull-ups: 3xmax"
 */
const parseExercise = (line: string): PlanExercise | null => {
  // Remove leading dash or bullet
  const cleanLine = line.replace(/^[-*•]\s*/, "").trim();
  if (!cleanLine) return null;

  // Extract exercise type tag if present [compound], [isolation], [bodyweight]
  let exerciseType: ExerciseType | undefined;
  const typeMatch = cleanLine.match(/\[(compound|isolation|bodyweight)\]/i);
  if (typeMatch) {
    exerciseType = typeMatch[1].toLowerCase() as ExerciseType;
  }
  const lineWithoutType = cleanLine.replace(/\s*\[(compound|isolation|bodyweight)\]/i, "");

  // Pattern 1: "Exercise: X sets, Y-Z reps" or "Exercise: X sets, Y reps"
  const setsRepsMatch = lineWithoutType.match(
    /^(.+?):\s*(\d+)\s*sets?,?\s*(\d+(?:\s*[-–]\s*\d+)?|max|amrap)\s*reps?/i
  );
  
  if (setsRepsMatch) {
    return {
      name: setsRepsMatch[1].trim(),
      targetSets: parseInt(setsRepsMatch[2]) || 3,
      targetReps: normalizeRepRange(setsRepsMatch[3]),
      exerciseType,
    };
  }

  // Pattern 2: "Exercise: XxY-Z" or "Exercise: XxY" (with optional @ weight which is IGNORED)
  const shortMatch = lineWithoutType.match(
    /^(.+?):\s*(\d+)\s*[xX]\s*(\d+(?:\s*[-–]\s*\d+)?|max|amrap)(?:\s*(?:@|at)?\s*\d+\s*(?:kg|lbs?)?)?/i
  );

  if (shortMatch) {
    return {
      name: shortMatch[1].trim(),
      targetSets: parseInt(shortMatch[2]) || 3,
      targetReps: normalizeRepRange(shortMatch[3]),
      exerciseType,
    };
  }

  return null;
};

/**
 * Normalize rep range string
 * - "6 - 8" -> "6-8"
 * - "6–8" -> "6-8"
 * - "max" -> "max"
 * - "8" -> "8"
 */
const normalizeRepRange = (input: string): string => {
  const cleaned = input.trim().toLowerCase();
  
  if (cleaned === "max" || cleaned === "amrap") {
    return "max";
  }
  
  // Normalize dashes and spaces
  return cleaned.replace(/\s*[-–]\s*/g, "-");
};

/**
 * MIGRATION FUNCTION: Convert old format to new format
 * 
 * Old: "Bench Press: 4x8 @ 70kg"
 * New: { name: "Bench Press", targetSets: 4, targetReps: "8" }
 * 
 * Weight is IGNORED - it belongs only in workout logs.
 */
export const convertOldToNewFormat = (oldString: string): PlanExercise | null => {
  // Pattern: "Exercise: XxY @ Zkg"
  const match = oldString.match(
    /^(.+?):\s*(\d+)\s*[xX]\s*(\d+)(?:\s*(?:@|at)?\s*(\d+)\s*(?:kg|lbs?)?)?/i
  );

  if (match) {
    return {
      name: match[1].trim(),
      targetSets: parseInt(match[2]) || 3,
      targetReps: match[3], // Keep as string
      // Weight is intentionally IGNORED - belongs only in logs
    };
  }

  return null;
};

/**
 * Batch convert multiple old format exercises
 */
export const migrateOldExercises = (oldExercises: Array<{ name: string; targetSets: number; targetReps: number; targetWeight?: number }>): PlanExercise[] => {
  return oldExercises.map(old => ({
    name: old.name,
    targetSets: old.targetSets,
    targetReps: String(old.targetReps), // Convert number to string
    // targetWeight is intentionally dropped
  }));
};

/**
 * Detect exercise type based on name (heuristic)
 */
export const detectExerciseType = (name: string): ExerciseType => {
  const lowerName = name.toLowerCase();
  
  // Bodyweight exercises
  const bodyweightKeywords = ["pull-up", "pullup", "push-up", "pushup", "dip", "chin-up", "chinup", "plank", "burpee", "lunge", "squat jump", "mountain climber"];
  if (bodyweightKeywords.some(kw => lowerName.includes(kw))) {
    return "bodyweight";
  }
  
  // Compound exercises
  const compoundKeywords = ["bench press", "squat", "deadlift", "overhead press", "barbell row", "pull-up", "dip", "military press", "clean", "snatch", "leg press", "hip thrust"];
  if (compoundKeywords.some(kw => lowerName.includes(kw))) {
    return "compound";
  }
  
  // Isolation exercises
  const isolationKeywords = ["curl", "extension", "raise", "fly", "flye", "kickback", "pulldown", "pushdown", "shrug", "calf", "ab ", "crunch", "twist"];
  if (isolationKeywords.some(kw => lowerName.includes(kw))) {
    return "isolation";
  }
  
  // Default to compound
  return "compound";
};

/**
 * Generate sample diet plan text for parsing demo
 */
export const sampleDietText = `Breakfast:
- Oats with milk: 300 cal, 12g protein, 45g carbs, 8g fat
- Boiled eggs (3): 210 cal, 18g protein, 2g carbs, 15g fat
- Banana: 105 cal, 1g protein, 27g carbs, 0g fat

Lunch:
- Chicken breast (200g): 330 cal, 62g protein, 0g carbs, 7g fat
- Brown rice (1 cup): 215 cal, 5g protein, 45g carbs, 2g fat
- Mixed veggies: 80 cal, 3g protein, 15g carbs, 1g fat

Dinner:
- Dal (1 bowl): 180 cal, 12g protein, 30g carbs, 2g fat
- Roti (2): 200 cal, 6g protein, 40g carbs, 2g fat
- Paneer (100g): 260 cal, 18g protein, 3g carbs, 20g fat

Snacks:
- Protein shake: 200 cal, 30g protein, 5g carbs, 3g fat
- Almonds (20g): 120 cal, 4g protein, 4g carbs, 10g fat`;

/**
 * Generate sample workout plan text for parsing demo - NEW FORMAT
 */
export const sampleWorkoutText = `Push Day:
- Bench Press: 4 sets, 6-8 reps [compound]
- Overhead Press: 3 sets, 8-10 reps [compound]
- Incline Dumbbell Press: 3x10-12 [compound]
- Lateral Raises: 3x12-15 [isolation]
- Tricep Pushdowns: 3x10-12 [isolation]

Pull Day:
- Deadlift: 3 sets, 5 reps [compound]
- Barbell Row: 4x8-10 [compound]
- Pull-ups: 3xmax [bodyweight]
- Face Pulls: 3x15-20 [isolation]
- Bicep Curls: 3x10-12 [isolation]

Leg Day:
- Squats: 4 sets, 6-8 reps [compound]
- Leg Press: 3x10-12 [compound]
- Romanian Deadlift: 3x8-10 [compound]
- Leg Curls: 3x12-15 [isolation]
- Calf Raises: 4x15-20 [isolation]`;
