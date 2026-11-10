import { useState } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { BrandByLabelForm, BrandByNameForm, BrandExcelPanel, BrandPreferenceList } from "..";
import * as api from "../../api";
import * as ingredientsApi from "@/features/ingredients/api";
import type { BrandIdentity, BrandPreference } from "../../types";
import type { Notice } from "@/types/notice";

jest.mock("../../api");
jest.mock("@/features/ingredients/api");

const milk: BrandPreference = {
  ingredient_name: "milk",
  preferred_brand: "nandini toned",
  calories_per_100g: 60,
  protein_per_100g: 3.2,
  carbs_per_100g: 4.7,
  fat_per_100g: 3.5,
  unit: "ml",
};

/** Holds the shared ingredient/brand identity the way the Brands screen does. */
function FormHarness({ Form, onNotice, onSaved }: { Form: typeof BrandByNameForm; onNotice: (n: Notice | null) => void; onSaved: () => void }) {
  const [identity, setIdentity] = useState<BrandIdentity>({ ingredient: "", brand: "" });
  return <Form identity={identity} onIdentityChange={setIdentity} onSaved={onSaved} onNotice={onNotice} />;
}

const fillIdentity = async (ingredient: string, brand: string) => {
  await act(async () => {
    await fireEvent.changeText(screen.getByPlaceholderText("e.g. greek yogurt"), ingredient);
  });
  await act(async () => {
    await fireEvent.changeText(screen.getByPlaceholderText("e.g. Epigamia No Added Sugar"), brand);
  });
};

describe("BrandByNameForm", () => {
  afterEach(() => jest.clearAllMocks());

  it("fetches macros, lets them be edited, then saves with web's message", async () => {
    jest.spyOn(ingredientsApi, "resolveIngredient").mockResolvedValue({
      calories_per_100g: 89,
      protein_per_100g: 1.1,
      carbs_per_100g: 23,
      fat_per_100g: 0.3,
    });
    jest.spyOn(api, "saveBrandPreference").mockResolvedValue({});
    const onNotice = jest.fn();
    const onSaved = jest.fn();
    await render(<FormHarness Form={BrandByNameForm} onNotice={onNotice} onSaved={onSaved} />);

    await fillIdentity("banana", "generic");
    await act(async () => {
      await fireEvent.press(screen.getByText("Fetch"));
    });
    expect(await screen.findByText("Macros fetched — edit if needed, then save.")).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("Energy"), "90");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save preference"));
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.saveBrandPreference).toHaveBeenCalledWith({
      ingredient_name: "banana",
      preferred_brand: "generic",
      calories_per_100g: 90,
      protein_per_100g: 1.1,
      carbs_per_100g: 23,
      fat_per_100g: 0.3,
    });
    expect(onNotice).toHaveBeenLastCalledWith({ tone: "success", text: 'Saved "generic banana" with macros.' });
  });

  it("saves without macros when Fetch was never used", async () => {
    jest.spyOn(api, "saveBrandPreference").mockResolvedValue({});
    await render(<FormHarness Form={BrandByNameForm} onNotice={() => {}} onSaved={() => {}} />);

    await fillIdentity("oats", "quaker");
    await act(async () => {
      await fireEvent.press(screen.getByText("Save preference"));
    });

    await waitFor(() => expect(api.saveBrandPreference).toHaveBeenCalledWith({ ingredient_name: "oats", preferred_brand: "quaker" }));
  });
});

describe("BrandByLabelForm", () => {
  it("extracts a label photo and shows the macros it read", async () => {
    jest.spyOn(ImagePicker, "launchImageLibraryAsync").mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///label.jpg", fileName: "label.jpg", mimeType: "image/jpeg" } as ImagePicker.ImagePickerAsset],
    });
    jest.spyOn(api, "extractBrandLabel").mockResolvedValue({
      status: "success",
      ingredient_name: "orange juice",
      preferred_brand: "tropicana",
      macros: { calories_per_100g: 45, protein_per_100g: 0.7, carbs_per_100g: 10, fat_per_100g: 0.2 },
      unit: "ml",
      source: "label_image",
    });
    const onNotice = jest.fn();
    await render(<FormHarness Form={BrandByLabelForm} onNotice={onNotice} onSaved={() => {}} />);

    await fillIdentity("orange juice", "tropicana");
    await act(async () => {
      await fireEvent.press(screen.getByText("ml"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Upload a nutrition label photo"));
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Extract & save label"));
    });

    await waitFor(() =>
      expect(api.extractBrandLabel).toHaveBeenCalledWith({
        ingredient: "orange juice",
        brand: "tropicana",
        image: { uri: "file:///label.jpg", name: "label.jpg", type: "image/jpeg" },
        unit: "ml",
      })
    );
    expect(screen.getByText("kcal/100ml")).toBeTruthy();
    expect(onNotice).toHaveBeenLastCalledWith({
      tone: "success",
      text: 'Label read! Exact macros for "tropicana orange juice" saved permanently.',
    });
  });
});

describe("BrandPreferenceList", () => {
  afterEach(() => jest.clearAllMocks());

  it("filters by ingredient or brand and says when nothing matches", async () => {
    await render(<BrandPreferenceList preferences={[milk, { ...milk, ingredient_name: "oats", preferred_brand: "saffola" }]} onRemove={() => {}} onChanged={() => {}} />);

    expect(screen.getByText("2 listed")).toBeTruthy();
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("Filter preferences"), "saff");
    });
    expect(screen.queryByText("milk")).toBeNull();
    expect(screen.getByText("1 listed")).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("Filter preferences"), "zzz");
    });
    expect(screen.getByText(/No preferences match/)).toBeTruthy();
  });

  it("saves a brand-only change through the rename endpoint", async () => {
    jest.spyOn(api, "renameBrandPreference").mockResolvedValue({});
    jest.spyOn(api, "updateBrandPreferenceMacros").mockResolvedValue({});
    const onChanged = jest.fn();
    await render(<BrandPreferenceList preferences={[milk]} onRemove={() => {}} onChanged={onChanged} />);

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Edit preference"));
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByDisplayValue("nandini toned"), "amul gold");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save changes"));
    });

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(api.renameBrandPreference).toHaveBeenCalledWith("milk", { new_ingredient_name: "milk", new_brand: "amul gold" });
    expect(api.updateBrandPreferenceMacros).toHaveBeenCalledWith("milk", {
      calories_per_100g: 60,
      protein_per_100g: 3.2,
      carbs_per_100g: 4.7,
      fat_per_100g: 3.5,
    });
  });

  it("removes a preference", async () => {
    const onRemove = jest.fn();
    await render(<BrandPreferenceList preferences={[milk]} onRemove={onRemove} onChanged={() => {}} />);

    await fireEvent.press(screen.getByLabelText("Remove preference"));
    expect(onRemove).toHaveBeenCalledWith("milk");
  });

  it("shows web's empty state", async () => {
    await render(<BrandPreferenceList preferences={[]} onRemove={() => {}} onChanged={() => {}} />);
    expect(screen.getByText("No brand preferences yet")).toBeTruthy();
  });
});

describe("BrandExcelPanel", () => {
  afterEach(() => jest.clearAllMocks());

  it("exports the spreadsheet to the share sheet", async () => {
    jest.spyOn(api, "exportBrandPreferences").mockResolvedValue({ uri: "file:///cache/brands.xlsx" } as never);
    await render(<BrandExcelPanel preferenceCount={3} onImported={() => {}} />);

    expect(screen.getByText("Downloads all 3 saved brands with their nutrition data as .xlsx.")).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByText("Export .xlsx"));
    });

    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///cache/brands.xlsx", expect.any(Object)));
  });

  it("imports a picked .xlsx and reports the result", async () => {
    jest.spyOn(DocumentPicker, "getDocumentAsync").mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///brands.xlsx", name: "brands.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } as DocumentPicker.DocumentPickerAsset],
    });
    jest.spyOn(api, "importBrandPreferences").mockResolvedValue({ message: "Imported 4 preferences.", warnings: ["row 3 skipped"] });
    const onImported = jest.fn();
    await render(<BrandExcelPanel preferenceCount={0} onImported={onImported} />);

    await act(async () => {
      await fireEvent.press(screen.getByText("Import .xlsx"));
    });

    expect(await screen.findByText("Imported 4 preferences.  ⚠️ 1 warning(s).")).toBeTruthy();
    expect(onImported).toHaveBeenCalled();
  });
});
