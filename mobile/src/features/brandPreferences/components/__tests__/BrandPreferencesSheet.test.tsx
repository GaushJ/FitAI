import { createRef } from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as ImagePicker from "expo-image-picker";
import { BrandPreferencesSheet } from "../BrandPreferencesSheet";
import * as api from "../../api";
import type { BrandPreference } from "../../types";

jest.mock("../../api");

const milkPref: BrandPreference = {
  ingredient_name: "milk",
  preferred_brand: "nandini toned",
  calories_per_100g: 60,
  protein_per_100g: 3.2,
  carbs_per_100g: 4.7,
  fat_per_100g: 3.5,
  unit: "g",
};

async function presentSheet() {
  const ref = createRef<BottomSheetModal>();
  await render(<BrandPreferencesSheet ref={ref} />);
  await act(async () => {
    ref.current?.present();
  });
  return ref;
}

describe("BrandPreferencesSheet", () => {
  afterEach(() => jest.clearAllMocks());

  it("loads and lists saved preferences on mount", async () => {
    jest.spyOn(api, "getBrandPreferences").mockResolvedValue([milkPref]);

    await presentSheet();

    expect(await screen.findByText("milk")).toBeTruthy();
    expect(screen.getByText("nandini toned")).toBeTruthy();
    expect(screen.getByText("(1)")).toBeTruthy();
  });

  it("shows the empty state when there are no saved preferences", async () => {
    jest.spyOn(api, "getBrandPreferences").mockResolvedValue([]);

    await presentSheet();

    expect(await screen.findByText("No saved preferences yet.")).toBeTruthy();
  });

  describe("By Name tab", () => {
    it("fetches macros then saves a preference with them", async () => {
      jest.spyOn(api, "getBrandPreferences").mockResolvedValue([]);
      jest.spyOn(api, "resolveIngredientMacros").mockResolvedValue({
        calories_per_100g: 89,
        protein_per_100g: 1.1,
        carbs_per_100g: 23,
        fat_per_100g: 0.3,
      });
      const saveBrandPreference = jest.spyOn(api, "saveBrandPreference").mockResolvedValue({
        status: "success",
        ingredient_name: "banana",
        preferred_brand: "generic",
      });

      await presentSheet();
      await waitFor(() => expect(api.getBrandPreferences).toHaveBeenCalled());

      await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText("e.g. milk"), "banana");
      });
      await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText("e.g. Nandini toned"), "generic");
      });
      await act(async () => {
        await fireEvent.press(screen.getByText("Fetch Macros"));
      });

      await waitFor(() => expect(screen.getByText("Per 100g — edit if needed")).toBeTruthy());

      await act(async () => {
        await fireEvent.press(screen.getByText("Save Preference"));
      });

      await waitFor(() =>
        expect(saveBrandPreference).toHaveBeenCalledWith({
          ingredient_name: "banana",
          preferred_brand: "generic",
          calories_per_100g: 89,
          protein_per_100g: 1.1,
          carbs_per_100g: 23,
          fat_per_100g: 0.3,
        })
      );
      expect(await screen.findByText("Saved banana → generic.")).toBeTruthy();
    });

    it("saves without macros when Fetch Macros was never used", async () => {
      jest.spyOn(api, "getBrandPreferences").mockResolvedValue([]);
      const saveBrandPreference = jest.spyOn(api, "saveBrandPreference").mockResolvedValue({
        status: "success",
        ingredient_name: "oats",
        preferred_brand: "quaker",
      });

      await presentSheet();
      await waitFor(() => expect(api.getBrandPreferences).toHaveBeenCalled());

      await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText("e.g. milk"), "oats");
      });
      await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText("e.g. Nandini toned"), "quaker");
      });
      await act(async () => {
        await fireEvent.press(screen.getByText("Save Preference"));
      });

      await waitFor(() =>
        expect(saveBrandPreference).toHaveBeenCalledWith({ ingredient_name: "oats", preferred_brand: "quaker" })
      );
    });
  });

  describe("Label tab", () => {
    it("shows an error when camera permission is denied", async () => {
      jest.spyOn(api, "getBrandPreferences").mockResolvedValue([]);
      jest.spyOn(ImagePicker, "requestCameraPermissionsAsync").mockResolvedValueOnce({
        granted: false,
      } as Awaited<ReturnType<typeof ImagePicker.requestCameraPermissionsAsync>>);

      await presentSheet();
      await act(async () => {
        await fireEvent.press(screen.getByText("Label"));
      });
      await act(async () => {
        await fireEvent.press(screen.getByText("Tap to photograph a nutrition label"));
      });

      expect(await screen.findByText("Camera permission is required to add a label photo.")).toBeTruthy();
    });

    it("extracts and saves a preference from a photographed label", async () => {
      jest.spyOn(api, "getBrandPreferences").mockResolvedValue([]);
      jest.spyOn(ImagePicker, "launchCameraAsync").mockResolvedValue({
        canceled: false,
        assets: [{ uri: "file:///label.jpg", fileName: "label.jpg", mimeType: "image/jpeg" } as ImagePicker.ImagePickerAsset],
      });
      const saveBrandFromLabel = jest.spyOn(api, "saveBrandFromLabel").mockResolvedValue({
        status: "success",
        ingredient_name: "orange juice",
        preferred_brand: "tropicana",
        macros: { calories_per_100g: 45, protein_per_100g: 0.7, carbs_per_100g: 10, fat_per_100g: 0.2 },
        unit: "g",
        source: "label_image",
      });

      await presentSheet();
      await act(async () => {
        await fireEvent.press(screen.getByText("Label"));
      });
      await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText("e.g. orange juice"), "orange juice");
      });
      await act(async () => {
        await fireEvent.changeText(screen.getByPlaceholderText("e.g. Tropicana"), "tropicana");
      });
      await act(async () => {
        await fireEvent.press(screen.getByText("Tap to photograph a nutrition label"));
      });

      expect(await screen.findByText("Photo added — tap to replace")).toBeTruthy();

      await act(async () => {
        await fireEvent.press(screen.getByText("Extract & Save Label"));
      });

      await waitFor(() =>
        expect(saveBrandFromLabel).toHaveBeenCalledWith({
          ingredientName: "orange juice",
          preferredBrand: "tropicana",
          unit: "g",
          imageUri: "file:///label.jpg",
          imageName: "label.jpg",
          imageType: "image/jpeg",
        })
      );
      expect(await screen.findByText('Label read! Exact macros for "tropicana orange juice" saved.')).toBeTruthy();
    });
  });

  describe("saved preferences list", () => {
    it("edits a preference's macros in place", async () => {
      jest.spyOn(api, "getBrandPreferences").mockResolvedValue([milkPref]);
      const updateBrandPreference = jest.spyOn(api, "updateBrandPreference").mockResolvedValue({
        status: "updated",
        ingredient_name: "milk",
      });

      await presentSheet();
      await screen.findByText("milk");

      await act(async () => {
        await fireEvent.press(screen.getByLabelText("Edit milk"));
      });

      const calInput = screen.getAllByDisplayValue("60")[0];
      await act(async () => {
        await fireEvent.changeText(calInput, "65");
      });
      await act(async () => {
        await fireEvent.press(screen.getByText("Save"));
      });

      await waitFor(() =>
        expect(updateBrandPreference).toHaveBeenCalledWith("milk", "milk", "nandini toned", {
          calories_per_100g: 65,
          protein_per_100g: 3.2,
          carbs_per_100g: 4.7,
          fat_per_100g: 3.5,
        })
      );
      expect(await screen.findByText("Preference updated.")).toBeTruthy();
    });

    it("removes a preference after the delete confirmation", async () => {
      jest.spyOn(api, "getBrandPreferences").mockResolvedValue([milkPref]);
      const deleteBrandPreference = jest.spyOn(api, "deleteBrandPreference").mockResolvedValue({
        status: "deleted",
        ingredient_name: "milk",
      });
      jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
        const remove = buttons?.find((b) => b.text === "Remove");
        remove?.onPress?.();
      });

      await presentSheet();
      await screen.findByText("milk");

      await act(async () => {
        await fireEvent.press(screen.getByLabelText("Remove milk"));
      });

      await waitFor(() => expect(deleteBrandPreference).toHaveBeenCalledWith("milk"));
      expect(screen.queryByText("milk")).toBeNull();
    });
  });
});
