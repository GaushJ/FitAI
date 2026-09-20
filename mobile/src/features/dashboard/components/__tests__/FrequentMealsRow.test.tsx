import { render, screen, fireEvent } from "@testing-library/react-native";
import { FrequentMealsRow } from "../FrequentMealsRow";
import type { FrequentMeal } from "../../types";

const meal: FrequentMeal = {
  id: 1,
  display_name: "Protein Shake",
  ingredients: [],
  macros: { calories: 210, protein: 40, carbs: 5, fat: 2 },
  log_count: 3,
  last_logged: "2026-09-17",
};

describe("FrequentMealsRow", () => {
  it("shows an empty state when there are no frequent meals", async () => {
    await render(<FrequentMealsRow meals={[]} onLog={() => {}} onAdjustPortions={() => {}} loggingId={null} />);
    expect(screen.getByText("Log the same meal twice and it'll show up here")).toBeTruthy();
  });

  it("renders a meal chip and fires onLog when its button is pressed", async () => {
    const onLog = jest.fn();
    await render(<FrequentMealsRow meals={[meal]} onLog={onLog} onAdjustPortions={() => {}} loggingId={null} />);

    expect(screen.getByText("Protein Shake")).toBeTruthy();
    await fireEvent.press(screen.getByText("+ Log"));
    expect(onLog).toHaveBeenCalledWith(meal);
  });

  it("fires onAdjustPortions when the sliders button is pressed", async () => {
    const onAdjustPortions = jest.fn();
    await render(<FrequentMealsRow meals={[meal]} onLog={() => {}} onAdjustPortions={onAdjustPortions} loggingId={null} />);

    await fireEvent.press(screen.getByLabelText("Adjust portions for Protein Shake"));
    expect(onAdjustPortions).toHaveBeenCalledWith(meal);
  });

  it("shows a logging state and disables the button for the meal being logged", async () => {
    await render(<FrequentMealsRow meals={[meal]} onLog={() => {}} onAdjustPortions={() => {}} loggingId={1} />);
    expect(screen.getByText("Logging…")).toBeTruthy();
  });
});
