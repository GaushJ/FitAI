import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { SavedMealEditorModal } from "../SavedMealEditorModal";
import { SavedMealsSection } from "../SavedMealsSection";
import { draftFromLoggedMeal } from "../../drafts";
import * as api from "../../api";
import * as ingredientsApi from "@/features/ingredients/api";
import type { SavedMeal } from "../../types";

jest.mock("../../api");
jest.mock("@/features/ingredients/api");

const egg = { name: "egg", brand: null, weight_g: 100, calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 };

const meal: SavedMeal = {
  id: 1,
  name: "Breakfast Omelette",
  ingredients: [egg],
  macros: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  created_at: "2026-09-17",
  updated_at: "2026-09-17",
};

const notifier = () => ({ success: jest.fn(), error: jest.fn(), clear: jest.fn() });

describe("SavedMealsSection", () => {
  it("shows web's empty hint", async () => {
    await render(<SavedMealsSection meals={[]} loggingId={null} onNew={() => {}} onLog={() => {}} onEdit={() => {}} onRemove={() => {}} />);
    expect(screen.getByText(/Save meals you eat often/)).toBeTruthy();
  });

  it("wires New, Log meal, edit and delete", async () => {
    const handlers = { onNew: jest.fn(), onLog: jest.fn(), onEdit: jest.fn(), onRemove: jest.fn() };
    await render(<SavedMealsSection meals={[meal]} loggingId={null} {...handlers} />);

    expect(screen.getByText("1 item")).toBeTruthy();
    await fireEvent.press(screen.getByText("New"));
    await fireEvent.press(screen.getByText("Log meal"));
    await fireEvent.press(screen.getByLabelText("Change quantities, add/remove ingredients, or rename"));
    await fireEvent.press(screen.getByLabelText("Delete this saved meal"));

    expect(handlers.onNew).toHaveBeenCalled();
    expect(handlers.onLog).toHaveBeenCalledWith(meal);
    expect(handlers.onEdit).toHaveBeenCalledWith(meal);
    expect(handlers.onRemove).toHaveBeenCalledWith(1);
  });
});

describe("SavedMealEditorModal", () => {
  afterEach(() => jest.clearAllMocks());

  it("turns a logged meal into a named template draft (as on web)", () => {
    const draft = draftFromLoggedMeal({ id: 5, raw_transcript: "x", date: "", macros: meal.macros, ingredients: [egg, { ...egg, name: "toast" }] });
    expect(draft).toMatchObject({ id: null, name: "egg + toast" });
  });

  it("updates the totals when an ingredient's grams change", async () => {
    await render(
      <SavedMealEditorModal draft={{ id: 1, name: "Omelette", ingredients: [egg] }} notify={notifier()} onClose={() => {}} onTemplateSaved={() => {}} onLogged={() => {}} />
    );

    // Once on the ingredient row, once in the total.
    expect(screen.getAllByText("155 kcal")).toHaveLength(2);
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("egg grams"), "200");
    });
    expect(screen.getAllByText("310 kcal")).toHaveLength(2);
  });

  it("resolves and adds a new ingredient", async () => {
    jest.spyOn(ingredientsApi, "resolveIngredient").mockResolvedValue({
      calories_per_100g: 52,
      protein_per_100g: 0.3,
      carbs_per_100g: 14,
      fat_per_100g: 0.2,
    });
    await render(
      <SavedMealEditorModal draft={{ id: null, name: "", ingredients: [] }} notify={notifier()} onClose={() => {}} onTemplateSaved={() => {}} onLogged={() => {}} />
    );

    expect(screen.getByText("New saved meal")).toBeTruthy();
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("Ingredient name"), "apple");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Add"));
    });

    await waitFor(() => expect(screen.getByText("apple")).toBeTruthy());
    expect(ingredientsApi.resolveIngredient).toHaveBeenCalledWith({ name: "apple", brand: "", weight_g: 100 });
  });

  it("validates before saving", async () => {
    await render(
      <SavedMealEditorModal draft={{ id: null, name: "", ingredients: [] }} notify={notifier()} onClose={() => {}} onTemplateSaved={() => {}} onLogged={() => {}} />
    );

    await act(async () => {
      await fireEvent.press(screen.getByText("Save meal"));
    });
    expect(screen.getByText("Give this meal a name.")).toBeTruthy();
  });

  it("logs an existing template with the edited quantities", async () => {
    jest.spyOn(api, "logSavedMeal").mockResolvedValue({ name: "Omelette", macros: { calories: 310, protein: 26, carbs: 2, fat: 22 } });
    const notify = notifier();
    const onClose = jest.fn();
    await render(
      <SavedMealEditorModal draft={{ id: 1, name: "Omelette", ingredients: [egg] }} notify={notify} onClose={onClose} onTemplateSaved={() => {}} onLogged={() => {}} />
    );

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("egg grams"), "200");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Log now"));
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(api.logSavedMeal).toHaveBeenCalledWith(1, [{ ...egg, weight_g: 200 }]);
    expect(notify.success).toHaveBeenCalledWith('Logged "Omelette" — 310 kcal');
  });
});
