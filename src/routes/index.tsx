import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ChevronRight, Plus, Coffee, Sandwich, UtensilsCrossed, Apple } from "lucide-react";
import { CalorieRing } from "@/components/app/CalorieRing";
import { MacroBar } from "@/components/app/MacroBar";
import { AddFoodDrawer } from "@/components/app/AddFoodDrawer";
import { Button } from "@/components/ui/button";
import { MEALS, sumMacros, type MealType } from "@/lib/nutrition";
import { todayKey, useAppState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Forkcast" },
      { name: "description", content: "Your calories and macros for today at a glance." },
      { property: "og:title", content: "Today — Forkcast" },
      { property: "og:description", content: "Your calories and macros for today at a glance." },
    ],
  }),
  component: Today,
});

const mealIcon: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sandwich,
  dinner: UtensilsCrossed,
  snack: Apple,
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Today() {
  const { entries, targets, settings } = useAppState();
  const today = todayKey();
  const todays = entries.filter((e) => e.date === today);
  const totals = sumMacros(todays);

  return (
    <div className="rise-in">
      <header className="pb-5 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {format(new Date(), "EEEE, d MMMM")}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">
          {greeting()}
          {settings.name ? `, ${settings.name}` : ""}
        </h1>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-ink-foreground shadow-float">
        <div className="flex flex-col items-center">
          <CalorieRing eaten={totals.calories} target={targets.calories} />
          <div className="mt-6 grid w-full grid-cols-2 divide-x divide-ink-foreground/15 text-center">
            <div>
              <p className="font-display text-2xl font-bold tabular">{Math.round(totals.calories).toLocaleString()}</p>
              <p className="text-xs text-ink-foreground/60">eaten</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular">{targets.calories.toLocaleString()}</p>
              <p className="text-xs text-ink-foreground/60">daily target</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-4 rounded-3xl bg-card p-5 shadow-card">
        <MacroBar macro="protein" value={totals.protein} target={targets.protein} />
        <MacroBar macro="carbs" value={totals.carbs} target={targets.carbs} />
        <MacroBar macro="fat" value={totals.fat} target={targets.fat} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Meals</h2>
          <Link to="/log" className="flex items-center text-sm font-medium text-primary">
            Open log <ChevronRight className="size-4" />
          </Link>
        </div>
        <ul className="space-y-2">
          {MEALS.map((m) => {
            const items = todays.filter((e) => e.meal === m.id);
            const kcal = Math.round(sumMacros(items).calories);
            const Icon = mealIcon[m.id];
            return (
              <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary">
                  <Icon className="size-5 text-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{m.label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {items.length ? items.map((i) => i.name).join(", ") : "Nothing logged yet"}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular text-foreground">{kcal} kcal</span>
              </li>
            );
          })}
        </ul>
      </section>

      <AddFoodDrawer
        date={today}
        trigger={
          <Button variant="hero" size="xl" className="mt-6 w-full">
            <Plus /> Log food
          </Button>
        }
      />
    </div>
  );
}
