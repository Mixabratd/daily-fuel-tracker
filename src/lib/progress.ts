// Pure progress math (7-day calories, weight change). No React, no storage.
import { format, subDays } from "date-fns";

export interface DatedCalories {
  date: string; // yyyy-MM-dd
  calories: number;
}

export interface WeighIn {
  date: string; // yyyy-MM-dd
  kg: number;
  createdAt: number;
}

/** The last `n` day keys ending with `today`, oldest first. */
export function lastNDays(today: Date, n = 7): string[] {
  return Array.from({ length: n }, (_, i) => format(subDays(today, n - 1 - i), "yyyy-MM-dd"));
}

/** Total calories per day for the given day keys. */
export function dailyCalories(entries: DatedCalories[], days: string[]): DatedCalories[] {
  const totals = new Map(days.map((d) => [d, 0]));
  for (const e of entries) {
    if (totals.has(e.date)) totals.set(e.date, (totals.get(e.date) ?? 0) + e.calories);
  }
  return days.map((date) => ({ date, calories: Math.round(totals.get(date) ?? 0) }));
}

/** Average calories over the days that have food logged; empty days are skipped. */
export function averageCalories(days: DatedCalories[]): { average: number; loggedDays: number } {
  const logged = days.filter((d) => d.calories > 0);
  if (!logged.length) return { average: 0, loggedDays: 0 };
  const sum = logged.reduce((a, d) => a + d.calories, 0);
  return { average: Math.round(sum / logged.length), loggedDays: logged.length };
}

export function sortWeighIns<T extends WeighIn>(weights: T[]): T[] {
  return [...weights].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
}

/** Starting (first) weigh-in vs current (latest) weigh-in. */
export function weightProgress(weights: WeighIn[]) {
  if (!weights.length) return null;
  const sorted = sortWeighIns(weights);
  const start = sorted[0]!;
  const current = sorted[sorted.length - 1]!;
  return {
    startKg: start.kg,
    startDate: start.date,
    currentKg: current.kg,
    currentDate: current.date,
    changeKg: Math.round((current.kg - start.kg) * 10) / 10,
  };
}
