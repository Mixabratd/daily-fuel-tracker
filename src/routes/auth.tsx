import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { getAppState } from "@/lib/store";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signin" | "signup" | undefined; from?: "quiz" | undefined } => ({
    mode: s["mode"] === "signin" || s["mode"] === "signup" ? s["mode"] : undefined,
    from: s["from"] === "quiz" ? "quiz" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Fit Plate" },
      { name: "description", content: "Sign in to Fit Plate to keep your food log, weigh-ins and targets on every device." },
      { property: "og:title", content: "Sign in — Fit Plate" },
      { property: "og:description", content: "Sign in to Fit Plate to keep your food log, weigh-ins and targets on every device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const fromQuiz = search.from === "quiz";
  const [mode, setMode] = useState<Mode>(search.mode ?? (fromQuiz ? "signup" : "signin"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<{ email: string; kind: "confirm" | "reset" } | null>(null);

  // Signed in: go to the app. Brand-new visitor: start with the setup quiz.
  useEffect(() => {
    if (!ready) return;
    if (user) {
      void navigate({ to: "/", replace: true });
      return;
    }
    if (!search.mode && !fromQuiz && !getAppState().onboarding.completed) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [ready, user, search.mode, fromQuiz, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) {
      toast.error("Enter your email");
      return;
    }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(addr, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSentTo({ email: addr, kind: "reset" });
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: addr,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) setSentTo({ email: addr, kind: "confirm" });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: addr, password });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "lovable") => {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message || "Sign-in failed");
  };

  if (sentTo) {
    return (
      <Shell>
        <div className="rise-in mt-10 rounded-3xl bg-card p-6 text-center shadow-card">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary">
            <MailCheck className="size-6 text-accent" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sentTo.kind === "confirm"
              ? `We sent a confirmation link to ${sentTo.email}. Open it on this device to finish signing up${fromQuiz ? " and save your plan" : ""}.`
              : `We sent a link to ${sentTo.email} to set a new password.`}
          </p>
          <Button
            variant="soft"
            size="lg"
            className="mt-6 w-full rounded-xl"
            onClick={() => {
              setSentTo(null);
              setMode("signin");
            }}
          >
            Back to sign in
          </Button>
        </div>
      </Shell>
    );
  }

  const title =
    mode === "signup" ? (fromQuiz ? "Save your plan" : "Create your account") : mode === "forgot" ? "Reset password" : "Welcome back";
  const subtitle =
    mode === "signup"
      ? "Create an account so your food log and targets follow you to any device."
      : mode === "forgot"
        ? "Enter your email and we'll send you a reset link."
        : "Sign in to see today's calories and your log.";

  return (
    <Shell>
      <div className="rise-in">
        <h1 className="mt-10 text-3xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

        {mode !== "forgot" && (
          <div className="mt-8 space-y-3">
            <Button
              type="button"
              variant="soft"
              size="xl"
              className="w-full rounded-2xl shadow-card"
              onClick={() => void social("google")}
            >
              <GoogleMark /> Continue with Google
            </Button>
            <button type="button" className="lovable-auth-button w-full" onClick={() => void social("lovable")}>
              Continue with Lovable
            </button>
            <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        )}

        <form onSubmit={submit} className={mode === "forgot" ? "mt-8 space-y-4" : "space-y-4"}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-card"
              placeholder="you@example.com"
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs text-muted-foreground hover:text-foreground">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-card"
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
              />
            </div>
          )}
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button type="button" className="font-semibold text-foreground" onClick={() => setMode("signin")}>
                Sign in
              </button>
            </>
          ) : mode === "forgot" ? (
            <button type="button" className="font-semibold text-foreground" onClick={() => setMode("signin")}>
              Back to sign in
            </button>
          ) : (
            <>
              New to Fit Plate?{" "}
              <button type="button" className="font-semibold text-foreground" onClick={() => setMode("signup")}>
                Create an account
              </button>
            </>
          )}
        </p>
        {mode === "signin" && !getAppState().onboarding.completed && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            or{" "}
            <Link to="/onboarding" className="font-semibold text-accent">
              take the 1-minute setup first
            </Link>
          </p>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-6 pb-10 pt-8">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground">
          <UtensilsCrossed className="size-4" strokeWidth={2.5} />
        </span>
        <span className="font-display text-lg font-bold text-foreground">Fit Plate</span>
      </div>
      {children}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}
