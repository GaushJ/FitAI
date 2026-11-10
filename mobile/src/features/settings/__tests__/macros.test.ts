import { caloriesFromMacros, scaleMacrosToCalories } from "../macros";

describe("caloriesFromMacros (Atwater 4/4/9)", () => {
  it("uses 4 kcal/g for protein and carbs and 9 kcal/g for fat", () => {
    expect(caloriesFromMacros({ protein: 100, carbs: 200, fat: 50 })).toBe(400 + 800 + 450);
  });

  it("is zero for an empty split", () => {
    expect(caloriesFromMacros({ protein: 0, carbs: 0, fat: 0 })).toBe(0);
  });
});

describe("scaleMacrosToCalories", () => {
  it("keeps the ratios while hitting the requested calories (within rounding)", () => {
    const scaled = scaleMacrosToCalories({ protein: 150, carbs: 200, fat: 65 }, 1500);
    expect(Math.abs(caloriesFromMacros(scaled) - 1500)).toBeLessThanOrEqual(10);
    expect(scaled.carbs / scaled.protein).toBeCloseTo(200 / 150, 1);
  });

  it("returns whole grams", () => {
    const scaled = scaleMacrosToCalories({ protein: 123, carbs: 234, fat: 45 }, 2777);
    Object.values(scaled).forEach((g) => expect(Number.isInteger(g)).toBe(true));
  });

  it("leaves an all-zero split untouched instead of dividing by zero", () => {
    expect(scaleMacrosToCalories({ protein: 0, carbs: 0, fat: 0 }, 2000)).toEqual({ protein: 0, carbs: 0, fat: 0 });
  });
});
