import { cn } from "@/lib/utils";

export type MacroKey = "protein" | "carbs" | "fat";

const fill: Record<MacroKey, string> = {
  protein: "bg-protein",
  carbs: "bg-carbs",
  fat: "bg-fat",
};

export const MACRO_LABEL: Record<MacroKey, string> = {
  protein: "Protein",
  carbs: "Carbs",
  fat: "Fat",
};

export function MacroDot({ macro, className }: { macro: MacroKey; className?: string }) {
  return <span className={cn("inline-block size-2 rounded-full", fill[macro], className)} />;
}

export function MacroBar({ macro, value, target }: { macro: MacroKey; value: number; target: number }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <MacroDot macro={macro} />
          {MACRO_LABEL[macro]}
        </span>
        <span className="text-xs tabular text-muted-foreground">
          <span className="font-semibold text-foreground">{Math.round(value)}</span> / {target}g
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-track">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", fill[macro])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
