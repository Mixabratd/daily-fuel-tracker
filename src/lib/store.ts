import { useSyncExternalStore } from "react";
import { format } from "date-fns";
import type { Macros, MealType, Profile } from "./nutrition";
import { calcGoalCalories, macrosFromCalories } from "./nutrition";
import { sortWeighIns, type WeighIn } from "./progress";

export interface FoodEntry extends Macros {
  id: string;
  date: string; // yyyy-MM-dd (local)
  meal: MealType;
  name: string;
  serving?: string | undefined;
  barcode?: string | undefined; // reserved for the barcode scanner
  createdAt: number;
}

export interface Settings {
  name: string;
  units: "metric" | "imperial";
}

export interface WeightEntry extends WeighIn {
  id: string;
}

export interface AppState {
  version: 1;
  entries: FoodEntry[];
  weights: WeightEntry[];
  profile: Profile;
  targets: Macros;
  settings: Settings;
}

const STORAGE_KEY = "forkcast:v1";

const defaultProfile: Profile = {
  sex: "male",
  age: 30,
  heightCm: 178,
  weightKg: 78,
  activity: "moderate",
  goal: "maintain",
};

export const DEFAULT_STATE: AppState = {
  version: 1,
  entries: [],
  weights: [],
  profile: defaultProfile,
  targets: macrosFromCalories(calcGoalCalories(defaultProfile)),
  settings: { name: "", units: "metric" },
};

let state: AppState = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      state = {
        ...DEFAULT_STATE,
        ...parsed,
        profile: { ...DEFAULT_STATE.profile, ...parsed.profile },
        targets: { ...DEFAULT_STATE.targets, ...parsed.targets },
        settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
      };
    }
  } catch {
    state = DEFAULT_STATE;
  }
}

function setState(updater: (s: AppState) => AppState) {
  load();
  state = updater(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  load();
  return state;
}

// Server render + first hydration pass use defaults; the client then swaps in saved data.
function getServerSnapshot() {
  return DEFAULT_STATE;
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const todayKey = () => format(new Date(), "yyyy-MM-dd");
export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const actions = {
  addEntry(entry: Omit<FoodEntry, "id" | "createdAt">) {
    setState((s) => ({
      ...s,
      entries: [...s.entries, { ...entry, id: uid(), createdAt: Date.now() }],
    }));
  },
  removeEntry(id: string) {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  },
  /** One weigh-in per day (re-logging replaces it); the latest also becomes the profile weight. */
  logWeight(kg: number, date: string) {
    setState((s) => {
      const weights = sortWeighIns([
        ...s.weights.filter((w) => w.date !== date),
        { id: uid(), date, kg, createdAt: Date.now() },
      ]);
      return { ...s, weights, profile: { ...s.profile, weightKg: weights[weights.length - 1]!.kg } };
    });
  },
  removeWeight(id: string) {
    setState((s) => {
      const weights = s.weights.filter((w) => w.id !== id);
      const latest = weights[weights.length - 1];
      return { ...s, weights, profile: latest ? { ...s.profile, weightKg: latest.kg } : s.profile };
    });
  },
  updateProfile(patch: Partial<Profile>) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  },
  setTargets(targets: Macros) {
    setState((s) => ({ ...s, targets }));
  },
  updateSettings(patch: Partial<Settings>) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },
  clearEntries() {
    setState((s) => ({ ...s, entries: [] }));
  },
  resetAll() {
    setState(() => DEFAULT_STATE);
  },
};

/** Most recent unique foods, for quick re-logging. */
export function recentFoods(entries: FoodEntry[], limit = 6): FoodEntry[] {
  const seen = new Set<string>();
  const out: FoodEntry[] = [];
  for (const e of [...entries].sort((a, b) => b.createdAt - a.createdAt)) {
    const key = e.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}
