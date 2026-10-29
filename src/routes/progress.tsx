import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Scale, Trash2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { kgToLb, lbToKg } from "@/lib/nutrition";
import { averageCalories, dailyCalories, lastNDays, weightProgress } from "@/lib/progress";
import { actions, todayKey, useAppState, type WeightEntry } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Fit Plate" },
      { name: "description", content: "Your 7-day average calories and weight change since you started." },
      { property: "og:title", content: "Progress — Fit Plate" },
      { property: "og:description", content: "Your 7-day average calories and weight change since you started." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  return (
    <div className="rise-in">
      <PageHeader eyebrow="Your trend" title="Progress" />
      <WeekCard />
      <WeightCard />
    </div>
  );
}

function WeekCard() {
  const { entries, targets } = useAppState();
  const days = dailyCalories(entries, lastNDays(new Date(), 7));
  const { average, loggedDays } = averageCalories(days);
  const today = todayKey();
  const scale = Math.max(targets.calories, ...days.map((d) => d.calories), 1) * 1.1;
  const diff = average - targets.calories;
  const targetPct = (targets.calories / scale) * 100;

  return (
    <section className="rounded-3xl bg-ink p-5 text-ink-foreground shadow-float">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-foreground/60">7-day average</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-5xl font-bold tabular">{average.toLocaleString()}</span>
        <span className="text-sm font-medium text-ink-foreground/70">kcal / day</span>
      </div>
      <p className="mt-1 text-xs text-ink-foreground/70">
        {loggedDays === 0
          ? "Log food to see your weekly average."
          : `${Math.abs(diff).toLocaleString()} kcal ${diff > 0 ? "over" : "under"} your ${targets.calories.toLocaleString()} target · ${loggedDays} of 7 days logged`}
      </p>

      <div className="relative mt-6 h-36">
        <div
          className="absolute inset-x-0 border-t border-dashed border-ink-foreground/35"
          style={{ bottom: `${targetPct}%` }}
        >
          <span className="absolute -top-4 right-0 text-[10px] font-medium text-ink-foreground/60">target</span>
        </div>
        <div className="absolute inset-0 grid grid-cols-7 items-end gap-2">
          {days.map((d) => (
            <div key={d.date} className="flex h-full items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-7 rounded-lg transition-[height] duration-700 ease-out",
                  d.calories > targets.calories ? "bg-protein" : "bg-accent",
                  d.date !== today && "opacity-75",
                  d.calories === 0 && "bg-ink-foreground/15 opacity-100",
                )}
                style={{ height: d.calories ? `${(d.calories / scale) * 100}%` : "4px" }}
                title={`${d.calories} kcal`}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[11px] font-medium">
        {days.map((d) => (
          <span key={d.date} className={d.date === today ? "text-accent" : "text-ink-foreground/60"}>
            {format(parseISO(d.date), "EEEEE")}
          </span>
        ))}
      </div>
    </section>
  );
}

function WeightCard() {
  const { weights, profile, settings } = useAppState();
  const imperial = settings.units === "imperial";
  const unit = imperial ? "lb" : "kg";
  const show = (kg: number) => (imperial ? kgToLb(kg) : Math.round(kg * 10) / 10);
  const progress = weightProgress(weights);

  const [text, setText] = useState("");
  useEffect(() => setText(String(show(profile.weightKg))), [profile.weightKg, imperial]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    const n = Number(text);
    if (!(n > 0)) {
      toast.error("Enter your weight");
      return;
    }
    actions.logWeight(imperial ? lbToKg(n) : Math.round(n * 10) / 10, todayKey());
    toast.success("Weigh-in saved");
  };

  const change = progress ? show(progress.currentKg) - show(progress.startKg) : 0;
  const changeRounded = Math.round(change * 10) / 10;
  const ChangeIcon = changeRounded < 0 ? TrendingDown : changeRounded > 0 ? TrendingUp : Minus;

  return (
    <section className="mt-4 rounded-3xl bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center gap-2">
        <Scale className="size-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Weight</h2>
      </div>

      {progress ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Start" value={show(progress.startKg)} unit={unit} sub={format(parseISO(progress.startDate), "d MMM")} />
            <Stat label="Now" value={show(progress.currentKg)} unit={unit} sub={format(parseISO(progress.currentDate), "d MMM")} />
            <div className="rounded-2xl bg-ink p-3 text-center text-ink-foreground">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-foreground/60">Change</p>
              <p className="mt-1 flex items-center justify-center gap-1 font-display text-lg font-bold tabular">
                <ChangeIcon className="size-4 text-accent" />
                {changeRounded > 0 ? "+" : ""}
                {changeRounded}
              </p>
              <p className="text-[11px] text-ink-foreground/60">{unit}</p>
            </div>
          </div>
          {weights.length >= 2 && <Sparkline weights={weights} />}
        </>
      ) : (
        <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
          Log your first weigh-in to set your starting weight.
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Input
            aria-label={`Today's weight in ${unit}`}
            type="number"
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="h-12 rounded-xl bg-background pr-10 font-display text-lg font-bold tabular"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>
        </div>
        <Button variant="hero" size="xl" onClick={save}>
          Save today
        </Button>
      </div>

      {weights.length > 0 && (
        <ul className="mt-4 divide-y divide-border">
          {[...weights].reverse().slice(0, 5).map((w) => (
            <li key={w.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-muted-foreground">{format(parseISO(w.date), "EEE, d MMM")}</span>
              <span className="flex items-center gap-3">
                <span className="font-semibold tabular text-foreground">
                  {show(w.kg)} {unit}
                </span>
                <button
                  type="button"
                  aria-label="Delete weigh-in"
                  onClick={() => actions.removeWeight(w.id)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value, unit, sub }: { label: string; value: number; unit: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-secondary p-3 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular text-foreground">
        {value} <span className="text-xs font-medium text-muted-foreground">{unit}</span>
      </p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Sparkline({ weights }: { weights: WeightEntry[] }) {
  const w = 300;
  const h = 64;
  const kgs = weights.map((x) => x.kg);
  const min = Math.min(...kgs);
  const max = Math.max(...kgs);
  const range = max - min || 1;
  const points = kgs.map((kg, i) => [
    (i / (kgs.length - 1)) * (w - 8) + 4,
    h - 6 - ((kg - min) / range) * (h - 12),
  ]);
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x!.toFixed(1)},${y!.toFixed(1)}`).join(" ");
  const last = points[points.length - 1]!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-16 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="stroke-primary" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={4} className="fill-accent" />
    </svg>
  );
}
