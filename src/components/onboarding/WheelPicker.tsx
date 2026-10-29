import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const ITEM = 48;
const VISIBLE = 5;
const PAD = ITEM * Math.floor(VISIBLE / 2);

/** iOS-style scroll wheel. The centred row is the selected value. */
export function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const idx = Math.max(0, items.findIndex((i) => i.value === value));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = idx * ITEM;
    if (Math.abs(el.scrollTop - target) >= ITEM / 2) el.scrollTop = target;
  }, [idx, items.length]);

  const pick = (i: number) => {
    const next = items[Math.min(items.length - 1, Math.max(0, i))];
    if (next && next.value !== value) onChange(next.value);
  };

  return (
    <div className={cn("relative", className)} style={{ height: ITEM * VISIBLE }}>
      <div
        className="pointer-events-none absolute inset-x-0 rounded-2xl bg-secondary"
        style={{ top: PAD, height: ITEM }}
      />
      <div
        ref={ref}
        role="listbox"
        tabIndex={0}
        aria-label={ariaLabel}
        onScroll={(e) => pick(Math.round(e.currentTarget.scrollTop / ITEM))}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            pick(idx + 1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            pick(idx - 1);
          }
        }}
        className="no-scrollbar fade-y relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div style={{ height: PAD }} />
        {items.map((it, i) => {
          const d = Math.abs(i - idx);
          return (
            <button
              key={String(it.value)}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={i === idx}
              onClick={() => ref.current?.scrollTo({ top: i * ITEM, behavior: "smooth" })}
              className={cn(
                "flex w-full snap-center items-center justify-center font-display tabular transition-[color,font-size]",
                d === 0 && "text-xl font-bold text-foreground",
                d === 1 && "text-lg text-muted-foreground",
                d >= 2 && "text-base text-muted-foreground/50",
              )}
              style={{ height: ITEM }}
            >
              {it.label}
            </button>
          );
        })}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
}
