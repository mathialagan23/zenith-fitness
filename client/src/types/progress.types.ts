// Measurements type
export interface Measurements {
  chest?: number;
  waist?: number;
  arms?: number;
  thighs?: number;
}

// Progress entry
export interface ProgressEntry {
  _id: string;
  userId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  measurements?: Measurements;
  notes?: string;
  createdAt: string;
}

// Progress input data
export interface LogProgressData {
  date?: string;
  weight: number;
  bodyFat?: number;
  measurements?: Measurements;
  notes?: string;
}

// Weight chart data point
export interface WeightDataPoint {
  date: string;
  weight: number;
  label: string;
}

// Aggregated progress summary (from backend)
export interface ProgressSummary {
  currentWeight: number;
  startingWeight: number;
  lowestWeight: number;
  highestWeight: number;
  changeFromStart: number;
  percentChangeFromStart: number; // % vs starting weight
  totalWeightLost: number; // positive kg lost since start (0 if gained)
  previousWeekWeight: number | null;
  changeFromPreviousWeek: number | null;
  percentChangeFromPreviousWeek: number | null;
}
