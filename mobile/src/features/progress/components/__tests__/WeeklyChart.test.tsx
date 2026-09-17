import { render, screen } from "@testing-library/react-native";
import { WeeklyChart } from "../WeeklyChart";
import type { DaySummary } from "../../types";

function makeSummaries(): DaySummary[] {
  const days: DaySummary[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date("2026-09-01T00:00:00");
    date.setDate(date.getDate() + i);
    days.push({
      date: date.toISOString().slice(0, 10),
      calories: 2000,
      protein: 140,
      carbs: 200,
      fat: 60,
      meal_count: 3,
      target_calories: 2000,
      status: "met",
    });
  }
  return days;
}

describe("WeeklyChart", () => {
  it("shows the weekly target and legend", async () => {
    await render(<WeeklyChart summaries={makeSummaries()} targetCalories={2000} />);

    expect(screen.getByText("vs target (14,000 kcal/week)")).toBeTruthy();
    expect(screen.getByText("Goal met")).toBeTruthy();
    expect(screen.getByText("Over")).toBeTruthy();
    expect(screen.getByText("Target")).toBeTruthy();
  });
});
