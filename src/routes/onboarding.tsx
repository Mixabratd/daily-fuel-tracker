import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { addWeeks, format, getDaysInMonth } from "date-fns";
import {
  Apple,
  BicepsFlexed,
  Bike,
  CalendarDays,
  Carrot,
  ChartNoAxesColumn,
  Dumbbell,
  Drumstick,
  Egg,
  Fish,
  Flame,
  Footprints,
  Handshake,
  Leaf,
  Lightbulb,
  Mars,
  Minus,
  Plus,
  Rabbit,
  Salad,
  Sandwich,
  Scale,
  Smile,
  Sofa,
  Soup,
  Sprout,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Turtle,
  UtensilsCrossed,
  Venus,
  Zap,
  Beef,
  Check,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import plateImg from "@/assets/onboarding-plate.jpg";
import { ContinueButton, QuizLayout, UnitToggle } from "@/components/onboarding/QuizLayout";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { RulerPicker } from "@/components/onboarding/RulerPicker";
import { WheelPicker } from "@/components/onboarding/WheelPicker";
import { BuildingPlan, PlanTile, TrackChart } from "@/components/onboarding/visuals";
import { Input } from "@/components/ui/input";
import {
  PACE_RANGES,
  ageOn,
  calcGoalCalories,
  cmToIn,
  inToCm,
  kgToLb,
  lbToKg,
  macrosFromCalories,
  paceLabel,
  weeksToGoal,
  type ActivityLevel,
  type Goal,
  type Profile,
  type Sex,
} from "@/lib/nutrition";
import { actions, getAppState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Get started — Fit Plate" },
      { name: "description", content: "Answer a few quick questions and Fit Plate builds your daily calorie and macro plan." },
      { property: "og:title", content: "Get started — Fit Plate" },
      { property: "og:description", content: "Answer a few quick questions and Fit Plate builds your daily calorie and macro plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

type Units = "metric" | "imperial";

/** Quiz answers. Height/weights are kept in the unit on screen and converted to metric when saved. */
interface Answers {
  name: string;
  sex?: Sex | undefined;
  activity?: ActivityLevel | undefined;
  units: Units;
  height: number; // cm, or total inches when imperial
  weight: number; // kg or lb
  targetWeight: number; // kg or lb
  birth: { y: number; m: number; d: number };
  goal?: Goal | undefined;
  paceKg: number;
  obstacles: string[];
  diet?: string | undefined;
  aims: string[];
}

type StepId =
  | "welcome"
  | "name"
  | "sex"
  | "activity"
  | "height"
  | "weight"
  | "birthday"
  | "goal"
  | "target"
  | "pace"
  | "why"
  | "obstacles"
  | "diet"
  | "aims"
  | "building"
  | "plan";

const ALL_STEPS: StepId[] = [
  "welcome",
  "name",
  "sex",
  "activity",
  "height",
  "weight",
  "birthday",
  "goal",
  "target",
  "pace",
  "why",
  "obstacles",
  "diet",
  "aims",
  "building",
  "plan",
];

const NO_HEADER: StepId[] = ["welcome", "building", "plan"];

const THIS_YEAR = new Date().getFullYear();

function defaultAnswers(): Answers {
  return {
    name: "",
    units: "metric",
    height: 170,
    weight: 70,
    targetWeight: 65,
    birth: { y: THIS_YEAR - 25, m: 0, d: 1 },
    paceKg: PACE_RANGES.lose.default,
    obstacles: [],
    aims: [],
  };
}

/** Pre-fill from saved data when someone retakes the quiz. */
function answersFromState(): Answers | null {
  const s = getAppState();
  if (!s.onboarding.completed) return null;
  const imperial = s.settings.units === "imperial";
  const p = s.profile;
  const b = s.onboarding.birthDate?.split("-").map(Number);
  const target = p.targetWeightKg ?? p.weightKg;
  return {
    name: s.settings.name,
    sex: p.sex,
    activity: p.activity,
    units: s.settings.units,
    height: imperial ? Math.round(cmToIn(p.heightCm)) : Math.round(p.heightCm),
    weight: imperial ? kgToLb(p.weightKg) : p.weightKg,
    targetWeight: imperial ? kgToLb(target) : target,
    birth: b && b.length === 3 ? { y: b[0]!, m: b[1]! - 1, d: b[2]! } : { y: THIS_YEAR - p.age, m: 0, d: 1 },
    goal: p.goal,
    paceKg: p.paceKg ?? (p.goal === "gain" ? PACE_RANGES.gain.default : PACE_RANGES.lose.default),
    obstacles: s.onboarding.obstacles,
    diet: s.onboarding.diet,
    aims: s.onboarding.aims,
  };
}

const toKg = (a: Answers, v: number) => (a.units === "imperial" ? lbToKg(v) : v);
const round1 = (n: number) => Math.round(n * 10) / 10;

function toProfile(a: Answers): Profile {
  const moving = a.goal === "lose" || a.goal === "gain";
  return {
    sex: a.sex ?? "male",
    age: ageOn(new Date(a.birth.y, a.birth.m, a.birth.d), new Date()),
    heightCm: a.units === "imperial" ? Math.round(inToCm(a.height)) : a.height,
    weightKg: toKg(a, a.weight),
    activity: a.activity ?? "moderate",
    goal: a.goal ?? "maintain",
    paceKg: moving ? a.paceKg : undefined,
    targetWeightKg: moving ? toKg(a, a.targetWeight) : undefined,
  };
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>(defaultAnswers);
  const [stepId, setStepId] = useState<StepId>("welcome");

  useEffect(() => {
    const saved = answersFromState();
    if (saved) setAnswers(saved);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stepId]);

  const set = (patch: Partial<Answers>) => setAnswers((a) => ({ ...a, ...patch }));

  const steps = useMemo(
    () =>
      ALL_STEPS.filter((id) => {
        if ((id === "target" || id === "pace") && (answers.goal === "maintain" || !answers.goal)) return false;
        if (id === "why" && answers.goal !== "lose") return false;
        return true;
      }),
    [answers.goal],
  );
  const quizSteps = steps.filter((s) => !NO_HEADER.includes(s));
  const pos = steps.indexOf(stepId);
  const go = useCallback(
    (delta: number) => setStepId((cur) => steps[Math.min(steps.length - 1, Math.max(0, steps.indexOf(cur) + delta))]!),
    [steps],
  );
  const next = useCallback(() => go(1), [go]);
  const back = () => go(-1);
  const progress = (quizSteps.indexOf(stepId) + 1) / quizSteps.length;

  const imperial = answers.units === "imperial";
  const wUnit = imperial ? "lb" : "kg";

  const switchUnits = (u: Units) => {
    if (u === answers.units) return;
    setAnswers((a) =>
      u === "imperial"
        ? {
            ...a,
            units: u,
            height: Math.round(cmToIn(a.height)),
            weight: kgToLb(a.weight),
            targetWeight: kgToLb(a.targetWeight),
          }
        : {
            ...a,
            units: u,
            height: Math.round(inToCm(a.height)),
            weight: lbToKg(a.weight),
            targetWeight: lbToKg(a.targetWeight),
          },
    );
  };

  const finish = () => {
    const profile = toProfile(answers);
    const { y, m, d } = answers.birth;
    actions.completeOnboarding({
      profile,
      name: answers.name.trim().slice(0, 40),
      units: answers.units,
      answers: {
        birthDate: format(new Date(y, m, d), "yyyy-MM-dd"),
        diet: answers.diet,
        obstacles: answers.obstacles,
        aims: answers.aims,
      },
    });
    toast.success("Your plan is saved");
    void navigate({ to: "/" });
  };

  const layout = (props: {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    children: React.ReactNode;
    canContinue?: boolean;
    continueLabel?: string;
  }) => (
    <QuizLayout
      key={stepId}
      progress={progress}
      onBack={pos > 0 ? back : undefined}
      title={props.title}
      subtitle={props.subtitle}
      footer={
        <ContinueButton disabled={props.canContinue === false} onClick={next}>
          {props.continueLabel ?? "Continue"}
        </ContinueButton>
      }
    >
      {props.children}
    </QuizLayout>
  );

  switch (stepId) {
    case "welcome":
      return <Welcome onStart={next} />;

    case "name":
      return layout({
        title: "What should we call you?",
        subtitle: "We'll use it to personalise your plan.",
        continueLabel: answers.name.trim() ? "Continue" : "Skip",
        children: (
          <div className="mt-10">
            <Input
              autoFocus
              value={answers.name}
              maxLength={40}
              placeholder="Your first name"
              aria-label="Your first name"
              onChange={(e) => set({ name: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && next()}
              className="h-16 rounded-2xl border-0 bg-card px-5 font-display text-2xl font-semibold"
            />
          </div>
        ),
      });

    case "sex":
      return layout({
        title: "Choose your gender",
        subtitle: "This will be used to calibrate your custom plan.",
        canContinue: !!answers.sex,
        children: (
          <Options>
            {(
              [
                ["male", "Male", Mars],
                ["female", "Female", Venus],
              ] as const
            ).map(([v, label, icon]) => (
              <OptionCard key={v} icon={icon} label={label} selected={answers.sex === v} onClick={() => set({ sex: v })} />
            ))}
          </Options>
        ),
      });

    case "activity":
      return layout({
        title: "How often do you work out?",
        subtitle: "This helps us estimate how many calories you burn each day.",
        canContinue: !!answers.activity,
        children: (
          <Options>
            {ACTIVITY_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                icon={o.icon}
                label={o.label}
                hint={o.hint}
                selected={answers.activity === o.value}
                onClick={() => set({ activity: o.value })}
              />
            ))}
          </Options>
        ),
      });

    case "height":
      return layout({
        title: "How tall are you?",
        subtitle: "This will be taken into account when calculating your daily nutrition goals.",
        children: (
          <div className="mt-8 space-y-10">
            <UnitToggle
              options={[
                { value: "imperial", label: "ft / in" },
                { value: "metric", label: "cm" },
              ]}
              value={answers.units}
              onChange={switchUnits}
            />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Height</p>
              <p className="font-display text-5xl font-bold text-foreground tabular">
                {imperial ? `${Math.floor(answers.height / 12)}′ ${answers.height % 12}″` : answers.height}
                {!imperial && <span className="ml-1 text-xl font-semibold">cm</span>}
              </p>
            </div>
            {imperial ? (
              <div className="flex gap-3">
                <WheelPicker
                  className="flex-1"
                  ariaLabel="Feet"
                  items={FEET}
                  value={Math.floor(answers.height / 12)}
                  onChange={(ft) => set({ height: Math.min(95, Math.max(48, ft * 12 + (answers.height % 12))) })}
                />
                <WheelPicker
                  className="flex-1"
                  ariaLabel="Inches"
                  items={INCHES}
                  value={answers.height % 12}
                  onChange={(inch) => set({ height: Math.min(95, Math.max(48, Math.floor(answers.height / 12) * 12 + inch)) })}
                />
              </div>
            ) : (
              <WheelPicker
                className="mx-auto w-40"
                ariaLabel="Height in centimetres"
                items={CENTIMETRES}
                value={answers.height}
                onChange={(cm) => set({ height: cm })}
              />
            )}
          </div>
        ),
      });

    case "weight":
      return layout({
        title: "What is your weight?",
        subtitle: "This will be taken into account when calculating your daily nutrition goals.",
        children: (
          <div className="mt-8 space-y-12">
            <UnitToggle
              options={[
                { value: "imperial", label: "lb" },
                { value: "metric", label: "kg" },
              ]}
              value={answers.units}
              onChange={switchUnits}
            />
            <WeightDial
              label="Current weight"
              value={answers.weight}
              unit={wUnit}
              imperial={imperial}
              onChange={(v) => set({ weight: v })}
            />
          </div>
        ),
      });

    case "birthday": {
      const days = getDaysInMonth(new Date(answers.birth.y, answers.birth.m, 1));
      const setBirth = (patch: Partial<Answers["birth"]>) =>
        setAnswers((a) => {
          const b = { ...a.birth, ...patch };
          const max = getDaysInMonth(new Date(b.y, b.m, 1));
          return { ...a, birth: { ...b, d: Math.min(b.d, max) } };
        });
      return layout({
        title: "When were you born?",
        subtitle: "This will be taken into account when calculating your daily nutrition goals.",
        children: (
          <div className="mt-12 flex gap-2">
            <WheelPicker
              className="flex-[1.6]"
              ariaLabel="Month"
              items={MONTHS}
              value={answers.birth.m}
              onChange={(m) => setBirth({ m })}
            />
            <WheelPicker
              className="flex-1"
              ariaLabel="Day"
              items={Array.from({ length: days }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, "0") }))}
              value={answers.birth.d}
              onChange={(d) => setBirth({ d })}
            />
            <WheelPicker
              className="flex-[1.2]"
              ariaLabel="Year"
              items={YEARS}
              value={answers.birth.y}
              onChange={(y) => setBirth({ y })}
            />
          </div>
        ),
      });
    }

    case "goal":
      return layout({
        title: "What is your goal?",
        subtitle: "This helps us generate a plan for your calorie intake.",
        canContinue: !!answers.goal,
        children: (
          <Options>
            {GOAL_OPTIONS.map((o) => (
              <OptionCard
                key={o.value}
                icon={o.icon}
                label={o.label}
                hint={o.hint}
                selected={answers.goal === o.value}
                onClick={() =>
                  setAnswers((a) => ({
                    ...a,
                    goal: o.value,
                    paceKg: o.value === "maintain" ? a.paceKg : PACE_RANGES[o.value].default,
                    targetWeight:
                      o.value === "lose"
                        ? round1(a.weight - (imperial ? 10 : 5))
                        : o.value === "gain"
                          ? round1(a.weight + (imperial ? 6 : 3))
                          : a.weight,
                  }))
                }
              />
            ))}
          </Options>
        ),
      });

    case "target": {
      const diff = round1(answers.targetWeight - answers.weight);
      const valid = answers.goal === "lose" ? diff < 0 : diff > 0;
      return layout({
        title: "What is your goal weight?",
        subtitle: answers.goal === "lose" ? "Pick a weight below your current one." : "Pick a weight above your current one.",
        canContinue: valid,
        children: (
          <div className="mt-12 space-y-8">
            <WeightDial
              label={answers.goal === "lose" ? "Lose weight" : "Gain weight"}
              value={answers.targetWeight}
              unit={wUnit}
              imperial={imperial}
              onChange={(v) => set({ targetWeight: v })}
            />
            <p className={cn("text-center text-sm font-semibold", valid ? "text-accent" : "text-destructive")}>
              {diff === 0
                ? "That's your current weight"
                : `${diff > 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)} ${wUnit} from now`}
            </p>
          </div>
        ),
      });
    }

    case "pace": {
      const goal = answers.goal === "gain" ? "gain" : "lose";
      const range = PACE_RANGES[goal];
      const label = paceLabel(goal, answers.paceKg);
      const profile = toProfile(answers);
      const calories = calcGoalCalories(profile);
      const weeks = weeksToGoal(profile.weightKg, profile.targetWeightKg ?? profile.weightKg, answers.paceKg);
      const shown = imperial ? kgToLb(answers.paceKg) : answers.paceKg;
      return layout({
        title: "How fast do you want to reach your goal?",
        children: (
          <div className="mt-10">
            <p className="text-center text-sm text-muted-foreground">
              {goal === "lose" ? "Weight loss" : "Weight gain"} speed per week
            </p>
            <p className="text-center font-display text-5xl font-bold text-foreground tabular">
              {shown.toFixed(1)} <span className="text-2xl">{wUnit}</span>
            </p>
            <div className="mt-8 grid grid-cols-3 text-center">
              {(
                [
                  ["slow", "Slow", Turtle],
                  ["recommended", "Recommended", Rabbit],
                  ["fast", "Fast", Zap],
                ] as const
              ).map(([k, text, Icon]) => (
                <div key={k} className={cn("flex flex-col items-center gap-2 transition-colors", label === k ? "text-accent" : "text-muted-foreground")}>
                  <Icon className={cn("size-8 transition-transform", label === k && "scale-110")} strokeWidth={2} />
                  <span className="text-sm font-semibold">{text}</span>
                </div>
              ))}
            </div>
            <SliderPrimitive.Root
              className="relative mt-6 flex h-8 w-full touch-none select-none items-center"
              min={range.min}
              max={range.max}
              step={0.1}
              value={[answers.paceKg]}
              onValueChange={([v]) => v !== undefined && set({ paceKg: round1(v) })}
              aria-label="Weekly pace"
            >
              <SliderPrimitive.Track className="relative h-2 grow overflow-hidden rounded-full bg-secondary">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block size-8 rounded-full border-4 border-accent bg-foreground shadow-float outline-none focus-visible:ring-4 focus-visible:ring-ring/50" />
            </SliderPrimitive.Root>

            <div className="mt-8 rounded-3xl bg-card p-5 shadow-card">
              <p className="text-base font-semibold text-foreground">
                You'll reach your goal in{" "}
                <span className="text-accent">{weeks <= 12 ? `${weeks} weeks` : `${Math.round(weeks / 4.345)} months`}</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{PACE_COPY[label]}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                Daily calorie goal: <span className="font-semibold text-foreground tabular">{calories.toLocaleString()} kcal</span>
              </p>
            </div>
          </div>
        ),
      });
    }

    case "why":
      return layout({
        title: "Designed to help you stay on track",
        children: (
          <div className="mt-10">
            <TrackChart />
          </div>
        ),
      });

    case "obstacles":
      return layout({
        title: "What's stopping you from reaching your goals?",
        subtitle: "Pick all that apply.",
        canContinue: answers.obstacles.length > 0,
        children: (
          <Options>
            {OBSTACLES.map((o) => (
              <OptionCard
                key={o.value}
                multi
                icon={o.icon}
                label={o.label}
                selected={answers.obstacles.includes(o.value)}
                onClick={() => set({ obstacles: toggle(answers.obstacles, o.value) })}
              />
            ))}
          </Options>
        ),
      });

    case "diet":
      return layout({
        title: "Do you follow a specific diet?",
        canContinue: !!answers.diet,
        children: (
          <Options>
            {DIETS.map((o) => (
              <OptionCard
                key={o.value}
                icon={o.icon}
                label={o.label}
                selected={answers.diet === o.value}
                onClick={() => set({ diet: o.value })}
              />
            ))}
          </Options>
        ),
      });

    case "aims":
      return layout({
        title: "What would you like to accomplish?",
        subtitle: "Pick all that apply.",
        canContinue: answers.aims.length > 0,
        children: (
          <Options>
            {AIMS.map((o) => (
              <OptionCard
                key={o.value}
                multi
                icon={o.icon}
                label={o.label}
                selected={answers.aims.includes(o.value)}
                onClick={() => set({ aims: toggle(answers.aims, o.value) })}
              />
            ))}
          </Options>
        ),
      });

    case "building":
      return <BuildingPlan onDone={next} />;

    case "plan":
      return <PlanReady answers={answers} onBack={back} onFinish={finish} />;
  }
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="relative">
        <img
          src={plateImg}
          alt="A healthy plate with salmon, quinoa, avocado and greens"
          width={1024}
          height={1024}
          className="aspect-square w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-background/70 py-1.5 pl-1.5 pr-4 backdrop-blur">
          <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
            <UtensilsCrossed className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-base font-bold text-foreground">Fit Plate</span>
        </div>
      </div>
      <div className="rise-in -mt-10 flex flex-1 flex-col px-6 pb-8">
        <h1 className="text-[2.5rem] font-bold leading-[1.05] text-foreground">
          Calorie tracking <span className="text-accent">made easy</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Answer a few quick questions and we'll build your daily calorie and macro plan.
        </p>
        <div className="mt-auto pt-10">
          <ContinueButton onClick={onStart}>Get started</ContinueButton>
          <p className="mt-3 text-center text-xs text-muted-foreground">Takes about a minute</p>
        </div>
      </div>
    </div>
  );
}

function WeightDial({
  label,
  value,
  unit,
  imperial,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  imperial: boolean;
  onChange: (v: number) => void;
}) {
  const min = imperial ? 66 : 30;
  const max = imperial ? 550 : 250;
  const nudge = (d: number) => onChange(Math.min(max, Math.max(min, round1(value + d))));
  return (
    <div>
      <p className="text-center text-sm text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={`Decrease by 0.1 ${unit}`}
          onClick={() => nudge(-0.1)}
          className="grid size-10 place-items-center rounded-full bg-secondary text-foreground"
        >
          <Minus className="size-4" />
        </button>
        <p className="min-w-[8rem] text-center font-display text-5xl font-bold text-foreground tabular">
          {value.toFixed(1)}
          <span className="ml-1 text-xl font-semibold">{unit}</span>
        </p>
        <button
          type="button"
          aria-label={`Increase by 0.1 ${unit}`}
          onClick={() => nudge(0.1)}
          className="grid size-10 place-items-center rounded-full bg-secondary text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="mt-8">
        <RulerPicker key={unit} ariaLabel={label} min={min} max={max} step={0.1} value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function PlanReady({ answers, onBack, onFinish }: { answers: Answers; onBack: () => void; onFinish: () => void }) {
  const profile = toProfile(answers);
  const plan = macrosFromCalories(calcGoalCalories(profile));
  const moving = profile.goal !== "maintain" && profile.targetWeightKg !== undefined;
  const weeks = moving ? weeksToGoal(profile.weightKg, profile.targetWeightKg!, profile.paceKg ?? 0.5) : 0;
  const diff = Math.abs(answers.targetWeight - answers.weight).toFixed(1);
  const unit = answers.units === "imperial" ? "lb" : "kg";
  const name = answers.name.trim();

  return (
    <QuizLayout
      progress={1}
      onBack={onBack}
      footer={<ContinueButton onClick={onFinish}>Let's get started</ContinueButton>}
    >
      <div className="mt-6 flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <h1 className="mt-5 text-[2rem] font-bold leading-[1.1] text-foreground">
          {name ? `${name}, your` : "Your"} custom plan is ready!
        </h1>
        {moving ? (
          <>
            <p className="mt-4 text-base text-muted-foreground">
              You should {profile.goal === "lose" ? "lose" : "gain"}
            </p>
            <p className="mt-2 rounded-full bg-card px-4 py-2 font-semibold text-foreground shadow-card">
              {diff} {unit} by {format(addWeeks(new Date(), weeks), "MMMM d")}
            </p>
          </>
        ) : (
          <p className="mt-4 text-base text-muted-foreground">Here's what keeps your weight steady.</p>
        )}
      </div>

      <section className="mt-8 rounded-3xl bg-secondary/40 p-4">
        <h2 className="text-lg font-bold text-foreground">Daily recommendation</h2>
        <p className="text-sm text-muted-foreground">You can edit this anytime in Settings.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <PlanTile label="Calories" value={plan.calories} unit="kcal" share={1} color="var(--accent)" />
          <PlanTile label="Carbs" value={plan.carbs} unit="g" share={0.4} color="var(--carbs)" />
          <PlanTile label="Protein" value={plan.protein} unit="g" share={0.3} color="var(--protein)" />
          <PlanTile label="Fat" value={plan.fat} unit="g" share={0.3} color="var(--fat)" />
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-secondary/40 p-4">
        <h2 className="text-lg font-bold text-foreground">How to reach your goals</h2>
        <ul className="mt-3 space-y-2">
          {TIPS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-4 rounded-2xl bg-card p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                <Icon className="size-5" />
              </span>
              <span className="font-medium text-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </section>
    </QuizLayout>
  );
}

function Options({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 space-y-3" role="group">
      {children}
    </div>
  );
}

const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string; icon: LucideIcon }[] = [
  { value: "sedentary", label: "Rarely", hint: "Mostly sitting, little exercise", icon: Sofa },
  { value: "light", label: "1–2 workouts a week", hint: "Light exercise or walks", icon: Footprints },
  { value: "moderate", label: "3–4 workouts a week", hint: "Regular training", icon: Bike },
  { value: "active", label: "5–6 workouts a week", hint: "Training most days", icon: Dumbbell },
  { value: "very_active", label: "Every day", hint: "Daily training or a physical job", icon: Flame },
];

const GOAL_OPTIONS: { value: Goal; label: string; hint: string; icon: LucideIcon }[] = [
  { value: "lose", label: "Lose weight", hint: "Eat in a calorie deficit", icon: TrendingDown },
  { value: "maintain", label: "Maintain", hint: "Keep my current weight", icon: Target },
  { value: "gain", label: "Build muscle", hint: "Eat in a small surplus", icon: TrendingUp },
];

const PACE_COPY = {
  slow: "A gentle pace — easy to keep up, results take a little longer.",
  recommended: "The most balanced pace — motivating and ideal for most people.",
  fast: "An ambitious pace — you may feel hungrier and it's harder to sustain.",
};

const OBSTACLES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "consistency", label: "Lack of consistency", icon: ChartNoAxesColumn },
  { value: "habits", label: "Unhealthy eating habits", icon: Sandwich },
  { value: "support", label: "Lack of support", icon: Handshake },
  { value: "schedule", label: "Busy schedule", icon: CalendarDays },
  { value: "inspiration", label: "Lack of meal inspiration", icon: Lightbulb },
];

const DIETS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "balanced", label: "Balanced", icon: Scale },
  { value: "whole_food", label: "Whole-food focus", icon: Salad },
  { value: "mediterranean", label: "Mediterranean", icon: Soup },
  { value: "flexitarian", label: "Flexitarian", icon: Leaf },
  { value: "pescatarian", label: "Pescatarian", icon: Fish },
  { value: "vegetarian", label: "Vegetarian", icon: Carrot },
  { value: "vegan", label: "Vegan", icon: Sprout },
  { value: "low_carb", label: "Low-carb", icon: Drumstick },
  { value: "keto", label: "Keto", icon: Egg },
  { value: "paleo", label: "Paleo", icon: Beef },
];

const AIMS: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "healthier", label: "Eat and live healthier", icon: Apple },
  { value: "energy", label: "Boost my energy and mood", icon: Sun },
  { value: "motivated", label: "Stay motivated and consistent", icon: BicepsFlexed },
  { value: "body", label: "Feel better about my body", icon: Smile },
];

const TIPS: { icon: LucideIcon; text: string }[] = [
  { icon: Apple, text: "Track your food every day" },
  { icon: Flame, text: "Follow your daily calorie target" },
  { icon: ChartNoAxesColumn, text: "Balance your carbs, protein and fat" },
  { icon: Scale, text: "Log your weight once a week" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, value) => ({ value, label }));

// Ages 13–100.
const YEARS = Array.from({ length: 88 }, (_, i) => {
  const y = THIS_YEAR - 100 + i;
  return { value: y, label: String(y) };
});

const CENTIMETRES = Array.from({ length: 111 }, (_, i) => ({ value: 120 + i, label: `${120 + i}` }));
const FEET = [4, 5, 6, 7].map((v) => ({ value: v, label: `${v} ft` }));
const INCHES = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i} in` }));
