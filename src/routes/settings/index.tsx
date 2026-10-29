import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ChevronRight, Ruler, Target, Trash2, RotateCcw, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { actions, useAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Forkcast" },
      { name: "description", content: "Your targets, calculator, units, scanner and data settings." },
      { property: "og:title", content: "Settings — Forkcast" },
      { property: "og:description", content: "Your targets, calculator, units, scanner and data settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings, entries, weights, targets } = useAppState();
  const [name, setName] = useState(settings.name);
  useEffect(() => setName(settings.name), [settings.name]);

  return (
    <div className="rise-in space-y-6">
      <PageHeader eyebrow="Preferences" title="Settings" />

      <Group title="Plan">
        <Link to="/settings/targets" className="block transition-colors hover:bg-secondary/50">
          <Row
            icon={Target}
            label="Targets & calculator"
            hint={`${targets.calories.toLocaleString()} kcal · ${targets.protein}P ${targets.carbs}C ${targets.fat}F`}
          >
            <ChevronRight className="size-5 text-muted-foreground" />
          </Row>
        </Link>
      </Group>

      <Group title="Profile">
        <Row icon={User} label="Your name">
          <Input
            value={name}
            placeholder="Add name"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() !== settings.name) {
                actions.updateSettings({ name: name.trim() });
                toast.success("Name saved");
              }
            }}
            className="h-9 w-36 rounded-lg bg-background text-right"
          />
        </Row>
        <Row icon={Ruler} label="Units">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            {(["metric", "imperial"] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => actions.updateSettings({ units: u })}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  settings.units === u ? "bg-ink text-ink-foreground" : "text-muted-foreground",
                )}
              >
                {u}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group title="Scanner">
        <Row icon={Camera} label="Barcode scanner" hint="Scan packaged food with your camera">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
            Soon
          </span>
        </Row>
      </Group>

      <Group title="Data">
        <Row icon={Trash2} label="Clear food log" hint={`${entries.length} ${entries.length === 1 ? "entry" : "entries"} saved on this device`}>
          <Confirm
            title="Clear your food log?"
            description="All logged food will be removed. Your targets and weigh-ins stay as they are."
            confirmLabel="Clear log"
            onConfirm={() => {
              actions.clearEntries();
              toast.success("Food log cleared");
            }}
          >
            <Button variant="soft" size="sm" className="rounded-lg">Clear</Button>
          </Confirm>
        </Row>
        <Row icon={RotateCcw} label="Reset everything" hint={`Food log, ${weights.length} weigh-ins, targets and preferences`}>
          <Confirm
            title="Reset the whole app?"
            description="This removes everything and starts fresh. It can't be undone."
            confirmLabel="Reset"
            onConfirm={() => {
              actions.resetAll();
              toast.success("App reset");
            }}
          >
            <Button variant="destructive" size="sm" className="rounded-lg">Reset</Button>
          </Confirm>
        </Row>
      </Group>

      <p className="pt-2 text-center text-xs text-muted-foreground">Forkcast · v0.1 · Data is stored on this device</p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-3xl bg-card shadow-card">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof User;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid size-9 place-items-center rounded-xl bg-secondary">
        <Icon className="size-4 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Confirm({
  title,
  description,
  confirmLabel,
  onConfirm,
  children,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  children: React.ReactNode;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
