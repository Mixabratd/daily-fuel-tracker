import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Illustrative chart: steady tracking vs. a crash diet that rebounds. No real data. */
export function TrackChart() {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <p className="font-display text-lg font-bold text-foreground">Your weight</p>
      <svg viewBox="0 0 300 150" className="mt-3 w-full" role="img" aria-label="Fit Plate keeps weight going down; a crash diet bounces back">
        <defs>
          <linearGradient id="fp-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="10" x2="290" y1="22" y2="22" stroke="var(--border)" strokeDasharray="3 5" />
        <line x1="10" x2="290" y1="75" y2="75" stroke="var(--border)" strokeDasharray="3 5" />
        <line x1="10" x2="290" y1="128" y2="128" stroke="var(--border)" />
        <path d="M14 22 C 90 22, 120 30, 160 80 S 240 128, 286 128 L 286 128 L 14 128 Z" fill="url(#fp-fill)" />
        <path
          d="M14 22 C 60 24, 80 90, 115 92 S 200 20, 286 10"
          fill="none"
          stroke="var(--destructive)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M14 22 C 90 22, 120 30, 160 80 S 240 128, 286 128"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="14" cy="22" r="5" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2" />
        <circle cx="286" cy="128" r="5" fill="var(--background)" stroke="var(--accent)" strokeWidth="2.5" />
        <text x="286" y="34" textAnchor="end" fontSize="11" fill="var(--destructive)">Crash diet</text>
        <text x="20" y="120" fontSize="11" fontWeight="700" fill="var(--accent)">Fit Plate</text>
      </svg>
      <div className="mt-1 flex justify-between text-sm text-muted-foreground">
        <span>Month 1</span>
        <span>Month 6</span>
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Small, steady calorie deficits are easier to stick with — so the weight stays off.
      </p>
    </div>
  );
}

const BUILD_STEPS = ["Calories", "Protein", "Carbs", "Fat", "Goal date"];

/** "Creating your plan" screen; calls onDone after the short animation. */
export function BuildingPlan({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const started = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(100, Math.round(((t - started) / 2400) * 100));
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (pct < 100) return;
    const t = setTimeout(onDone, 450);
    return () => clearTimeout(t);
  }, [pct, onDone]);

  const done = Math.floor((pct / 100) * BUILD_STEPS.length);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <p className="font-display text-7xl font-bold text-foreground tabular">{pct}%</p>
      <h1 className="mt-3 text-[2rem] font-bold leading-tight text-foreground">
        We're setting everything up for you
      </h1>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-8 rounded-3xl bg-card p-5 shadow-card">
        <p className="font-semibold text-foreground">Daily recommendation for</p>
        <ul className="mt-3 space-y-2.5">
          {BUILD_STEPS.map((s, i) => (
            <li key={s} className="flex items-center justify-between text-muted-foreground">
              <span className={cn(i < done && "text-foreground")}>• {s}</span>
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full transition-colors",
                  i < done ? "bg-accent text-accent-foreground" : "bg-secondary",
                )}
              >
                {i < done && <Check className="size-3" strokeWidth={3} />}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Small ring tile for the plan summary. `share` is 0–1. */
export function PlanTile({
  label,
  value,
  unit,
  share,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  share: number;
  color: string;
}) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="rounded-3xl bg-card p-4 shadow-card">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <div className="relative mx-auto mt-3 size-20">
        <svg viewBox="0 0 72 72" className="size-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--track)" strokeWidth="7" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - share)}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-center font-display text-lg font-bold leading-none text-foreground tabular">
          <span>
            {value.toLocaleString()}
            <span className="block text-[10px] font-medium text-muted-foreground">{unit}</span>
          </span>
        </span>
      </div>
    </div>
  );
}
