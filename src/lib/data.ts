// Account data (Lovable Cloud): queries and changes for the signed-in user.
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import {
  entryFromRow,
  entryToInsert,
  legacyEntryToInsert,
  patchToRow,
  userDataAfterQuiz,
  userDataFromRow,
  userDataToRow,
  weightFromRow,
  type LogEntry,
  type NewEntry,
  type UserDataPatch,
} from "./mappers";
import type { Profile } from "./nutrition";
import {
  DEFAULT_USER_DATA,
  dateKey,
  getAppState,
  hasLocalData,
  localActions,
  todayKey,
  type OnboardingState,
  type Settings,
  type UserData,
  type WeightEntry,
} from "./store";

export const keys = {
  settings: (uid: string) => ["settings", uid] as const,
  entries: (uid: string) => ["entries", uid] as const,
  day: (uid: string, date: string) => ["entries", uid, "day", date] as const,
  range: (uid: string, from: string, to: string) => ["entries", uid, "range", from, to] as const,
  recent: (uid: string) => ["entries", uid, "recent"] as const,
  count: (uid: string) => ["entries", uid, "count"] as const,
  weights: (uid: string) => ["weights", uid] as const,
};

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export function useUid(): string {
  return useAuth().user?.id ?? "";
}

async function fetchUserData(uid: string): Promise<UserData | null> {
  const row = check(await supabase.from("user_settings").select("*").eq("user_id", uid).maybeSingle());
  return row ? userDataFromRow(row) : null;
}

/** The settings row; `null` data means this account has no settings yet (first login). */
export function useUserSettingsQuery() {
  const uid = useUid();
  return useQuery({
    queryKey: keys.settings(uid),
    enabled: !!uid,
    queryFn: () => fetchUserData(uid),
  });
}

/** Profile, targets, preferences and quiz answers. The app shell waits for these before rendering a tab. */
export function useUserData(): UserData {
  return useUserSettingsQuery().data ?? DEFAULT_USER_DATA;
}

export function useDayEntries(date: string): LogEntry[] {
  const uid = useUid();
  return (
    useQuery({
      queryKey: keys.day(uid, date),
      enabled: !!uid,
      queryFn: async () =>
        check(
          await supabase
            .from("food_log_entries")
            .select("*")
            .eq("user_id", uid)
            .eq("date", date)
            .order("created_at", { ascending: true }),
        )?.map(entryFromRow) ?? [],
    }).data ?? []
  );
}

/** Entries from `days` days ago up to today (inclusive). */
export function useRecentDaysEntries(days: number): LogEntry[] {
  const uid = useUid();
  const to = todayKey();
  const from = dateKey(subDays(new Date(), days - 1));
  return (
    useQuery({
      queryKey: keys.range(uid, from, to),
      enabled: !!uid,
      queryFn: async () =>
        check(
          await supabase
            .from("food_log_entries")
            .select("*")
            .eq("user_id", uid)
            .gte("date", from)
            .lte("date", to)
            .order("created_at", { ascending: true }),
        )?.map(entryFromRow) ?? [],
    }).data ?? []
  );
}

/** Most recent unique foods, for quick re-logging. */
export function useRecentFoods(limit = 6): LogEntry[] {
  const uid = useUid();
  const rows =
    useQuery({
      queryKey: keys.recent(uid),
      enabled: !!uid,
      queryFn: async () =>
        check(
          await supabase
            .from("food_log_entries")
            .select("*")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(60),
        )?.map(entryFromRow) ?? [],
    }).data ?? [];
  const seen = new Set<string>();
  const out: LogEntry[] = [];
  for (const e of rows) {
    const key = `${e.name.trim().toLowerCase()}|${(e.brand ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
    if (out.length >= limit) break;
  }
  return out;
}

export function useEntryCount(): number {
  const uid = useUid();
  return (
    useQuery({
      queryKey: keys.count(uid),
      enabled: !!uid,
      queryFn: async () => {
        const res = await supabase
          .from("food_log_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid);
        if (res.error) throw new Error(res.error.message);
        return res.count ?? 0;
      },
    }).data ?? 0
  );
}

/** All weigh-ins, oldest first (one per day). */
export function useWeights(): WeightEntry[] {
  const uid = useUid();
  return (
    useQuery({
      queryKey: keys.weights(uid),
      enabled: !!uid,
      queryFn: async () =>
        check(
          await supabase
            .from("weight_entries")
            .select("*")
            .eq("user_id", uid)
            .order("date", { ascending: true }),
        )?.map(weightFromRow) ?? [],
    }).data ?? []
  );
}

/** Make the profile weight follow the latest weigh-in. */
async function syncProfileWeight(uid: string) {
  const latest = check(
    await supabase
      .from("weight_entries")
      .select("weight_kg")
      .eq("user_id", uid)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  if (latest) {
    check(await supabase.from("user_settings").update({ weight_kg: latest.weight_kg }).eq("user_id", uid));
  }
}

async function saveQuiz(
  uid: string,
  input: { profile: Profile; name: string; units: Settings["units"]; answers: Omit<OnboardingState, "completed"> },
) {
  const data = userDataAfterQuiz(input);
  check(await supabase.from("user_settings").upsert(userDataToRow(uid, data), { onConflict: "user_id" }));
  check(
    await supabase
      .from("weight_entries")
      .upsert({ user_id: uid, date: todayKey(), weight_kg: input.profile.weightKg }, { onConflict: "user_id,date" }),
  );
}

export function useDataActions() {
  const qc = useQueryClient();
  const uid = useUid();
  const invalidateEntries = () => qc.invalidateQueries({ queryKey: keys.entries(uid) });
  const invalidateWeights = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.weights(uid) }),
      qc.invalidateQueries({ queryKey: keys.settings(uid) }),
    ]);

  return {
    async addEntry(e: NewEntry) {
      check(await supabase.from("food_log_entries").insert(entryToInsert(uid, e)));
      await invalidateEntries();
    },
    async removeEntry(id: string) {
      check(await supabase.from("food_log_entries").delete().eq("id", id).eq("user_id", uid));
      await invalidateEntries();
    },
    async clearEntries() {
      check(await supabase.from("food_log_entries").delete().eq("user_id", uid));
      await invalidateEntries();
    },
    /** One weigh-in per day (re-logging replaces it); the latest also becomes the profile weight. */
    async logWeight(kg: number, date: string) {
      check(
        await supabase
          .from("weight_entries")
          .upsert({ user_id: uid, date, weight_kg: kg }, { onConflict: "user_id,date" }),
      );
      await syncProfileWeight(uid);
      await invalidateWeights();
    },
    async removeWeight(id: string) {
      check(await supabase.from("weight_entries").delete().eq("id", id).eq("user_id", uid));
      await syncProfileWeight(uid);
      await invalidateWeights();
    },
    /** Saves straight away on screen, then in the account; rolls back if saving fails. */
    async updateUserData(patch: UserDataPatch) {
      const key = keys.settings(uid);
      const prev = qc.getQueryData<UserData | null>(key);
      if (prev) {
        qc.setQueryData<UserData>(key, {
          profile: { ...prev.profile, ...patch.profile },
          targets: patch.targets ?? prev.targets,
          settings: { ...prev.settings, ...patch.settings },
          onboarding: { ...prev.onboarding, ...patch.onboarding },
        });
      }
      try {
        check(await supabase.from("user_settings").update(patchToRow(patch)).eq("user_id", uid));
      } catch (err) {
        qc.setQueryData(key, prev);
        throw err;
      } finally {
        void qc.invalidateQueries({ queryKey: key });
      }
    },
    async completeOnboarding(input: Parameters<typeof saveQuiz>[1]) {
      await saveQuiz(uid, input);
      await Promise.all([invalidateWeights(), invalidateEntries()]);
    },
    /** Delete the food log and weigh-ins, put settings back to defaults and restart the setup quiz. */
    async resetAll() {
      check(await supabase.from("food_log_entries").delete().eq("user_id", uid));
      check(await supabase.from("weight_entries").delete().eq("user_id", uid));
      check(
        await supabase
          .from("user_settings")
          .update(userDataToRow(uid, DEFAULT_USER_DATA))
          .eq("user_id", uid),
      );
      await qc.invalidateQueries();
    },
  };
}

/** Run a change and show a toast for the outcome. */
export function withToast(p: Promise<unknown>, success?: string) {
  return p.then(
    () => {
      if (success) toast.success(success);
    },
    (err: unknown) => {
      console.error(err);
      toast.error("Couldn't save that. Check your connection and try again.");
    },
  );
}

const setupInFlight = new Map<string, Promise<void>>();

/**
 * First login: create the account's settings, moving anything saved on this device
 * (quiz answers, food log, weigh-ins) into the account. Later logins just forget the device copy.
 */
export function setUpAccount(uid: string, qc: QueryClient): Promise<void> {
  const running = setupInFlight.get(uid);
  if (running) return running;
  const job = (async () => {
    const existing = await fetchUserData(uid);
    if (existing) {
      localActions.clear();
      return;
    }
    const local = getAppState();
    const migrate = hasLocalData(local);
    const data: UserData = migrate
      ? { profile: local.profile, targets: local.targets, settings: local.settings, onboarding: local.onboarding }
      : DEFAULT_USER_DATA;

    const created = await supabase.from("user_settings").insert(userDataToRow(uid, data));
    if (created.error) {
      // Another tab got there first.
      if ((created.error as { code?: string }).code === "23505") return;
      throw new Error(created.error.message);
    }

    if (migrate) {
      const entries = local.entries.map((e) => legacyEntryToInsert(uid, e));
      for (let i = 0; i < entries.length; i += 500) {
        check(await supabase.from("food_log_entries").insert(entries.slice(i, i + 500)));
      }
      if (local.weights.length) {
        check(
          await supabase.from("weight_entries").upsert(
            local.weights.map((w) => ({
              user_id: uid,
              date: w.date,
              weight_kg: w.kg,
              created_at: new Date(w.createdAt || Date.now()).toISOString(),
            })),
            { onConflict: "user_id,date" },
          ),
        );
      }
      toast.success("Your saved data is now in your account");
    }
    localActions.clear();
  })().finally(() => {
    setupInFlight.delete(uid);
    void qc.invalidateQueries();
  });
  setupInFlight.set(uid, job);
  return job;
}
