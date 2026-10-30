import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Fit Plate" },
      { name: "description", content: "Choose a new password for your Fit Plate account." },
      { property: "og:title", content: "Set a new password — Fit Plate" },
      { property: "og:description", content: "Choose a new password for your Fit Plate account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [validLink, setValidLink] = useState<boolean | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    void supabase.auth.getSession().then(({ data }) => setValidLink(isRecovery || !!data.session));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    void navigate({ to: "/", replace: true });
  };

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-6 pt-16">
      <h1 className="text-3xl font-bold text-foreground">Set a new password</h1>
      {validLink === false ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This reset link has expired or was already used. Ask for a new one from the sign-in page.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl bg-card"
              placeholder="At least 6 characters"
            />
          </div>
          <Button type="submit" variant="hero" size="xl" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Save password
          </Button>
        </form>
      )}
    </div>
  );
}
