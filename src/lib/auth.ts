import { useSyncExternalStore } from "react";
import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Signed-in user, kept in sync with the auth session. `ready` turns true once the session is known. */
interface AuthSnapshot {
  user: User | null;
  ready: boolean;
}

const SERVER_SNAPSHOT: AuthSnapshot = { user: null, ready: false };
let snapshot: AuthSnapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function set(user: User | null) {
  if (snapshot.ready && snapshot.user?.id === user?.id && snapshot.user?.email === user?.email) return;
  snapshot = { user, ready: true };
  listeners.forEach((l) => l());
}

/** Call once from the root. Returns an unsubscribe function. */
export function startAuthListener(onIdentityChange: (event: AuthChangeEvent) => void) {
  void supabase.auth.getSession().then(({ data }) => set(data.session?.user ?? null));
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    set(session?.user ?? null);
    onIdentityChange(event);
  });
  return () => data.subscription.unsubscribe();
}

export function useAuth(): AuthSnapshot {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
}
