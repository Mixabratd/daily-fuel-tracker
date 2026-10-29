import { useEffect, useRef } from "react";

const PX = 10; // pixels per step

/** Horizontal scrolling ruler, like a bathroom-scale dial. Value sits under the centre marker. */
export function RulerPicker({
  min,
  max,
  step,
  value,
  onChange,
  majorEvery = 10,
  ariaLabel,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  majorEvery?: number;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const count = Math.round((max - min) / step);
  const decimals = (String(step).split(".")[1] ?? "").length;
  const clampIndex = (i: number) => Math.min(count, Math.max(0, i));
  const indexOf = (v: number) => clampIndex(Math.round((v - min) / step));
  const valueAt = (i: number) => Number((min + clampIndex(i) * step).toFixed(decimals));

  // Follow outside changes (keyboard, unit switch) without fighting the user's own scrolling.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = indexOf(value) * PX;
    if (Math.abs(el.scrollLeft - target) >= PX / 2) el.scrollLeft = target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max, step]);

  const labels: number[] = [];
  for (let i = 0; i <= count; i += majorEvery) labels.push(i);

  return (
    <div className="relative">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onScroll={(e) => {
          const v = valueAt(Math.round(e.currentTarget.scrollLeft / PX));
          if (v !== value) onChange(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(valueAt(indexOf(value) - 1));
          } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(valueAt(indexOf(value) + 1));
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current) e.currentTarget.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="no-scrollbar fade-x flex cursor-grab touch-pan-x select-none overflow-x-auto overscroll-x-contain rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <div className="w-1/2 shrink-0" />
        <div
          className="relative h-20 shrink-0"
          style={{
            width: count * PX + 2,
            backgroundImage: [
              `repeating-linear-gradient(to right, var(--foreground) 0 2px, transparent 2px ${PX * majorEvery}px)`,
              `repeating-linear-gradient(to right, var(--muted-foreground) 0 1.5px, transparent 1.5px ${(PX * majorEvery) / 2}px)`,
              `repeating-linear-gradient(to right, color-mix(in oklab, var(--muted-foreground) 55%, transparent) 0 1px, transparent 1px ${PX}px)`,
            ].join(","),
            backgroundSize: "100% 48px, 100% 34px, 100% 22px",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "left top",
          }}
        >
          {labels.map((i) => (
            <span
              key={i}
              className="absolute bottom-1 -translate-x-1/2 text-xs font-medium text-muted-foreground tabular"
              style={{ left: i * PX + 1 }}
            >
              {Math.round(valueAt(i))}
            </span>
          ))}
        </div>
        <div className="w-1/2 shrink-0" />
      </div>
      <div className="pointer-events-none absolute -top-2 left-1/2 h-16 w-1 -translate-x-1/2 rounded-full bg-accent" />
    </div>
  );
}
