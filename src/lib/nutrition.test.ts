import { describe, expect, it } from "vitest";
import {
  calcBmi,
  calcBmr,
  calcGoalCalories,
  calcTdee,
  macrosFromCalories,
  bmiCategory,
  type Profile,
} from "./nutrition";

const male: Profile = {
  sex: "male",
  age: 30,
  heightCm: 180,
  weightKg: 80,
  activity: "moderate",
  goal: "maintain",
};

describe("nutrition math", () => {
  it("computes BMR with Mifflin–St Jeor for men", () => {
    expect(calcBmr(male)).toBe(1780);
  });

  it("computes BMR with Mifflin–St Jeor for women", () => {
    expect(calcBmr({ sex: "female", age: 25, heightCm: 165, weightKg: 60 })).toBe(1345);
  });

  it("applies the moderate activity factor (1.55) for TDEE", () => {
    expect(calcTdee(male)).toBe(2759);
  });

  it("subtracts 500 kcal for a weight-loss goal", () => {
    expect(calcGoalCalories({ ...male, goal: "lose" })).toBe(2259);
  });

  it("adds 300 kcal for a muscle-gain goal", () => {
    expect(calcGoalCalories({ ...male, goal: "gain" })).toBe(3059);
  });

  it("never sets a calorie target below 1200", () => {
    const tiny: Profile = { sex: "female", age: 80, heightCm: 140, weightKg: 38, activity: "sedentary", goal: "lose" };
    expect(calcGoalCalories(tiny)).toBe(1200);
  });

  it("splits calories 30/40/30 into protein/carbs/fat grams", () => {
    expect(macrosFromCalories(2000)).toEqual({ calories: 2000, protein: 150, carbs: 200, fat: 67 });
  });

  it("computes BMI and category", () => {
    expect(calcBmi(80, 180)).toBe(24.7);
    expect(bmiCategory(24.7)).toBe("Healthy");
    expect(bmiCategory(31)).toBe("Obese");
  });
});
