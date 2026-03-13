import { FitnessRecord, WeekSummary } from "./types";

export function avg(vals: (number | null)[]): number | null {
  const v = vals.filter((x): x is number => x !== null && x !== undefined);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function pct(cur: number | null, prev: number | null): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / prev) * 100;
}

export function computeWeekSummary(records: FitnessRecord[]): WeekSummary {
  const now = Date.now();
  const MS = 86_400_000;
  const last7 = records.filter(r => (now - new Date(r.date).getTime()) / MS <= 7);
  const prev7 = records.filter(r => {
    const d = (now - new Date(r.date).getTime()) / MS;
    return d > 7 && d <= 14;
  });

  const avgCals  = avg(last7.map(r => r.calories));
  const avgSteps = avg(last7.map(r => r.steps));
  const latestWeight = last7.find(r => r.weight)?.weight ?? null;

  const pAvgCals  = avg(prev7.map(r => r.calories));
  const pAvgSteps = avg(prev7.map(r => r.steps));
  const pWeight   = prev7.find(r => r.weight)?.weight ?? null;

  return {
    avgCalories:   avgCals,
    avgSteps:      avgSteps,
    latestWeight:  latestWeight,
    calTrend:    pct(avgCals,       pAvgCals),
    stepTrend:   pct(avgSteps,      pAvgSteps),
    weightTrend: pct(latestWeight,  pWeight),
  };
}

export function formatNum(n: number | null, decimals = 0): string {
  if (n == null) return "—";
  return decimals > 0
    ? n.toFixed(decimals)
    : Math.round(n).toLocaleString();
}

export function last30Days(records: FitnessRecord[]) {
  return [...records]
    .filter(r => {
      const diff = (Date.now() - new Date(r.date).getTime()) / 86_400_000;
      return diff <= 30;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
