import { render, screen, fireEvent } from "@testing-library/react-native";
import { SavedMealsRow } from "../SavedMealsRow";
import type { SavedMeal } from "../../types";

const meal: SavedMeal = {
  id: 1,
  name: "Breakfast Omelette",
  ingredients: [],
  macros: { calories: 420, protein: 32, carbs: 3, fat: 30 },
  created_at: "2026-09-17",
  updated_at: "2026-09-17",
};

describe("SavedMealsRow", () => {
  it("always shows the add-new card, even with saved meals present", async () => {
    await render(
      <SavedMealsRow meals={[meal]} onLog={() => {}} onEdit={() => {}} onDelete={() => {}} onCreateNew={() => {}} loggingId={null} />
    );
    expect(screen.getByText("Breakfast Omelette")).toBeTruthy();
    expect(screen.getByText("Save a meal template")).toBeTruthy();
  });

  it("fires onLog, onEdit, and onDelete with the right meal", async () => {
    const onLog = jest.fn();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    await render(
      <SavedMealsRow meals={[meal]} onLog={onLog} onEdit={onEdit} onDelete={onDelete} onCreateNew={() => {}} loggingId={null} />
    );

    await fireEvent.press(screen.getByText("Log"));
    expect(onLog).toHaveBeenCalledWith(meal);

    await fireEvent.press(screen.getByLabelText("Edit Breakfast Omelette"));
    expect(onEdit).toHaveBeenCalledWith(meal);

    await fireEvent.press(screen.getByLabelText("Delete Breakfast Omelette"));
    expect(onDelete).toHaveBeenCalledWith(meal);
  });

  it("fires onCreateNew from both the header link and the add-new card", async () => {
    const onCreateNew = jest.fn();
    await render(
      <SavedMealsRow meals={[]} onLog={() => {}} onEdit={() => {}} onDelete={() => {}} onCreateNew={onCreateNew} loggingId={null} />
    );

    await fireEvent.press(screen.getByLabelText("New saved meal"));
    await fireEvent.press(screen.getByText("Save a meal template"));
    expect(onCreateNew).toHaveBeenCalledTimes(2);
  });
});
