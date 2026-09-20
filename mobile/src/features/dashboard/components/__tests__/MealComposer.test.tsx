import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { MealComposer } from "../MealComposer";
import * as api from "../../api";

jest.mock("../../api");

describe("MealComposer", () => {
  afterEach(() => jest.clearAllMocks());

  it("submits typed text and reports the result, clearing the input", async () => {
    const trackMealWithText = jest.spyOn(api, "trackMealWithText").mockResolvedValue({
      status: "success",
      transcript: "2 eggs",
      streak: 1,
      ingredients: [],
      macros: { calories: 150, protein: 12, carbs: 1, fat: 10 },
      warning: null,
    });
    const onLogged = jest.fn();

    await render(<MealComposer onLogged={onLogged} />);

    const input = screen.getByPlaceholderText("Log a meal… e.g. 2 eggs and toast");
    await act(async () => {
      await fireEvent.changeText(input, "2 eggs");
    });
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Log meal"));
    });

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(trackMealWithText).toHaveBeenCalledWith("2 eggs");
    expect(input.props.value).toBe("");
  });

  it("shows an error banner when the request fails", async () => {
    jest.spyOn(api, "trackMealWithText").mockRejectedValue(new Error("LLM key missing"));

    await render(<MealComposer onLogged={() => {}} />);

    const input = screen.getByPlaceholderText("Log a meal… e.g. 2 eggs and toast");
    await act(async () => {
      await fireEvent.changeText(input, "2 eggs");
    });
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Log meal"));
    });

    await waitFor(() => expect(screen.getByText("LLM key missing")).toBeTruthy());
  });

  it("switches to the recording UI when the mic button is pressed", async () => {
    await render(<MealComposer onLogged={() => {}} />);

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Record a voice note"));
    });

    expect(await screen.findByText("Listening… speak your meal")).toBeTruthy();
  });

  it("opens the scan sheet and shows a success banner after taking a photo", async () => {
    jest.spyOn(ImagePicker, "launchCameraAsync").mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///label.jpg", fileName: "label.jpg", mimeType: "image/jpeg" } as ImagePicker.ImagePickerAsset],
    });
    const scanNutritionLabels = jest.spyOn(api, "scanNutritionLabels").mockResolvedValue({
      status: "success",
      saved: [{ filename: "label.jpg", name: "banana", brand: "", unit: "g", macros: { calories_per_100g: 89, protein_per_100g: 1, carbs_per_100g: 23, fat_per_100g: 0.3 } }],
      failed: [],
    });

    await render(<MealComposer onLogged={() => {}} />);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Scan a nutrition label"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Take Photo"));
    });

    await waitFor(() => expect(scanNutritionLabels).toHaveBeenCalledWith([{ uri: "file:///label.jpg", name: "label.jpg", type: "image/jpeg" }]));
    expect(await screen.findByText("Saved macros for banana.")).toBeTruthy();
  });

  it("shows the partial-failure note when choosing from the library", async () => {
    jest.spyOn(ImagePicker, "launchImageLibraryAsync").mockResolvedValue({
      canceled: false,
      assets: [
        { uri: "file:///a.jpg", fileName: "a.jpg", mimeType: "image/jpeg" } as ImagePicker.ImagePickerAsset,
        { uri: "file:///b.jpg", fileName: "b.jpg", mimeType: "image/jpeg" } as ImagePicker.ImagePickerAsset,
      ],
    });
    jest.spyOn(api, "scanNutritionLabels").mockResolvedValue({
      status: "success",
      saved: [{ filename: "a.jpg", name: "banana", brand: "", unit: "g", macros: { calories_per_100g: 89, protein_per_100g: 1, carbs_per_100g: 23, fat_per_100g: 0.3 } }],
      failed: [{ filename: "b.jpg", error: "Could not parse nutrition data from label." }],
    });

    await render(<MealComposer onLogged={() => {}} />);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Scan a nutrition label"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Choose from Library"));
    });

    expect(await screen.findByText("Saved macros for banana. 1 label couldn't be read.")).toBeTruthy();
  });

  it("shows an error banner when every scanned label fails to parse", async () => {
    jest.spyOn(ImagePicker, "launchCameraAsync").mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///blurry.jpg", fileName: "blurry.jpg", mimeType: "image/jpeg" } as ImagePicker.ImagePickerAsset],
    });
    jest.spyOn(api, "scanNutritionLabels").mockResolvedValue({
      status: "success",
      saved: [],
      failed: [{ filename: "blurry.jpg", error: "Could not parse nutrition data from label." }],
    });

    await render(<MealComposer onLogged={() => {}} />);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Scan a nutrition label"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Take Photo"));
    });

    expect(await screen.findByText("Couldn't read any of the scanned labels. Try clearer, well-lit photos.")).toBeTruthy();
  });

  it("shows an error banner when camera permission is denied", async () => {
    jest.spyOn(ImagePicker, "requestCameraPermissionsAsync").mockResolvedValue({ granted: false } as Awaited<ReturnType<typeof ImagePicker.requestCameraPermissionsAsync>>);

    await render(<MealComposer onLogged={() => {}} />);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Scan a nutrition label"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Take Photo"));
    });

    expect(await screen.findByText("Camera permission is required to scan a label.")).toBeTruthy();
  });

  it("does nothing when the user cancels the picker", async () => {
    jest.spyOn(ImagePicker, "launchCameraAsync").mockResolvedValue({ canceled: true, assets: null });
    const scanNutritionLabels = jest.spyOn(api, "scanNutritionLabels");

    await render(<MealComposer onLogged={() => {}} />);
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Scan a nutrition label"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Take Photo"));
    });

    expect(scanNutritionLabels).not.toHaveBeenCalled();
  });
});
