import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionCard({
  icon: Icon,
  label,
  hint,
  selected,
  multi = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  selected: boolean;
  multi?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl border-2 px-4 py-4 text-left transition-[background-color,border-color,transform] active:scale-[0.99]",
        selected ? "border-accent bg-accent/10" : "border-transparent bg-card hover:bg-secondary/60",
      )}
    >
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-full transition-colors",
          selected ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
        )}
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold leading-snug text-foreground">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          "grid size-6 shrink-0 place-items-center border-2 transition-colors",
          multi ? "rounded-lg" : "rounded-full",
          selected ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground/50",
        )}
      >
        {selected &&
          (multi ? (
            <Check className="size-4" strokeWidth={3} />
          ) : (
            <span className="size-2 rounded-full bg-accent-foreground" />
          ))}
      </span>
    </button>
  );
}
