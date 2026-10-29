import { useEffect, useState, type ReactNode } from "react";
import { ScanBarcode, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEALS, type MealType } from "@/lib/nutrition";
import { actions, recentFoods, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MacroDot } from "./MacroBar";

const empty = { name: "", serving: "", calories: "", protein: "", carbs: "", fat: "" };

function defaultMealForNow(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snack";
}

export function AddFoodDrawer({
  date,
  initialMeal,
  trigger,
}: {
  date: string;
  initialMeal?: MealType;
  trigger: ReactNode;
}) {
  const { entries } = useAppState();
  const [open, setOpen] = useState(false);
  const [meal, setMeal] = useState<MealType>(initialMeal ?? "snack");
  const [form, setForm] = useState(empty);
  const recents = recentFoods(entries);

  useEffect(() => {
    if (open) {
      setMeal(initialMeal ?? defaultMealForNow());
      setForm(empty);
    }
  }, [open, initialMeal]);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const num = (v: string) => Math.max(0, Number(v) || 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Give the food a name");
      return;
    }
    actions.addEntry({
      date,
      meal,
      name: form.name.trim(),
      serving: form.serving.trim() || undefined,
      calories: num(form.calories),
      protein: num(form.protein),
      carbs: num(form.carbs),
      fat: num(form.fat),
    });
    toast.success(`${form.name.trim()} added`);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="mx-auto max-w-md bg-background">
        <form onSubmit={submit} className="max-h-[80vh] overflow-y-auto px-5 pb-6">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="font-display text-2xl">Add food</DrawerTitle>
            <DrawerDescription>Enter it by hand or pick something you've eaten before.</DrawerDescription>
          </DrawerHeader>

          <button
            type="button"
            disabled
            className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-dashed border-input bg-card p-4 text-left opacity-80"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-secondary">
              <ScanBarcode className="size-5 text-muted-foreground" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-foreground">Scan a barcode</span>
              <span className="block text-xs text-muted-foreground">Use your camera to look up food</span>
            </span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              Soon
            </span>
          </button>

          {recents.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {recents.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        name: r.name,
                        serving: r.serving ?? "",
                        calories: String(r.calories),
                        protein: String(r.protein),
                        carbs: String(r.carbs),
                        fat: String(r.fat),
                      })
                    }
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    {r.name} · {r.calories}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 grid grid-cols-4 gap-1 rounded-2xl bg-secondary p-1">
            {MEALS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMeal(m.id)}
                className={cn(
                  "rounded-xl py-2 text-xs font-semibold transition-colors",
                  meal === m.id ? "bg-ink text-ink-foreground" : "text-muted-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="food-name">Food</Label>
                <Input id="food-name" placeholder="Greek yogurt" value={form.name} onChange={set("name")} className="h-11 rounded-xl bg-card" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="food-serving">Serving</Label>
                <Input id="food-serving" placeholder="150 g" value={form.serving} onChange={set("serving")} className="h-11 rounded-xl bg-card" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="food-cal">Calories</Label>
              <Input id="food-cal" type="number" inputMode="decimal" placeholder="0" value={form.calories} onChange={set("calories")} className="h-11 rounded-xl bg-card text-lg font-semibold tabular" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["protein", "carbs", "fat"] as const).map((k) => (
                <div key={k} className="space-y-1.5">
                  <Label htmlFor={`food-${k}`} className="flex items-center gap-1.5 capitalize">
                    <MacroDot macro={k} /> {k[0].toUpperCase() + k.slice(1)} (g)
                  </Label>
                  <Input id={`food-${k}`} type="number" inputMode="decimal" placeholder="0" value={form[k]} onChange={set(k)} className="h-11 rounded-xl bg-card tabular" />
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" variant="ink" size="xl" className="mt-6 w-full">
            <Plus /> Add to {MEALS.find((m) => m.id === meal)?.label}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
