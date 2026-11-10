import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { IngredientEditModal } from "../IngredientEditModal";
import * as api from "../../api";

jest.mock("../../api");

const target = {
  mealId: 9,
  index: 1,
  ingredient: { name: "eggs", brand: null, weight_g: 200, calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fat_per_100g: 11 },
};

describe("IngredientEditModal", () => {
  afterEach(() => jest.clearAllMocks());

  it("prefills the ingredient and previews the resulting macros", async () => {
    await render(<IngredientEditModal target={target} onClose={() => {}} onSaved={() => {}} />);

    expect(screen.getByDisplayValue("200")).toBeTruthy();
    expect(screen.getByText("310 kcal")).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("200"), "100");
    });
    expect(screen.getByText("155 kcal")).toBeTruthy();
  });

  it("saves the corrected values", async () => {
    jest.spyOn(api, "updateMealIngredient").mockResolvedValue({ id: 9, ingredients: [], macros: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
    const onSaved = jest.fn();
    await render(<IngredientEditModal target={target} onClose={() => {}} onSaved={onSaved} />);

    await act(async () => {
      await fireEvent.press(screen.getByText("Save"));
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.updateMealIngredient).toHaveBeenCalledWith(9, 1, {
      weight_g: 200,
      calories_per_100g: 155,
      protein_per_100g: 13,
      carbs_per_100g: 1.1,
      fat_per_100g: 11,
    });
  });

  it("shows the error inline when saving fails", async () => {
    jest.spyOn(api, "updateMealIngredient").mockRejectedValue(new Error("Update failed"));
    await render(<IngredientEditModal target={target} onClose={() => {}} onSaved={() => {}} />);

    await act(async () => {
      await fireEvent.press(screen.getByText("Save"));
    });

    expect(await screen.findByText("Update failed")).toBeTruthy();
  });
});
