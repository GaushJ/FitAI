import { createRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { PortionEditorSheet } from "../PortionEditorSheet";
import * as api from "../../api";
import type { FrequentMeal } from "../../types";

jest.mock("../../api");

const meal: FrequentMeal = {
  id: 5,
  display_name: "Chicken Bowl",
  log_count: 4,
  last_logged: "2026-09-17",
  macros: { calories: 540, protein: 45, carbs: 58, fat: 12 },
  ingredients: [
    { name: "chicken breast", brand: null, weight_g: 150, calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 },
    { name: "white rice", brand: null, weight_g: 180, calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 },
  ],
};

describe("PortionEditorSheet", () => {
  afterEach(() => jest.clearAllMocks());

  it("prefills gram inputs from the meal's current portions", async () => {
    const ref = createRef<BottomSheetModal>();
    await render(<PortionEditorSheet ref={ref} meal={meal} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    expect(screen.getByDisplayValue("150")).toBeTruthy();
    expect(screen.getByDisplayValue("180")).toBeTruthy();
  });

  it("recomputes scaled macro totals as portions change", async () => {
    const ref = createRef<BottomSheetModal>();
    await render(<PortionEditorSheet ref={ref} meal={meal} onLogged={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    // Doubling chicken breast: 165*300/100 + 130*180/100 = 495 + 234 = 729
    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("150"), "300");
    });

    expect(screen.getByText("729 kcal")).toBeTruthy();
  });

  it("logs with the adjusted portions", async () => {
    const logFrequentMeal = jest.spyOn(api, "logFrequentMeal").mockResolvedValue({
      status: "success",
      streak: 2,
      ingredients: [],
      macros: { calories: 729, protein: 50, carbs: 58, fat: 13 },
      display_name: "Chicken Bowl",
    });
    const onLogged = jest.fn();
    const ref = createRef<BottomSheetModal>();
    await render(<PortionEditorSheet ref={ref} meal={meal} onLogged={onLogged} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("150"), "300");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Log with These Portions"));
    });

    await waitFor(() =>
      expect(logFrequentMeal).toHaveBeenCalledWith(5, { "chicken breast": 300, "white rice": 180 })
    );
    expect(onLogged).toHaveBeenCalled();
  });
});
