import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { FrequentMealsSection } from "../FrequentMealsSection";
import type { FrequentMealsState } from "../../hooks/useDashboardHooks";
import type { FrequentMeal } from "../../types";

const meal: FrequentMeal = {
  id: 3,
  display_name: "Protein Shake",
  ingredients: [
    { name: "whey", brand: null, weight_g: 30, calories_per_100g: 400, protein_per_100g: 80, carbs_per_100g: 8, fat_per_100g: 6 },
  ],
  macros: { calories: 120, protein: 24, carbs: 2.4, fat: 1.8 },
  log_count: 4,
  last_logged: "2026-09-17",
};

const state = (overrides: Partial<FrequentMealsState> = {}): FrequentMealsState => ({
  meals: [meal],
  refresh: jest.fn(),
  loggingId: null,
  quickLog: jest.fn(async () => true),
  remove: jest.fn(),
  ...overrides,
});

describe("FrequentMealsSection", () => {
  it("renders nothing when there are no frequent meals (as on web)", async () => {
    await render(<FrequentMealsSection frequent={state({ meals: [] })} />);
    expect(screen.queryByText("Frequent meals")).toBeNull();
  });

  it("shows the meal card with its log count and quick-logs it", async () => {
    const frequent = state();
    await render(<FrequentMealsSection frequent={frequent} />);

    expect(screen.getByText("4× logged")).toBeTruthy();
    expect(screen.getByText("120 kcal")).toBeTruthy();
    await fireEvent.press(screen.getByText("Log"));
    expect(frequent.quickLog).toHaveBeenCalledWith(meal);
  });

  it("removes a meal from the frequent list", async () => {
    const frequent = state();
    await render(<FrequentMealsSection frequent={frequent} />);

    await fireEvent.press(screen.getByLabelText("Remove from frequent meals"));
    expect(frequent.remove).toHaveBeenCalledWith(3);
  });

  it("logs with adjusted portions and previews the estimate", async () => {
    const frequent = state();
    await render(<FrequentMealsSection frequent={frequent} />);

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Adjust portions before logging"));
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("whey grams"), "60");
    });
    expect(screen.getByText("240 kcal")).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByText("Log portions"));
    });
    expect(frequent.quickLog).toHaveBeenCalledWith(meal, { whey: 60 });
  });
});
