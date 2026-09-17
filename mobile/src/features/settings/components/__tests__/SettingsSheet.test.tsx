import { createRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SettingsSheet } from "../SettingsSheet";
import * as api from "../../api";

jest.mock("../../api");

const initialValues = {
  name: "Test User",
  target_calories: 2000,
  target_protein: 150,
  target_carbs: 200,
  target_fat: 65,
};

async function renderSheet(onSaved = jest.fn()) {
  const ref = createRef<BottomSheetModal>();
  await render(<SettingsSheet ref={ref} initialValues={initialValues} onSaved={onSaved} />);
  return { ref, onSaved };
}

describe("SettingsSheet", () => {
  afterEach(() => jest.clearAllMocks());

  it("prefills fields from initialValues and saves valid targets", async () => {
    const updateUser = jest.spyOn(api, "updateUser").mockResolvedValue({
      status: "success",
      user: { ...initialValues, target_calories: 2200 },
    });
    const { ref, onSaved } = await renderSheet();

    await act(async () => {
      ref.current?.present();
    });

    expect(screen.getByDisplayValue("Test User")).toBeTruthy();
    expect(screen.getByDisplayValue("2000")).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("2000"), "2200");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save"));
    });

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ target_calories: 2200 })));
    expect(onSaved).toHaveBeenCalled();
  });

  it("shows a validation error instead of saving when a target is invalid", async () => {
    const updateUser = jest.spyOn(api, "updateUser");
    const { ref } = await renderSheet();

    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("2000"), "not-a-number");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save"));
    });

    expect(screen.getByText("Targets must be valid, non-negative numbers.")).toBeTruthy();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("requires a non-empty name", async () => {
    const { ref } = await renderSheet();
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("Test User"), "   ");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save"));
    });

    expect(screen.getByText("Name is required.")).toBeTruthy();
  });
});
