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
    await render(<TodayLogList meals={[]} onEditIngredient={() => {}} />);
    expect(screen.getByText("No meals logged yet today")).toBeTruthy();
  });

  it("shows ingredient detail only after the row is expanded", async () => {
    await render(<TodayLogList meals={[meal]} onEditIngredient={() => {}} />);

    expect(screen.getByText(/two eggs and toast/)).toBeTruthy();
    expect(screen.queryByText(/egg · 100g/)).toBeNull();

    await fireEvent.press(screen.getByRole("button"));

    expect(screen.getByText(/egg · 100g/)).toBeTruthy();
  });

  it("fires onEditIngredient with the meal id, index, and ingredient", async () => {
    const onEditIngredient = jest.fn();
    await render(<TodayLogList meals={[meal]} onEditIngredient={onEditIngredient} />);

    await fireEvent.press(screen.getByRole("button"));
    await fireEvent.press(screen.getByLabelText("Edit egg"));

    expect(onEditIngredient).toHaveBeenCalledWith(1, 0, ingredient);
  });
});
