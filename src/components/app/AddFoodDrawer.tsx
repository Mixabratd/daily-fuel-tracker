import { useEffect, useState, type ReactNode } from "react";
import { ScanBarcode } from "lucide-react";
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
import { MEALS, totalsForGrams, type MealType } from "@/lib/nutrition";
import { useDataActions, useRecentFoods } from "@/lib/data";
import type { LogEntry } from "@/lib/mappers";
import { cn } from "@/lib/utils";
import { MacroDot } from "./MacroBar";

const empty = {
  name: "",
  brand: "",
  grams: "100",
  kcal: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
  sugar: "",
  sodium: "",
};
type Form = typeof empty;

function defaultMealForNow(): MealType {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 16) return "lunch";
  if (h < 21) return "dinner";
  return "snacks";
}

const str = (n: number | null) => (n === null ? "" : String(n));

export function AddFoodDrawer({
  date,
  initialMeal,
  trigger,
}: {
  date: string;
  initialMeal?: MealType;
  trigger: ReactNode;
}) {
  const recents = useRecentFoods();
  const actions = useDataActions();
  const [open, setOpen] = useState(false);
  const [meal, setMeal] = useState<MealType>(initialMeal ?? "snacks");
  const [form, setForm] = useState<Form>(empty);
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setMeal(initialMeal ?? defaultMealForNow());
      setForm(empty);
      setMore(false);
    }
  }, [open, initialMeal]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const num = (v: string) => Math.max(0, Number(v) || 0);
  const opt = (v: string) => (v.trim() === "" ? null : num(v));

  const grams = num(form.grams);
  const per100 = { kcal: num(form.kcal), protein: num(form.protein), carbs: num(form.carbs), fat: num(form.fat) };
  const totals = totalsForGrams(per100, grams);

  const pick = (r: LogEntry) =>
    setForm({
      name: r.name,
      brand: r.brand ?? "",
      grams: String(r.grams),
      kcal: String(r.per100.kcal),
      protein: String(r.per100.protein),
      carbs: String(r.per100.carbs),
      fat: String(r.per100.fat),
      fiber: str(r.per100.fiber),
      sugar: str(r.per100.sugar),
      sodium: str(r.per100.sodium),
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error("Give the food a name");
      return;
    }
    if (!(grams > 0)) {
      toast.error("Enter how many grams you ate");
      return;
    }
    setSaving(true);
    try {
      await actions.addEntry({
        date,
        meal,
        name,
        brand: form.brand,
        grams,
        per100: { ...per100, fiber: opt(form.fiber), sugar: opt(form.sugar), sodium: opt(form.sodium) },
        source: "manual",
      });
      toast.success(`${name} added`);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save that. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof Form, label: string, className?: string) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`f-${k}`} className="text-xs">
        {label}
      </Label>
      <Input
        id={`f-${k}`}
        type="number"
        inputMode="decimal"
        min={0}
        value={form[k]}
        onChange={set(k)}
        placeholder="0"
        className="h-11 rounded-xl bg-card tabular"
      />
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent className="mx-auto max-w-md bg-background">
        <form onSubmit={submit} className="max-h-[80vh] overflow-y-auto px-5 pb-6">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="font-display text-2xl">Add food</DrawerTitle>
            <DrawerDescription>Enter the nutrition per 100 g and how much you ate.</DrawerDescription>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Recent</p>
              <div className="flex flex-wrap gap-2">
                {recents.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => pick(r)}
                    className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                  >
                    {r.name}
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
                  meal === m.id ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="f-name">Food</Label>
              <Input id="f-name" value={form.name} onChange={set("name")} maxLength={120} placeholder="e.g. Greek yogurt" className="h-11 rounded-xl bg-card" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="f-brand" className="text-xs">Brand (optional)</Label>
                <Input id="f-brand" value={form.brand} onChange={set("brand")} maxLength={80} className="h-11 rounded-xl bg-card" />
              </div>
              {field("grams", "Amount (g)")}
            </div>
            <p className="pt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Per 100 g</p>
            <div className="grid grid-cols-4 gap-2">
              {field("kcal", "kcal")}
              {field("protein", "Protein")}
              {field("carbs", "Carbs")}
              {field("fat", "Fat")}
            </div>
            <button type="button" onClick={() => setMore((v) => !v)} className="text-xs font-semibold text-muted-foreground">
              {more ? "Hide" : "More nutrients"} (fibre, sugar, sodium)
            </button>
            {more && (
              <div className="grid grid-cols-3 gap-2">
                {field("fiber", "Fibre (g)")}
                {field("sugar", "Sugar (g)")}
                {field("sodium", "Sodium (mg)")}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between rounded-2xl bg-card p-4 shadow-card">
            <span className="font-display text-xl font-bold tabular text-foreground">{Math.round(totals.calories)} kcal</span>
            <span className="flex gap-3 text-xs text-muted-foreground tabular">
              <span className="flex items-center gap-1"><MacroDot macro="protein" />{totals.protein}g</span>
              <span className="flex items-center gap-1"><MacroDot macro="carbs" />{totals.carbs}g</span>
              <span className="flex items-center gap-1"><MacroDot macro="fat" />{totals.fat}g</span>
            </span>
          </div>

          <Button type="submit" variant="hero" size="xl" className="mt-4 w-full" disabled={saving}>
            Add to {MEALS.find((m) => m.id === meal)?.label}
          </Button>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
