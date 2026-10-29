import { describe, expect, it } from "vitest";
import { averageCalories, dailyCalories, lastNDays, weightProgress } from "./progress";

describe("7-day calories", () => {
  it("covers today and the 6 days before it", () => {
    const days = lastNDays(new Date(2026, 9, 29), 7);
    expect(days).toEqual([
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
    ]);
  });

  it("ignores food logged outside the 7-day window", () => {
    const days = lastNDays(new Date(2026, 9, 29), 7);
    const totals = dailyCalories(
      [
        { date: "2026-10-22", calories: 900 },
        { date: "2026-10-29", calories: 500 },
        { date: "2026-10-29", calories: 700 },
      ],
      days,
    );
    expect(totals.reduce((a, d) => a + d.calories, 0)).toBe(1200);
  });

  it("averages only days with food logged", () => {
    const result = averageCalories([
      { date: "a", calories: 2000 },
      { date: "b", calories: 0 },
      { date: "c", calories: 1800 },
    ]);
    expect(result).toEqual({ average: 1900, loggedDays: 2 });
  });

  it("is 0 with nothing logged", () => {
    expect(averageCalories([{ date: "a", calories: 0 }])).toEqual({ average: 0, loggedDays: 0 });
  });
});

describe("weight progress", () => {
  it("compares the first weigh-in with the latest", () => {
    const p = weightProgress([
      { date: "2026-10-20", kg: 80.4, createdAt: 3 },
      { date: "2026-10-01", kg: 82, createdAt: 1 },
      { date: "2026-10-10", kg: 81.1, createdAt: 2 },
    ]);
    expect(p?.startKg).toBe(82);
    expect(p?.currentKg).toBe(80.4);
    expect(p?.changeKg).toBe(-1.6);
  });

  it("is empty without weigh-ins", () => {
    expect(weightProgress([])).toBeNull();
  });
});
