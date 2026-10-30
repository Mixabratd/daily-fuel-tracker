import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { addDays, format, isToday, isYesterday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { AddFoodDrawer } from "@/components/app/AddFoodDrawer";
import { MacroDot } from "@/components/app/MacroBar";
import { Button } from "@/components/ui/button";
import { MEALS, sumMacros } from "@/lib/nutrition";
import { actions, dateKey, todayKey, useAppState } from "@/lib/store";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Food log — Fit Plate" },
      { name: "description", content: "Log breakfast, lunch, dinner and snacks with calories and macros." },
      { property: "og:title", content: "Food log — Fit Plate" },
      { property: "og:description", content: "Log breakfast, lunch, dinner and snacks with calories and macros." },
    ],
  }),
  component: LogPage,
});

function dayLabel(key: string) {
  const d = parseISO(key);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, d MMM");
}

function LogPage() {
  const { entries, targets } = useAppState();
  const [date, setDate] = useState(todayKey());
  const dayEntries = entries.filter((e) => e.date === date);
  const totals = sumMacros(dayEntries);
  const shift = (n: number) => setDate(dateKey(addDays(parseISO(date), n)));
  const isTodaySelected = date === todayKey();

  return (
    <div className="rise-in">
      <PageHeader eyebrow="Food log" title={dayLabel(date)} />

      <div className="flex items-center justify-between rounded-2xl bg-card p-1.5 shadow-card">
        <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Previous day" className="rounded-xl">
          <ChevronLeft />
        </Button>
        <button
          type="button"
          onClick={() => setDate(todayKey())}
          className="text-sm font-semibold text-foreground"
        >
          {format(parseISO(date), "d MMMM yyyy")}
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => shift(1)}
          disabled={isTodaySelected}
          aria-label="Next day"
          className="rounded-xl"
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-ink p-4 text-center text-ink-foreground">
        <Stat label={`of ${targets.calories} kcal`} value={totals.calories} sub="" />
        <Stat label="protein" value={totals.protein} sub="g" macro="protein" />
        <Stat label="carbs" value={totals.carbs} sub="g" macro="carbs" />
        <Stat label="fat" value={totals.fat} sub="g" macro="fat" />
      </div>

      <div className="mt-6 space-y-5">
        {MEALS.map((m) => {
          const items = dayEntries.filter((e) => e.meal === m.id);
          const kcal = Math.round(sumMacros(items).calories);
          return (
            <section key={m.id}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">
                  {m.label}
                  <span className="ml-2 text-sm font-medium text-muted-foreground tabular">{kcal} kcal</span>
                </h2>
                <AddFoodDrawer
                  date={date}
                  initialMeal={m.id}
                  trigger={
                    <Button variant="soft" size="sm" className="rounded-full" aria-label={`Add to ${m.label}`}>
                      <Plus /> Add
                    </Button>
                  }
                />
              </div>
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-input px-4 py-4 text-sm text-muted-foreground">
                  No food logged.
                </p>
              ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-2xl bg-card shadow-card">
                  {items.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{e.name}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground tabular">
                          {e.serving && <span>{e.serving} ·</span>}
                          <span className="flex items-center gap-1"><MacroDot macro="protein" />{e.protein}g</span>
                          <span className="flex items-center gap-1"><MacroDot macro="carbs" />{e.carbs}g</span>
                          <span className="flex items-center gap-1"><MacroDot macro="fat" />{e.fat}g</span>
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular text-foreground">{e.calories}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => actions.removeEntry(e.id)}
                        aria-label={`Remove ${e.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  macro,
}: {
  label: string;
  value: number;
  sub: string;
  macro?: "protein" | "carbs" | "fat";
}) {
  return (
    <div>
      <p className="font-display text-xl font-bold tabular">
        {Math.round(value)}
        <span className="ml-0.5 text-xs font-medium text-ink-foreground/50">{sub}</span>
      </p>
      <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-ink-foreground/60">
        {macro && <MacroDot macro={macro} />}
        {label}
      </p>
    </div>
  );
}
