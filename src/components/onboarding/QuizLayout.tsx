import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Full-screen quiz page: back button + progress bar, big question, content, pinned footer. */
export function QuizLayout({
  progress,
  onBack,
  title,
  subtitle,
  children,
  footer,
}: {
  progress?: number | undefined;
  onBack?: (() => void) | undefined;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6">
      {progress !== undefined && (
        <header className="sticky top-0 z-20 -mx-6 flex items-center gap-4 bg-background px-6 pb-3 pt-6">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-0"
            disabled={!onBack}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${Math.max(4, progress * 100)}%` }}
            />
          </div>
        </header>
      )}

      <main className="rise-in flex flex-1 flex-col pb-36">
        {title && (
          <h1 className="mt-6 text-[2rem] font-bold leading-[1.1] text-foreground">{title}</h1>
        )}
        {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
        {children}
      </main>

      {footer && (
        <footer className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md bg-gradient-to-t from-background via-background to-transparent px-6 pb-safe pt-8">
          <div className="pb-4">{footer}</div>
        </footer>
      )}
    </div>
  );
}

export function ContinueButton({
  children = "Continue",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "h-14 w-full rounded-full bg-accent font-display text-lg font-bold text-accent-foreground shadow-float transition-[transform,background-color] active:scale-[0.98] disabled:bg-secondary disabled:text-muted-foreground disabled:shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function UnitToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mx-auto grid w-48 grid-cols-2 gap-1 rounded-full bg-secondary p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full py-2 text-sm font-semibold transition-colors",
            value === o.value ? "bg-foreground text-background" : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
