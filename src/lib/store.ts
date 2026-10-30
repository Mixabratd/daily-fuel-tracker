import { useSyncExternalStore } from "react";
import { format } from "date-fns";
import type { Macros, Profile } from "./nutrition";
import { calcGoalCalories, macrosFromCalories } from "./nutrition";
import { sortWeighIns, type WeighIn } from "./progress";

/**
 * On-device state, used only before someone signs in:
 * the setup quiz saves here, and the first login moves it into their account.
 * Older versions of the app also kept the food log and weigh-ins here.
 */

/** Food entry as the on-device version of the app stored it. */
export interface LegacyFoodEntry extends Macros {
  id: string;
  date: string; // yyyy-MM-dd (local)
  meal: string; // "breakfast" | "lunch" | "dinner" | "snack" | "snacks"
  name: string;
  serving?: string | undefined;
  barcode?: string | undefined;
  createdAt: number;
}

export interface Settings {
  name: string;
  units: "metric" | "imperial";
}

export interface WeightEntry extends WeighIn {
  id: string;
}

/** Answers from the first-run setup quiz that aren't part of the calorie maths. */
export interface OnboardingState {
  completed: boolean;
  birthDate?: string | undefined; // yyyy-MM-dd
  diet?: string | undefined;
  obstacles: string[];
  aims: string[];
}

/** Everything about a person that isn't the food log or weigh-ins. */
export interface UserData {
  profile: Profile;
  targets: Macros;
  settings: Settings;
  onboarding: OnboardingState;
}

export interface AppState extends UserData {
  version: 1;
  entries: LegacyFoodEntry[];
  weights: WeightEntry[];
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
  onboarding: { completed: false, obstacles: [], aims: [] },
};

export const DEFAULT_USER_DATA: UserData = {
  profile: DEFAULT_STATE.profile,
  targets: DEFAULT_STATE.targets,
  settings: DEFAULT_STATE.settings,
  onboarding: DEFAULT_STATE.onboarding,
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
        onboarding: { ...DEFAULT_STATE.onboarding, ...parsed.onboarding },
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

function getServerSnapshot() {
  return DEFAULT_STATE;
}

/** Current on-device state, for effects that must not rely on the hydration snapshot. */
export function getAppState(): AppState {
  return getSnapshot();
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** True when this device holds anything worth moving into an account. */
export function hasLocalData(s: AppState): boolean {
  return s.onboarding.completed || s.entries.length > 0 || s.weights.length > 0;
}

export const todayKey = () => format(new Date(), "yyyy-MM-dd");
export const dateKey = (d: Date) => format(d, "yyyy-MM-dd");

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const localActions = {
  /** Finish the setup quiz while signed out: keep the answers here until the first login. */
  completeOnboarding(input: {
    profile: Profile;
    name: string;
    units: Settings["units"];
    answers: Omit<OnboardingState, "completed">;
  }) {
    setState((s) => {
      const date = todayKey();
      const weights = sortWeighIns([
        ...s.weights.filter((w) => w.date !== date),
        { id: uid(), date, kg: input.profile.weightKg, createdAt: Date.now() },
      ]);
      return {
        ...s,
        profile: input.profile,
        targets: macrosFromCalories(calcGoalCalories(input.profile)),
        settings: { ...s.settings, name: input.name, units: input.units },
        onboarding: { ...input.answers, completed: true },
        weights,
      };
    });
  },
  /** Forget everything on this device (after it has moved into an account). */
  clear() {
    setState(() => DEFAULT_STATE);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};
