// Pure conversions between database rows and app shapes. No React, no network — safe to unit test.
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import {
  calcGoalCalories,
  macrosFromCalories,
  totalsForGrams,
  type ActivityLevel,
  type Goal,
  type Macros,
  type MealType,
  type Per100,
  type Profile,
  type Sex,
} from "./nutrition";
import type { LegacyFoodEntry, OnboardingState, Settings, UserData, WeightEntry } from "./store";

type SettingsRow = Tables<"user_settings">;
type EntryRow = Tables<"food_log_entries">;
type WeightRow = Tables<"weight_entries">;

export type FoodSource = "manual" | "search" | "barcode" | "ai_estimate";

export interface FullPer100 extends Per100 {
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
}

/** A food log entry as screens use it; calories/protein/carbs/fat are the totals for `grams`. */
export interface LogEntry extends Macros {
  id: string;
  date: string;
  meal: MealType;
  name: string;
  brand: string | null;
  barcode: string | null;
  grams: number;
  per100: FullPer100;
  source: FoodSource;
  createdAt: number;
}

export interface NewEntry {
  date: string;
  meal: MealType;
  name: string;
  brand?: string | null | undefined;
  barcode?: string | null | undefined;
  grams: number;
  per100: Per100 & { fiber?: number | null; sugar?: number | null; sodium?: number | null };
  source: FoodSource;
}

const MEAL_IDS: MealType[] = ["breakfast", "lunch", "dinner", "snacks"];

/** Older entries used "snack"; anything unknown lands in Snacks. */
export function normalizeMeal(meal: string): MealType {
  return (MEAL_IDS as string[]).includes(meal) ? (meal as MealType) : "snacks";
}

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const optNum = (v: unknown) => (v === null || v === undefined ? null : num(v));

export function entryFromRow(r: EntryRow): LogEntry {
  return {
    id: r.id,
    date: r.date,
    meal: normalizeMeal(r.meal),
    name: r.name,
    brand: r.brand,
    barcode: r.barcode,
    grams: num(r.grams, 100),
    per100: {
      kcal: num(r.kcal_per_100g),
      protein: num(r.protein_per_100g),
      carbs: num(r.carbs_per_100g),
      fat: num(r.fat_per_100g),
      fiber: optNum(r.fiber_per_100g),
      sugar: optNum(r.sugar_per_100g),
      sodium: optNum(r.sodium_per_100g),
    },
    calories: num(r.total_kcal),
    protein: num(r.total_protein),
    carbs: num(r.total_carbs),
    fat: num(r.total_fat),
    source: r.source as FoodSource,
    createdAt: Date.parse(r.created_at) || 0,
  };
}

export function entryToInsert(userId: string, e: NewEntry): TablesInsert<"food_log_entries"> {
  const totals = totalsForGrams(e.per100, e.grams);
  return {
    user_id: userId,
    date: e.date,
    meal: e.meal,
    name: e.name.trim().slice(0, 120),
    brand: e.brand?.trim() ? e.brand.trim().slice(0, 80) : null,
    barcode: e.barcode?.trim() ? e.barcode.trim().slice(0, 32) : null,
    grams: e.grams,
    kcal_per_100g: e.per100.kcal,
    protein_per_100g: e.per100.protein,
    carbs_per_100g: e.per100.carbs,
    fat_per_100g: e.per100.fat,
    fiber_per_100g: e.per100.fiber ?? null,
    sugar_per_100g: e.per100.sugar ?? null,
    sodium_per_100g: e.per100.sodium ?? null,
    total_kcal: totals.calories,
    total_protein: totals.protein,
    total_carbs: totals.carbs,
    total_fat: totals.fat,
    source: e.source,
  };
}

/** On-device entries only stored totals, so they move over as one 100 g portion of those totals. */
export function legacyEntryToInsert(userId: string, e: LegacyFoodEntry): TablesInsert<"food_log_entries"> {
  const safe = (v: number) => Math.max(0, num(v));
  return {
    ...entryToInsert(userId, {
      date: e.date,
      meal: normalizeMeal(e.meal),
      name: e.name.trim() || "Food",
      barcode: e.barcode ?? null,
      grams: 100,
      per100: { kcal: safe(e.calories), protein: safe(e.protein), carbs: safe(e.carbs), fat: safe(e.fat) },
      source: "manual",
    }),
    created_at: new Date(e.createdAt || Date.now()).toISOString(),
  };
}

export function weightFromRow(r: WeightRow): WeightEntry {
  return { id: r.id, date: r.date, kg: num(r.weight_kg), createdAt: Date.parse(r.created_at) || 0 };
}

export function userDataFromRow(r: SettingsRow): UserData {
  const profile: Profile = {
    sex: r.sex as Sex,
    age: r.age,
    heightCm: num(r.height_cm),
    weightKg: num(r.weight_kg),
    activity: r.activity as ActivityLevel,
    goal: r.goal as Goal,
    paceKg: r.pace_kg === null ? undefined : num(r.pace_kg),
    targetWeightKg: r.target_weight_kg === null ? undefined : num(r.target_weight_kg),
  };
  return {
    profile,
    targets: {
      calories: r.target_calories,
      protein: r.target_protein,
      carbs: r.target_carbs,
      fat: r.target_fat,
    },
    settings: { name: r.name, units: r.units === "imperial" ? "imperial" : "metric" },
    onboarding: {
      completed: r.onboarding_completed,
      birthDate: r.birth_date ?? undefined,
      diet: r.diet ?? undefined,
      obstacles: r.obstacles ?? [],
      aims: r.aims ?? [],
    },
  };
}

export interface UserDataPatch {
  profile?: Partial<Profile>;
  targets?: Macros;
  settings?: Partial<Settings>;
  onboarding?: Partial<OnboardingState>;
}

const int = (n: number) => Math.max(0, Math.round(num(n)));

/** Only the columns named in the patch; missing fields stay as they are. */
export function patchToRow(p: UserDataPatch): TablesUpdate<"user_settings"> {
  const row: TablesUpdate<"user_settings"> = {};
  const pr = p.profile;
  if (pr) {
    if (pr.sex !== undefined) row.sex = pr.sex;
    if (pr.age !== undefined) row.age = Math.round(pr.age);
    if (pr.heightCm !== undefined) row.height_cm = pr.heightCm;
    if (pr.weightKg !== undefined) row.weight_kg = pr.weightKg;
    if (pr.activity !== undefined) row.activity = pr.activity;
    if (pr.goal !== undefined) row.goal = pr.goal;
    if ("paceKg" in pr) row.pace_kg = pr.paceKg ?? null;
    if ("targetWeightKg" in pr) row.target_weight_kg = pr.targetWeightKg ?? null;
  }
  if (p.targets) {
    row.target_calories = int(p.targets.calories);
    row.target_protein = int(p.targets.protein);
    row.target_carbs = int(p.targets.carbs);
    row.target_fat = int(p.targets.fat);
  }
  if (p.settings) {
    if (p.settings.name !== undefined) row.name = p.settings.name.trim().slice(0, 40);
    if (p.settings.units !== undefined) row.units = p.settings.units;
  }
  const o = p.onboarding;
  if (o) {
    if (o.completed !== undefined) row.onboarding_completed = o.completed;
    if ("birthDate" in o) row.birth_date = o.birthDate ?? null;
    if ("diet" in o) row.diet = o.diet ?? null;
    if (o.obstacles !== undefined) row.obstacles = o.obstacles;
    if (o.aims !== undefined) row.aims = o.aims;
  }
  return row;
}

/** A complete settings row for a person. */
export function userDataToRow(userId: string, d: UserData): TablesInsert<"user_settings"> {
  return {
    user_id: userId,
    ...patchToRow({
      profile: { ...d.profile, paceKg: d.profile.paceKg, targetWeightKg: d.profile.targetWeightKg },
      targets: d.targets,
      settings: d.settings,
      onboarding: {
        ...d.onboarding,
        birthDate: d.onboarding.birthDate,
        diet: d.onboarding.diet,
      },
    }),
  };
}

/** Settings after finishing the setup quiz: targets follow the new profile. */
export function userDataAfterQuiz(input: {
  profile: Profile;
  name: string;
  units: Settings["units"];
  answers: Omit<OnboardingState, "completed">;
}): UserData {
  return {
    profile: input.profile,
    targets: macrosFromCalories(calcGoalCalories(input.profile)),
    settings: { name: input.name, units: input.units },
    onboarding: { ...input.answers, completed: true },
  };
}
