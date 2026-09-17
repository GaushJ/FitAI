import { render, screen, fireEvent } from "@testing-library/react-native";
import { HistoryList } from "../HistoryList";
import type { HistoryMeal } from "../../types";

const meal: HistoryMeal = {
  id: 1,
  date: "2026-09-17",
  raw_transcript: "2 eggs and toast",
  macros: { calories: 320, protein: 18, carbs: 28, fat: 14 },
  ingredients: [
    { name: "egg", brand: null, weight_g: 100, calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  ],
};

describe("HistoryList", () => {
  it("shows the empty state when there are no meals", async () => {
    await render(
      <HistoryList meals={[]} total={0} page={1} totalPages={1} loading={false} onPrevPage={() => {}} onNextPage={() => {}} />
    );

    expect(screen.getByText("No meals logged yet. Start tracking on the dashboard!")).toBeTruthy();
  });

  it("expands a meal to show its ingredients", async () => {
    await render(
      <HistoryList meals={[meal]} total={1} page={1} totalPages={1} loading={false} onPrevPage={() => {}} onNextPage={() => {}} />
    );

    expect(screen.queryByText(/egg · 100g/)).toBeNull();

    await fireEvent.press(screen.getByText(/2 eggs and toast/));

    expect(screen.getByText(/egg · 100g/)).toBeTruthy();
    expect(screen.getByText("320 kcal")).toBeTruthy();
  });

  it("disables Previous on the first page and Next on the last page", async () => {
    const onPrevPage = jest.fn();
    const onNextPage = jest.fn();
    await render(
      <HistoryList meals={[meal]} total={1} page={1} totalPages={1} loading={false} onPrevPage={onPrevPage} onNextPage={onNextPage} />
    );

    await fireEvent.press(screen.getByLabelText("Previous page"));
    await fireEvent.press(screen.getByLabelText("Next page"));

    expect(onPrevPage).not.toHaveBeenCalled();
    expect(onNextPage).not.toHaveBeenCalled();
  });

  it("calls onNextPage when a later page exists", async () => {
    const onNextPage = jest.fn();
    await render(
      <HistoryList meals={[meal]} total={30} page={1} totalPages={2} loading={false} onPrevPage={() => {}} onNextPage={onNextPage} />
    );

    await fireEvent.press(screen.getByLabelText("Next page"));
    expect(onNextPage).toHaveBeenCalledTimes(1);
  });
});
