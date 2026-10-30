import { useEffect, useState } from "react";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { setUpAccount, useUid, useUserSettingsQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});

/** Signed-in app chrome: makes sure the account is set up, sends unfinished setups to the quiz, then shows the tabs. */
function AppShell() {
  const uid = useUid();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const settings = useUserSettingsQuery();
  const [setupError, setSetupError] = useState(false);

  useEffect(() => {
    if (!uid || !settings.isSuccess) return;
    // First login (no settings yet) or a device still holding on-device data.
    setSetupError(false);
    setUpAccount(uid, qc).catch((err: unknown) => {
      console.error(err);
      setSetupError(true);
    });
  }, [uid, settings.isSuccess, settings.data === null, qc]); // eslint-disable-line react-hooks/exhaustive-deps

  const needsQuiz = settings.data != null && !settings.data.onboarding.completed;
  useEffect(() => {
    if (needsQuiz) void navigate({ to: "/onboarding", replace: true });
  }, [needsQuiz, navigate]);

  if (setupError || settings.isError) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-foreground">We couldn't load your account</p>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button variant="hero" size="lg" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!settings.data || needsQuiz) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return (
    <>
      {/* Bottom padding keeps the last card clear of the fixed tab bar (bar height + safe area + breathing room). */}
      <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
