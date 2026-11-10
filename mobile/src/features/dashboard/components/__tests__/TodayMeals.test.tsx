import { render, screen, fireEvent } from "@testing-library/react-native";
import { TodayMeals } from "../TodayMeals";
import type { MealLog } from "../../types";

const ingredient = {
  name: "egg",
  brand: "Farm Fresh",
  weight_g: 100,
  calories_per_100g: 155,
  protein_per_100g: 13,
  carbs_per_100g: 1.1,
  fat_per_100g: 11,
};

const meal: MealLog = {
  id: 7,
  raw_transcript: "two eggs and toast",
  date: "2026-09-17T08:14:00Z",
  macros: { calories: 320, protein: 18, carbs: 30, fat: 12 },
  ingredients: [ingredient],
};

const totals = { calories: 1320.6, protein: 80.4, carbs: 130, fat: 40 };

function renderList(overrides: Partial<Parameters<typeof TodayMeals>[0]> = {}) {
  const props = {
    meals: [meal],
    totals,
    loading: false,
    expandedIds: new Set<number>(),
    deletingId: null,
    onToggle: jest.fn(),
    onDelete: jest.fn(),
    onSaveAsMeal: jest.fn(),
    onEditIngredient: jest.fn(),
    ...overrides,
  };
  return render(<TodayMeals {...props} />).then(() => props);
}

describe("TodayMeals", () => {
  it("shows web's empty state when nothing is logged", async () => {
    await renderList({ meals: [] });
    expect(screen.getByText("No food logged today")).toBeTruthy();
    expect(screen.getByText("0 meals logged")).toBeTruthy();
  });

  it("shows each meal's calories and macro block, plus today's totals", async () => {
    await renderList();
    expect(screen.getByText(/two eggs and toast/)).toBeTruthy();
    expect(screen.getByText("320")).toBeTruthy();
    expect(screen.getByText("18g")).toBeTruthy();
    expect(screen.getByText("1,321 kcal · 80g P · 130g C · 40g F")).toBeTruthy();
  });

  it("toggles, saves as a reusable meal and deletes", async () => {
    const props = await renderList();

    await fireEvent.press(screen.getByText(/two eggs and toast/));
    expect(props.onToggle).toHaveBeenCalledWith(7);

    await fireEvent.press(screen.getByLabelText("Save this as a reusable meal"));
    expect(props.onSaveAsMeal).toHaveBeenCalledWith(meal);

    await fireEvent.press(screen.getByLabelText("Delete this meal"));
    expect(props.onDelete).toHaveBeenCalledWith(7);
  });

  it("lists ingredients with brand and per-ingredient macros once expanded, and edits one", async () => {
    const props = await renderList({ expandedIds: new Set([7]) });

    expect(screen.getByText("Farm Fresh")).toBeTruthy();
    expect(screen.getByText("155 kcal")).toBeTruthy();
    expect(screen.getByText("Total")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Edit this ingredient's macros"));
    expect(props.onEditIngredient).toHaveBeenCalledWith({ mealId: 7, index: 0, ingredient });
  });
});
