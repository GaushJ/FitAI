import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { ActivityHeatmap, MealHistory, StatsRow, WeeklyCalorieChart } from "..";
import { buildCalendar, weeklyTotals } from "../../calendar";
import type { MealHistoryState } from "../../hooks";
import type { DaySummary } from "../../types";

const day = (date: string, status: DaySummary["status"], calories = 0): DaySummary => ({
  date,
  calories,
  protein: calories ? 140 : 0,
  carbs: 0,
  fat: 0,
  meal_count: calories ? 3 : 0,
  target_calories: 2000,
  status,
});

// Sunday 6 Sep 2026 → Saturday 19 Sep: two full week columns.
const summaries = Array.from({ length: 14 }, (_, i) => {
  const d = String(6 + i).padStart(2, "0");
  return i === 3 ? day(`2026-09-${d}`, "met", 2040) : day(`2026-09-${d}`, "empty");
});

describe("calendar helpers", () => {
  it("lays days into Sunday-start week columns and totals each week", () => {
    const { weeks, monthLabels } = buildCalendar(summaries);
    expect(weeks).toHaveLength(2);
    expect(monthLabels).toEqual([{ label: "Sep", column: 0 }]);
    expect(weeklyTotals(weeks)).toEqual([
      { total: 2040, label: "09-06" },
      { total: 0, label: "09-13" },
    ]);
  });
});

describe("StatsRow", () => {
  it("shows web's four stat tiles", async () => {
    await render(<StatsRow stats={{ current_streak: 6, best_streak: 14, total_days_logged: 58, total_meals: 132 }} />);
    for (const label of ["Current streak", "Best streak", "Days logged", "Total meals"]) expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText("132")).toBeTruthy();
    expect(screen.getByText("meals")).toBeTruthy();
  });
});

describe("ActivityHeatmap", () => {
  it("shows the day tooltip when a cell is tapped, and hides it on a second tap", async () => {
    const { weeks, monthLabels } = buildCalendar(summaries);
    await render(<ActivityHeatmap weeks={weeks} monthLabels={monthLabels} />);

    const cell = screen.getByLabelText(/Goal met ✓/);
    await act(async () => {
      await fireEvent.press(cell);
    });
    expect(screen.getByText("2040 / 2000 kcal · 140g P · 3 meals")).toBeTruthy();

    await act(async () => {
      await fireEvent.press(cell);
    });
    expect(screen.queryByText(/2040 \/ 2000 kcal/)).toBeNull();
  });
});

describe("WeeklyCalorieChart", () => {
  it("shows the weekly target and a week's total on tap", async () => {
    await render(<WeeklyCalorieChart weeks={[{ total: 12600, label: "09-06" }, { total: 0, label: "09-13" }]} targetCalories={2000} />);

    expect(screen.getByText("vs target (14,000 kcal / week)")).toBeTruthy();
    expect(screen.getByText("14,000 kcal target")).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Week of 09-06"));
    });
    expect(screen.getByText("12,600 kcal")).toBeTruthy();
  });

  it("renders nothing without data", async () => {
    await render(<WeeklyCalorieChart weeks={[]} targetCalories={2000} />);
    expect(screen.queryByText("Weekly calorie intake")).toBeNull();
  });
});

describe("MealHistory", () => {
  const history = (overrides: Partial<MealHistoryState> = {}): MealHistoryState => ({
    meals: [],
    total: 0,
    page: 1,
    loading: false,
    hasPrevious: false,
    hasNext: false,
    goToPage: jest.fn(),
    ...overrides,
  });

  it("shows web's empty message", async () => {
    await render(<MealHistory history={history()} />);
    expect(screen.getByText("No meals logged yet. Start tracking on the dashboard!")).toBeTruthy();
  });

  it("pages forward and expands a meal", async () => {
    const state = history({
      total: 16,
      hasNext: true,
      meals: [
        {
          id: 1,
          date: "2026-09-17",
          raw_transcript: "2 eggs and toast",
          macros: { calories: 320, protein: 18, carbs: 28, fat: 14 },
          ingredients: [{ name: "egg", brand: null, weight_g: 100, calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 }],
        },
      ],
    });
    await render(<MealHistory history={state} />);

    expect(screen.getByText("16 meals logged in total")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Next page"));
    expect(state.goToPage).toHaveBeenCalledWith(2);

    await act(async () => {
      await fireEvent.press(screen.getByText(/2 eggs and toast/));
    });
    expect(screen.getByText("155 kcal")).toBeTruthy();
  });
});
