import { createRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { IngredientEditorSheet, type IngredientEditTarget } from "../IngredientEditorSheet";
import * as api from "../../api";

jest.mock("../../api");

const target: IngredientEditTarget = {
  mealId: 1,
  index: 0,
  ingredient: {
    name: "eggs",
    brand: null,
    weight_g: 200,
    calories_per_100g: 155,
    protein_per_100g: 13,
    carbs_per_100g: 1.1,
    fat_per_100g: 11,
  },
};

describe("IngredientEditorSheet", () => {
  afterEach(() => jest.clearAllMocks());

  it("prefills from the target and shows live resulting macros", async () => {
    const ref = createRef<BottomSheetModal>();
    await render(<IngredientEditorSheet ref={ref} target={target} onSaved={() => {}} />);

    await act(async () => {
      ref.current?.present();
    });

    expect(screen.getByDisplayValue("200")).toBeTruthy();
    expect(screen.getByDisplayValue("155")).toBeTruthy();
    // 155 kcal/100g * 200g / 100 = 310 kcal
    expect(screen.getByText("310 kcal")).toBeTruthy();
  });

  it("recomputes resulting macros as weight changes", async () => {
    const ref = createRef<BottomSheetModal>();
    await render(<IngredientEditorSheet ref={ref} target={target} onSaved={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("200"), "100");
    });

    expect(screen.getByText("155 kcal")).toBeTruthy();
  });

  it("saves and calls onSaved with the meal id", async () => {
    const updateMealIngredient = jest.spyOn(api, "updateMealIngredient").mockResolvedValue({
      id: 1,
      ingredients: [],
      macros: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    });
    const onSaved = jest.fn();
    const ref = createRef<BottomSheetModal>();
    await render(<IngredientEditorSheet ref={ref} target={target} onSaved={onSaved} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.press(screen.getByText("Save"));
    });

    await waitFor(() =>
      expect(updateMealIngredient).toHaveBeenCalledWith(1, 0, {
        weight_g: 200,
        calories_per_100g: 155,
        protein_per_100g: 13,
        carbs_per_100g: 1.1,
        fat_per_100g: 11,
      })
    );
    expect(onSaved).toHaveBeenCalledWith(1);
  });

  it("rejects an invalid field instead of saving", async () => {
    const updateMealIngredient = jest.spyOn(api, "updateMealIngredient");
    const ref = createRef<BottomSheetModal>();
    await render(<IngredientEditorSheet ref={ref} target={target} onSaved={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("200"), "not-a-number");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save"));
    });

    expect(screen.getByText("All fields must be valid, non-negative numbers.")).toBeTruthy();
    expect(updateMealIngredient).not.toHaveBeenCalled();
  });
});
