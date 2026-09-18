import { render, screen, fireEvent } from "@testing-library/react-native";
import { TodayLogList } from "../TodayLogList";
import type { MealLog } from "../../types";

const ingredient = {
  name: "egg",
  brand: null,
  weight_g: 100,
  calories_per_100g: 155,
  protein_per_100g: 13,
  carbs_per_100g: 1.1,
  fat_per_100g: 11,
};

const meal: MealLog = {
  id: 1,
  raw_transcript: "two eggs and toast",
  date: "2026-09-17T08:14:00Z",
  macros: { calories: 320, protein: 18, carbs: 30, fat: 12 },
  ingredients: [ingredient],
};

describe("TodayLogList", () => {
  it("shows an empty state when there are no meals", async () => {
    await render(<TodayLogList meals={[]} onEditIngredient={() => {}} onDeleteMeal={() => {}} />);
    expect(screen.getByText("No meals logged yet today")).toBeTruthy();
  });

  it("shows the full macro breakdown for a meal without needing to expand it", async () => {
    await render(<TodayLogList meals={[meal]} onEditIngredient={() => {}} onDeleteMeal={() => {}} />);

    expect(screen.getByText("320 kcal")).toBeTruthy();
    expect(screen.getByText("P 18g")).toBeTruthy();
    expect(screen.getByText("C 30g")).toBeTruthy();
    expect(screen.getByText("F 12g")).toBeTruthy();
  });

  it("shows ingredient detail only after the row is expanded", async () => {
    await render(<TodayLogList meals={[meal]} onEditIngredient={() => {}} onDeleteMeal={() => {}} />);

    expect(screen.getByText(/two eggs and toast/)).toBeTruthy();
    expect(screen.queryByText(/egg · 100g/)).toBeNull();

    await fireEvent.press(screen.getByRole("button"));

    expect(screen.getByText(/egg · 100g/)).toBeTruthy();
  });

  it("fires onEditIngredient with the meal id, index, and ingredient", async () => {
    const onEditIngredient = jest.fn();
    await render(<TodayLogList meals={[meal]} onEditIngredient={onEditIngredient} onDeleteMeal={() => {}} />);

    await fireEvent.press(screen.getByRole("button"));
    await fireEvent.press(screen.getByLabelText("Edit egg"));

    expect(onEditIngredient).toHaveBeenCalledWith(1, 0, ingredient);
  });

  it("fires onDeleteMeal with the meal once expanded", async () => {
    const onDeleteMeal = jest.fn();
    await render(<TodayLogList meals={[meal]} onEditIngredient={() => {}} onDeleteMeal={onDeleteMeal} />);

    await fireEvent.press(screen.getByRole("button"));
    await fireEvent.press(screen.getByLabelText('Delete meal "two eggs and toast"'));

    expect(onDeleteMeal).toHaveBeenCalledWith(meal);
  });
});
