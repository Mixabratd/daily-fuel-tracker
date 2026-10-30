import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { MacroDot } from "@/components/app/MacroBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACTIVITY_LEVELS,
  GOALS,
  bmiCategory,
  calcBmi,
  calcBmr,
  calcGoalCalories,
  calcTdee,
  cmToIn,
  inToCm,
  kgToLb,
  lbToKg,
  macrosFromCalories,
  type ActivityLevel,
  type Goal,
  type Macros,
} from "@/lib/nutrition";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings/targets")({
  head: () => ({
    meta: [
      { title: "Targets & calculator — Fit Plate" },
      { name: "description", content: "Set calorie and macro targets and calculate your BMR, TDEE and BMI." },
      { property: "og:title", content: "Targets & calculator — Fit Plate" },
      { property: "og:description", content: "Set calorie and macro targets and calculate your BMR, TDEE and BMI." },
    ],
  }),
  component: TargetsPage,
});

function TargetsPage() {
  const { profile, targets, settings } = useAppState();
  const imperial = settings.units === "imperial";

  const bmr = calcBmr(profile);
  const tdee = calcTdee(profile);
  const suggested = macrosFromCalories(calcGoalCalories(profile));
  const bmi = calcBmi(profile.weightKg, profile.heightCm);

  return (
    <div className="rise-in">
      <Link
        to="/settings"
        className="-mb-4 inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary"
      >
        <ChevronLeft className="size-4" /> Settings
      </Link>
      <PageHeader eyebrow="Settings" title="Targets" />

      <TargetsEditor targets={targets} />

      <section className="mt-6 rounded-3xl bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Calculator className="size-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Calculator</h2>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1">
          {(["male", "female"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => actions.updateProfile({ sex: s })}
              className={cn(
                "rounded-xl py-2 text-sm font-semibold capitalize transition-colors",
                profile.sex === s ? "bg-ink text-ink-foreground" : "text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <NumField
            id="age"
            label="Age"
            value={profile.age}
            onCommit={(v) => actions.updateProfile({ age: v })}
          />
          <NumField
            id="height"
            label={imperial ? "Height (in)" : "Height (cm)"}
            value={imperial ? cmToIn(profile.heightCm) : profile.heightCm}
            onCommit={(v) => actions.updateProfile({ heightCm: imperial ? inToCm(v) : v })}
          />
          <NumField
            id="weight"
            label={imperial ? "Weight (lb)" : "Weight (kg)"}
            value={imperial ? kgToLb(profile.weightKg) : profile.weightKg}
            onCommit={(v) => actions.updateProfile({ weightKg: imperial ? lbToKg(v) : v })}
          />
        </div>

        <div className="mt-3 space-y-1.5">
          <Label>Activity</Label>
          <Select
            value={profile.activity}
            onValueChange={(v) => actions.updateProfile({ activity: v as ActivityLevel })}
          >
            <SelectTrigger className="h-11 rounded-xl bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_LEVELS).map(([k, a]) => (
                <SelectItem key={k} value={k}>
                  {a.label} — {a.hint}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 space-y-1.5">
          <Label>Goal</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(GOALS) as Goal[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => actions.updateProfile({ goal: g })}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors",
                  profile.goal === g
                    ? "border-ink bg-ink text-ink-foreground"
                    : "border-border bg-background text-foreground",
                )}
              >
                {GOALS[g].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric label="BMR" value={bmr.toLocaleString()} unit="kcal" />
          <Metric label="TDEE" value={tdee.toLocaleString()} unit="kcal" />
          <Metric label="BMI" value={bmi.toFixed(1)} unit={bmiCategory(bmi)} />
        </div>

        <div className="mt-4 rounded-2xl bg-ink p-4 text-ink-foreground">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-foreground/60">
            Suggested daily target
          </p>
          <p className="mt-1 font-display text-3xl font-bold tabular">
            {suggested.calories.toLocaleString()} <span className="text-base font-medium">kcal</span>
          </p>
          <p className="mt-1 flex gap-3 text-xs text-ink-foreground/70 tabular">
            <span className="flex items-center gap-1"><MacroDot macro="protein" />{suggested.protein}g P</span>
            <span className="flex items-center gap-1"><MacroDot macro="carbs" />{suggested.carbs}g C</span>
            <span className="flex items-center gap-1"><MacroDot macro="fat" />{suggested.fat}g F</span>
          </p>
          <Button
            variant="hero"
            size="xl"
            className="mt-4 w-full"
            onClick={() => {
              actions.setTargets(suggested);
              toast.success("Targets updated");
            }}
          >
            <Check /> Use these targets
          </Button>
        </div>
      </section>
    </div>
  );
}

function TargetsEditor({ targets }: { targets: Macros }) {
  const [draft, setDraft] = useState(targets);
  useEffect(() => setDraft(targets), [targets]);

  const macroKcal = draft.protein * 4 + draft.carbs * 4 + draft.fat * 9;
  const pct = (g: number, f: number) => (macroKcal > 0 ? Math.round(((g * f) / macroKcal) * 100) : 0);
  const dirty = JSON.stringify(draft) !== JSON.stringify(targets);

  const field = (k: keyof Macros) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [k]: Math.max(0, Math.round(Number(e.target.value) || 0)) }));

  return (
    <section className="rounded-3xl bg-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-bold text-foreground">Daily targets</h2>
      <div className="space-y-1.5">
        <Label htmlFor="t-cal">Calories (kcal)</Label>
        <Input
          id="t-cal"
          type="number"
          inputMode="numeric"
          value={draft.calories || ""}
          onChange={field("calories")}
          className="h-12 rounded-xl bg-background font-display text-2xl font-bold tabular"
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {([
          ["protein", 4],
          ["carbs", 4],
          ["fat", 9],
        ] as const).map(([k, f]) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={`t-${k}`} className="flex items-center gap-1.5 capitalize">
              <MacroDot macro={k} /> {k}
            </Label>
            <Input
              id={`t-${k}`}
              type="number"
              inputMode="numeric"
              value={draft[k] || ""}
              onChange={field(k)}
              className="h-11 rounded-xl bg-background tabular"
            />
            <p className="text-[11px] text-muted-foreground tabular">{pct(draft[k], f)}% of kcal</p>
          </div>
        ))}
      </div>
      {Math.abs(macroKcal - draft.calories) > 50 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Your macros add up to {macroKcal.toLocaleString()} kcal.
        </p>
      )}
      <Button
        variant="ink"
        size="xl"
        className="mt-4 w-full"
        disabled={!dirty}
        onClick={() => {
          actions.setTargets(draft);
          toast.success("Targets saved");
        }}
      >
        Save targets
      </Button>
    </section>
  );
}

function NumField({
  id,
  label,
  value,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  onCommit: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text);
          if (n > 0) onCommit(n);
          else setText(String(value));
        }}
        className="h-11 rounded-xl bg-background tabular"
      />
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{unit}</p>
    </div>
  );
}
