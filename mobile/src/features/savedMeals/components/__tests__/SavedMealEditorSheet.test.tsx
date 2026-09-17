import { createRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SavedMealEditorSheet, type SavedMealEditorTarget } from "../SavedMealEditorSheet";
import * as api from "../../api";
import type { SavedMeal } from "../../types";

jest.mock("../../api");

const existingMeal: SavedMeal = {
  id: 7,
  name: "Breakfast Omelette",
  ingredients: [
    { name: "eggs", brand: null, weight_g: 150, calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
  ],
  macros: { calories: 232.5, protein: 19.5, carbs: 1.65, fat: 16.5 },
  created_at: "2026-09-17",
  updated_at: "2026-09-17",
};

describe("SavedMealEditorSheet", () => {
  afterEach(() => jest.clearAllMocks());

  it("starts empty in new mode", async () => {
    const target: SavedMealEditorTarget = { mode: "new", meal: null };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={() => {}} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    expect(screen.getByText("New Saved Meal")).toBeTruthy();
    expect(screen.getByPlaceholderText("e.g. Breakfast Omelette").props.value).toBe("");
  });

  it("prefills name and ingredients in edit mode", async () => {
    const target: SavedMealEditorTarget = { mode: "edit", meal: existingMeal };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={() => {}} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    expect(screen.getByText("Edit Saved Meal")).toBeTruthy();
    expect(screen.getByDisplayValue("Breakfast Omelette")).toBeTruthy();
    expect(screen.getByText("eggs")).toBeTruthy();
    expect(screen.getByText("233 kcal")).toBeTruthy(); // 155 * 150 / 100
  });

  it("resolves and adds a new ingredient, updating the live total", async () => {
    jest.spyOn(api, "resolveIngredient").mockResolvedValue({
      calories_per_100g: 52,
      protein_per_100g: 0.3,
      carbs_per_100g: 14,
      fat_per_100g: 0.2,
    });
    const target: SavedMealEditorTarget = { mode: "new", meal: null };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={() => {}} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("Ingredient name"), "apple");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Add"));
    });

    await waitFor(() => expect(screen.getByText("apple")).toBeTruthy());
    expect(api.resolveIngredient).toHaveBeenCalledWith("apple", "", 100);
    expect(screen.getByText("52 kcal")).toBeTruthy();
  });

  it("removes an ingredient", async () => {
    const target: SavedMealEditorTarget = { mode: "edit", meal: existingMeal };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={() => {}} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Remove eggs"));
    });

    expect(screen.queryByText("eggs")).toBeNull();
    expect(screen.getByText("0 kcal")).toBeTruthy();
  });

  it("requires a name and at least one ingredient before saving", async () => {
    const createSavedMeal = jest.spyOn(api, "createSavedMeal");
    const target: SavedMealEditorTarget = { mode: "new", meal: null };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={() => {}} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.press(screen.getByText("Save Meal"));
    });

    expect(screen.getByText("Give this meal a name.")).toBeTruthy();
    expect(createSavedMeal).not.toHaveBeenCalled();
  });

  it("updates the existing meal (not create) when saving in edit mode", async () => {
    const createSavedMeal = jest.spyOn(api, "createSavedMeal");
    const updateSavedMeal = jest.spyOn(api, "updateSavedMeal").mockResolvedValue(existingMeal);
    const onSaved = jest.fn();
    const target: SavedMealEditorTarget = { mode: "edit", meal: existingMeal };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={onSaved} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.press(screen.getByText("Save Meal"));
    });

    await waitFor(() => expect(updateSavedMeal).toHaveBeenCalledWith(7, "Breakfast Omelette", existingMeal.ingredients));
    expect(onSaved).toHaveBeenCalledWith(existingMeal);
    expect(createSavedMeal).not.toHaveBeenCalled();
  });

  it("creates a brand-new meal when saving in new mode", async () => {
    const createSavedMeal = jest.spyOn(api, "createSavedMeal").mockResolvedValue({ ...existingMeal, id: 9 });
    jest.spyOn(api, "resolveIngredient").mockResolvedValue({
      calories_per_100g: 52,
      protein_per_100g: 0.3,
      carbs_per_100g: 14,
      fat_per_100g: 0.2,
    });
    const onSaved = jest.fn();
    const target: SavedMealEditorTarget = { mode: "new", meal: null };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={onSaved} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("e.g. Breakfast Omelette"), "Snack Plate");
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("Ingredient name"), "apple");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Add"));
    });
    await waitFor(() => expect(screen.getByText("apple")).toBeTruthy());

    await act(async () => {
      await fireEvent.press(screen.getByText("Save Meal"));
    });

    await waitFor(() =>
      expect(createSavedMeal).toHaveBeenCalledWith(
        "Snack Plate",
        expect.arrayContaining([expect.objectContaining({ name: "apple" })])
      )
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("saves then logs on Save & Log Now", async () => {
    jest.spyOn(api, "updateSavedMeal").mockResolvedValue(existingMeal);
    const logSavedMeal = jest.spyOn(api, "logSavedMeal").mockResolvedValue({
      status: "success",
      streak: 3,
      ingredients: existingMeal.ingredients,
      macros: existingMeal.macros,
      name: existingMeal.name,
    });
    const onLogged = jest.fn();
    const target: SavedMealEditorTarget = { mode: "edit", meal: existingMeal };
    const ref = createRef<BottomSheetModal>();
    await render(<SavedMealEditorSheet ref={ref} target={target} onSaved={() => {}} onLogged={onLogged} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.press(screen.getByText("Save & Log Now"));
    });

    await waitFor(() => expect(logSavedMeal).toHaveBeenCalledWith(7));
    expect(onLogged).toHaveBeenCalled();
  });
});
