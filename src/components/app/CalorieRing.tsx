import { cn } from "@/lib/utils";

export function CalorieRing({
  eaten,
  target,
  size = 220,
}: {
  eaten: number;
  target: number;
  size?: number;
}) {
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(eaten / target, 1) : 0;
  const over = eaten > target;
  const remaining = Math.round(target - eaten);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-ink-foreground/15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cn("ring-progress", over ? "stroke-protein" : "stroke-accent")}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-5xl font-bold tabular text-ink-foreground">
          {Math.abs(remaining).toLocaleString()}
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-ink-foreground/60">
          {over ? "kcal over" : "kcal left"}
        </span>
      </div>
    </div>
  );
}
