export interface FitnessRecord {
  id: number;
  date: string;        // YYYY-MM-DD
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
  calTrend: number | null;   // % change vs prev week
  stepTrend: number | null;
  weightTrend: number | null;
}
