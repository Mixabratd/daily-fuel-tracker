// Pure nutrition math. No React, no storage — safe to unit test.

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose" | "maintain" | "gain";
export type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  /** Chosen weekly change in kg (set in the setup quiz). Without it the fixed GOALS delta applies. */
  paceKg?: number | undefined;
  /** Goal weight from the setup quiz. */
  targetWeightKg?: number | undefined;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ACTIVITY_LEVELS: Record<ActivityLevel, { label: string; hint: string; factor: number }> = {
  sedentary: { label: "Sedentary", hint: "Desk job, little exercise", factor: 1.2 },
  light: { label: "Light", hint: "Exercise 1–3 days/week", factor: 1.375 },
  moderate: { label: "Moderate", hint: "Exercise 3–5 days/week", factor: 1.55 },
  active: { label: "Active", hint: "Exercise 6–7 days/week", factor: 1.725 },
  very_active: { label: "Very active", hint: "Physical job or 2× daily", factor: 1.9 },
};

export const GOALS: Record<Goal, { label: string; delta: number }> = {
  lose: { label: "Lose weight", delta: -500 },
  maintain: { label: "Maintain", delta: 0 },
  gain: { label: "Build muscle", delta: 300 },
};

export const MEALS: { id: MealType; label: string }[] = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "snacks", label: "Snacks" },
];

/** Default macro split (share of calories). */
export const DEFAULT_SPLIT = { protein: 0.3, carbs: 0.4, fat: 0.3 };

export const MIN_CALORIES = 1200;

/** Basal metabolic rate, Mifflin–St Jeor. */
export function calcBmr(p: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(base + (p.sex === "male" ? 5 : -161));
}

/** Total daily energy expenditure. */
export function calcTdee(p: Profile): number {
  return Math.round(calcBmr(p) * ACTIVITY_LEVELS[p.activity].factor);
}

/** Energy in one kg of body weight, used to turn a weekly pace into a daily calorie change. */
export const KCAL_PER_KG = 7700;

/** Allowed weekly pace (kg) per goal, with the "recommended" band shown in the quiz. */
export const PACE_RANGES: Record<Exclude<Goal, "maintain">, {
  min: number;
  max: number;
  default: number;
  recMin: number;
  recMax: number;
}> = {
  lose: { min: 0.1, max: 1.5, default: 0.5, recMin: 0.4, recMax: 0.8 },
  gain: { min: 0.1, max: 1.0, default: 0.3, recMin: 0.2, recMax: 0.5 },
};

export type PaceLabel = "slow" | "recommended" | "fast";

export function paceLabel(goal: Exclude<Goal, "maintain">, paceKg: number): PaceLabel {
  const r = PACE_RANGES[goal];
  if (paceKg < r.recMin) return "slow";
  if (paceKg > r.recMax) return "fast";
  return "recommended";
}

/** Daily calorie change for the goal: from the weekly pace when set, otherwise the fixed GOALS delta. */
export function goalDelta(p: Pick<Profile, "goal" | "paceKg">): number {
  if (p.goal === "maintain") return 0;
  if (p.paceKg && p.paceKg > 0) {
    const daily = Math.round((p.paceKg * KCAL_PER_KG) / 7);
    return p.goal === "lose" ? -daily : daily;
  }
  return GOALS[p.goal].delta;
}

/** Calorie target for the chosen goal, never below MIN_CALORIES. */
export function calcGoalCalories(p: Profile): number {
  return Math.max(MIN_CALORIES, calcTdee(p) + goalDelta(p));
}

/** Whole weeks needed to move from current to target weight at the given weekly pace. */
export function weeksToGoal(currentKg: number, targetKg: number, paceKg: number): number {
  if (paceKg <= 0) return 0;
  return Math.ceil(Math.round(Math.abs(currentKg - targetKg) * 10) / 10 / paceKg);
}

/** Age in full years on `today`. */
export function ageOn(birth: Date, today: Date): number {
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/** Grams of each macro for a calorie budget and split. */
export function macrosFromCalories(calories: number, split = DEFAULT_SPLIT): Macros {
  return {
    calories: Math.round(calories),
    protein: Math.round((calories * split.protein) / 4),
    carbs: Math.round((calories * split.carbs) / 4),
    fat: Math.round((calories * split.fat) / 9),
  };
}

export function calcBmi(weightKg: number, heightCm: number): number {
  if (!weightKg || !heightCm) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number): string {
  if (bmi <= 0) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/** Nutrition per 100 g of a food. */
export interface Per100 {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Totals for an amount in grams, from per-100 g values, rounded to 0.1. */
export function totalsForGrams(per100: Per100, grams: number): Macros {
  const f = grams > 0 ? grams / 100 : 0;
  return {
    calories: round1(per100.kcal * f),
    protein: round1(per100.protein * f),
    carbs: round1(per100.carbs * f),
    fat: round1(per100.fat * f),
  };
}

export function sumMacros(items: Macros[]): Macros {
  return items.reduce(
    (acc, i) => ({
      calories: acc.calories + i.calories,
      protein: acc.protein + i.protein,
      carbs: acc.carbs + i.carbs,
      fat: acc.fat + i.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// Unit conversion — data is always stored metric.
export const kgToLb = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
export const lbToKg = (lb: number) => Math.round((lb / 2.20462) * 10) / 10;
export const cmToIn = (cm: number) => Math.round((cm / 2.54) * 10) / 10;
export const inToCm = (inch: number) => Math.round(inch * 2.54 * 10) / 10;
