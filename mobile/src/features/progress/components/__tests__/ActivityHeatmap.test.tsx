import { render, screen, fireEvent } from "@testing-library/react-native";
import { ActivityHeatmap } from "../ActivityHeatmap";
import type { DaySummary } from "../../types";

function makeSummaries(): DaySummary[] {
  const days: DaySummary[] = [];
  for (let i = 0; i < 10; i++) {
    const date = new Date("2026-09-01T00:00:00");
    date.setDate(date.getDate() + i);
    days.push({
      date: date.toISOString().slice(0, 10),
      calories: i === 5 ? 2040 : 0,
      protein: i === 5 ? 140 : 0,
      carbs: i === 5 ? 210 : 0,
      fat: i === 5 ? 68 : 0,
      meal_count: i === 5 ? 3 : 0,
      target_calories: 2000,
      status: i === 5 ? "met" : "empty",
    });
  }
  return days;
}

describe("ActivityHeatmap", () => {
  it("shows day details on tap and hides them again on a second tap", async () => {
    const summaries = makeSummaries();
    const metDay = summaries[5];
    await render(<ActivityHeatmap summaries={summaries} />);

    expect(screen.queryByText("3 meals logged")).toBeNull();

    await fireEvent.press(screen.getByLabelText(`${metDay.date}: Goal met`));

    expect(screen.getByText("2040 / 2000 kcal")).toBeTruthy();
    expect(screen.getByText("P 140g")).toBeTruthy();
    expect(screen.getByText("3 meals logged")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(`${metDay.date}: Goal met`));
    expect(screen.queryByText("3 meals logged")).toBeNull();
  });

  it("switches the selected day when a different cell is tapped", async () => {
    const summaries = makeSummaries();
    await render(<ActivityHeatmap summaries={summaries} />);

    await fireEvent.press(screen.getByLabelText(`${summaries[5].date}: Goal met`));
    expect(screen.getByText("3 meals logged")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText(`${summaries[0].date}: No data`));
    expect(screen.getByText("0 meals logged")).toBeTruthy();
    expect(screen.queryByText("3 meals logged")).toBeNull();
  });
});
