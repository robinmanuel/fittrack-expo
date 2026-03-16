export interface FitnessRecord {
  id: number;
  date: string;
  calories: number | null;
  steps: number | null;
  weight: number | null;
  created_at: string;
}

export type NewRecord = Omit<FitnessRecord, "id" | "created_at">;

export type Theme = "dark" | "light";

export interface WeekSummary {
  avgCalories: number | null;
  avgSteps: number | null;
  latestWeight: number | null;
  calTrend: number | null;
  stepTrend: number | null;
  weightTrend: number | null;
}

// ── Food entries ──────────────────────────────────────────
export interface FoodEntry {
  id: number;
  date: string;          // YYYY-MM-DD
  name: string;
  cals_per_unit: number; // kcal per unit
  quantity: number;      // e.g. 2.5
  total_cals: number;    // cals_per_unit * quantity
  created_at: string;
}

export type NewFoodEntry = Pick<FoodEntry, "date" | "name" | "cals_per_unit" | "quantity">;

// ── Frequent foods ────────────────────────────────────────
export interface FreqFood {
  id: number;
  name: string;
  cals_per_unit: number;
  use_count: number;
  last_used: string;
}

// ── Exercise entries ──────────────────────────────────────
export interface ExerciseEntry {
  id: number;
  date: string;
  name: string;
  cals_burned: number;
  created_at: string;
}

export type NewExerciseEntry = Pick<ExerciseEntry, "date" | "name" | "cals_burned">;

// ── Frequent exercises ────────────────────────────────────
export interface FreqExercise {
  id: number;
  name: string;
  cals_burned: number;   // last used value as default
  use_count: number;
  last_used: string;
}
