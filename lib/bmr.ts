export type Sex = "male" | "female";
export type GoalDirection = "lose" | "gain";

export interface UserProfile {
  name: string;
  sex: Sex;
  age: number;
  height: number;     // cm
  weight: number;     // kg
  goalWeight: number; // kg
  goalDirection: GoalDirection;
  weeklyRateKg: number;
}

/** Mifflin-St Jeor */
export function calcBMR(p: UserProfile): number {
  const base = 10 * p.weight + 6.25 * p.height - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

/** ~0.04 kcal/step scaled by bodyweight vs 70 kg reference */
export function stepsToKcal(steps: number, weightKg: number): number {
  return steps * (weightKg / 70) * 0.04;
}

/** TDEE = BMR + step calories. Falls back to BMR×1.2 if no steps. */
export function calcTDEE(p: UserProfile, stepsToday: number | null): number {
  const bmr = calcBMR(p);
  if (!stepsToday) return Math.round(bmr * 1.2);
  return Math.round(bmr + stepsToKcal(stepsToday, p.weight));
}

/** Calorie target to hit weekly rate */
export function calcDailyTarget(p: UserProfile, stepsToday: number | null): number {
  const tdee = calcTDEE(p, stepsToday);
  const delta = (p.weeklyRateKg * 7700) / 7;
  return Math.round(p.goalDirection === "lose" ? tdee - delta : tdee + delta);
}

export function calcWeeksToGoal(p: UserProfile): number {
  return Math.abs(p.goalWeight - p.weight) / p.weeklyRateKg;
}

export function calcGoalDate(p: UserProfile): Date {
  const d = new Date();
  d.setDate(d.getDate() + Math.round(calcWeeksToGoal(p) * 7));
  return d;
}
