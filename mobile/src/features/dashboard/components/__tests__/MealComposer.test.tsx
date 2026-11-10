import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { MealComposer } from "../MealComposer";
import * as api from "../../api";

jest.mock("../../api");

const notifier = () => ({ success: jest.fn(), error: jest.fn(), clear: jest.fn() });

async function renderComposer(notify = notifier(), onMealLogged = jest.fn()) {
  await render(<MealComposer notify={notify} onMealLogged={onMealLogged} onOpenBrandPreferences={() => {}} />);
  return { notify, onMealLogged };
}

const typeMeal = async (text: string) => {
  await act(async () => {
    await fireEvent.changeText(screen.getByLabelText("Describe your meal"), text);
  });
};

describe("MealComposer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("logs typed text with web's success message and clears the box", async () => {
    jest.spyOn(api, "trackMealWithText").mockResolvedValue({
      status: "success",
      transcript: "2 eggs",
      streak: 1,
      ingredients: [],
      macros: { calories: 150.4, protein: 12, carbs: 1, fat: 10 },
      warning: null,
    });
    const { notify, onMealLogged } = await renderComposer();

    await typeMeal("2 eggs");
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Log this meal"));
    });

    await waitFor(() => expect(onMealLogged).toHaveBeenCalled());
    expect(api.trackMealWithText).toHaveBeenCalledWith("2 eggs");
    expect(notify.success).toHaveBeenCalledWith("Meal logged! 150 kcal tracked.");
    expect(screen.getByLabelText("Describe your meal").props.value).toBe("");
  });

  it("surfaces a backend warning as an error after logging", async () => {
    jest.spyOn(api, "trackMealWithText").mockResolvedValue({
      status: "success",
      transcript: "x",
      streak: 1,
      ingredients: [],
      macros: { calories: 100, protein: 1, carbs: 1, fat: 1 },
      warning: "Guessed the weight",
    });
    const { notify } = await renderComposer();

    await typeMeal("x");
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Log this meal"));
    });

    await waitFor(() => expect(notify.error).toHaveBeenCalledWith("⚠️ Guessed the weight"));
  });

  it("transcribes a voice note into the box for review instead of logging it", async () => {
    jest.spyOn(api, "transcribeAudio").mockResolvedValue({ status: "success", transcript: "a bowl of oats" });
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const { notify } = await renderComposer();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Speak instead"));
    });
    expect(screen.getByText("Listening — tap the square to stop.")).toBeTruthy();

    now.mockReturnValue(5_000);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Stop recording"));
    });

    await waitFor(() => expect(screen.getByLabelText("Describe your meal").props.value).toBe("a bowl of oats"));
    expect(api.trackMealWithText).not.toHaveBeenCalled();
    expect(notify.success).toHaveBeenCalledWith("Transcribed! Review and edit below, then tap send.");
  });

  it("rejects a recording that is too short to transcribe", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const { notify } = await renderComposer();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Speak instead"));
    });
    now.mockReturnValue(1_200);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Stop recording"));
    });

    expect(notify.error).toHaveBeenCalledWith(
      "Recording was too short to transcribe — hold the mic a little longer and speak clearly."
    );
    expect(api.transcribeAudio).not.toHaveBeenCalled();
  });

  it("scans a photographed label and reports what was saved", async () => {
    jest.spyOn(ImagePicker, "launchCameraAsync").mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///a.jpg", fileName: "a.jpg", mimeType: "image/jpeg" } as ImagePicker.ImagePickerAsset],
    });
    jest.spyOn(api, "scanNutritionLabels").mockResolvedValue({
      status: "success",
      saved: [{ filename: "a.jpg", name: "milk", brand: "Amul", unit: "ml", macros: { calories_per_100g: 60, protein_per_100g: 3, carbs_per_100g: 5, fat_per_100g: 3 } }],
      failed: [{ filename: "b.jpg", error: "blurry" }],
    });
    const { notify } = await renderComposer();

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Scan nutrition label(s)"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Take photo"));
    });

    await waitFor(() => expect(notify.success).toHaveBeenCalledWith("Saved macros for Amul milk. 1 label couldn't be read."));
  });
});
