import { createRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { AuthProvider } from "@/features/auth/AuthContext";
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
  await render(
    <AuthProvider>
      <SettingsSheet ref={ref} initialValues={initialValues} onSaved={onSaved} />
    </AuthProvider>
  );
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

  it("logs out and dismisses the sheet when Log Out is pressed", async () => {
    const { ref } = await renderSheet();
    await act(async () => {
      ref.current?.present();
    });

    expect(screen.getByText("Log Out")).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByText("Log Out"));
    });

    expect(screen.queryByDisplayValue("Test User")).toBeNull();
  });

  describe("body profile & target calculator", () => {
    const plan = {
      bmr: 1780,
      tdee: 2759,
      bmi: 24.7,
      goal: "recomposition" as const,
      calories: 2608,
      protein: 176,
      carbs: 314,
      fat: 72,
      calorie_adjustment: -151,
      warnings: [] as string[],
    };

    async function openSheet(values: Parameters<typeof SettingsSheet>[0]["initialValues"] = initialValues) {
      const ref = createRef<BottomSheetModal>();
      const onSaved = jest.fn();
      await render(
        <AuthProvider>
          <SettingsSheet ref={ref} initialValues={values} onSaved={onSaved} />
        </AuthProvider>
      );
      await act(async () => {
        ref.current?.present();
      });
      return { onSaved };
    }

    async function fillBody() {
      await act(async () => {
        await fireEvent.press(screen.getByText("Male"));
        await fireEvent.changeText(screen.getByLabelText("Age (yrs)"), "30");
        await fireEvent.changeText(screen.getByLabelText("Height (cm)"), "180");
        await fireEvent.changeText(screen.getByLabelText("Weight (kg)"), "80");
        await fireEvent.press(screen.getByText("Moderately active"));
        await fireEvent.press(screen.getByText("Recomposition"));
      });
    }

    async function pressCalculate() {
      await act(async () => {
        await fireEvent.press(screen.getByText("Calculate my targets"));
      });
    }

    it("prefills the saved body profile", async () => {
      await openSheet({
        ...initialValues,
        sex: "female",
        age: 25,
        height_cm: 165,
        weight_kg: 60,
        activity_level: "light",
        goal: "maintain",
      });
      expect(screen.getByDisplayValue("25")).toBeTruthy();
      expect(screen.getByDisplayValue("165")).toBeTruthy();
      expect(screen.getByText("Exercise 1–3 days a week")).toBeTruthy();
    });

    it("does not calculate until the body form is complete", async () => {
      const calculateTargets = jest.spyOn(api, "calculateTargets");
      await openSheet();
      await pressCalculate();
      expect(calculateTargets).not.toHaveBeenCalled();
    });

    it("fills the targets from the suggested plan and shows how it was reached", async () => {
      const calculateTargets = jest.spyOn(api, "calculateTargets").mockResolvedValue(plan);
      await openSheet();
      await fillBody();
      await pressCalculate();

      expect(calculateTargets).toHaveBeenCalledWith({
        sex: "male",
        age: 30,
        height_cm: 180,
        weight_kg: 80,
        activity_level: "moderate",
        goal: "recomposition",
      });
      expect(screen.getByDisplayValue("2608")).toBeTruthy();
      expect(screen.getByDisplayValue("176")).toBeTruthy();
      expect(screen.getByText("Suggested for: Recomposition")).toBeTruthy();
      expect(screen.getByText("2,759 kcal")).toBeTruthy();
    });

    it("shows safety warnings returned with the plan", async () => {
      jest.spyOn(api, "calculateTargets").mockResolvedValue({ ...plan, warnings: ["Your BMI is 17.3 (under 18.5)."] });
      await openSheet();
      await fillBody();
      await pressCalculate();
      expect(screen.getByText("Your BMI is 17.3 (under 18.5).")).toBeTruthy();
    });

    it("discards a stale suggestion when the body inputs change", async () => {
      jest.spyOn(api, "calculateTargets").mockResolvedValue(plan);
      await openSheet();
      await fillBody();
      await pressCalculate();
      await act(async () => {
        await fireEvent.changeText(screen.getByLabelText("Weight (kg)"), "85");
      });
      expect(screen.queryByText("Suggested for: Recomposition")).toBeNull();
    });

    it("updates calories when a macro is edited (4/4/9)", async () => {
      await openSheet();
      await act(async () => {
        await fireEvent.changeText(screen.getByLabelText("Protein (g)"), "210");
      });
      expect(screen.getByLabelText("Calories").props.value).toBe(String(210 * 4 + 200 * 4 + 65 * 9));
      expect(screen.getByText("≈ 840 kcal")).toBeTruthy(); // the protein hint follows the edit
    });

    it("rescales the macros, keeping their proportions, when calories are edited", async () => {
      await openSheet();
      const calories = screen.getByLabelText("Calories");
      await act(async () => {
        await fireEvent.changeText(calories, "1500");
      });
      // Typing alone must not rewrite the macros...
      expect(screen.getByLabelText("Protein (g)").props.value).toBe("150");
      await act(async () => {
        await fireEvent(calories, "endEditing");
      });
      // ...committing does.
      const p = Number(screen.getByLabelText("Protein (g)").props.value);
      const c = Number(screen.getByLabelText("Carbs (g)").props.value);
      const f = Number(screen.getByLabelText("Fat (g)").props.value);
      expect(p).toBeLessThan(150);
      expect(Math.abs(4 * p + 4 * c + 9 * f - 1500)).toBeLessThanOrEqual(10);
      expect(screen.getByLabelText("Calories").props.value).toBe(String(4 * p + 4 * c + 9 * f));
    });

    it("saves the body profile along with the targets", async () => {
      const updateUser = jest.spyOn(api, "updateUser").mockResolvedValue({ status: "success", user: { ...initialValues } });
      const { onSaved } = await openSheet();
      await fillBody();
      await act(async () => {
        await fireEvent.press(screen.getByText("Save"));
      });

      await waitFor(() =>
        expect(updateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test User",
            sex: "male",
            age: 30,
            height_cm: 180,
            weight_kg: 80,
            activity_level: "moderate",
            goal: "recomposition",
          })
        )
      );
      expect(onSaved).toHaveBeenCalled();
    });

    it("saves targets without body fields when the profile is left blank", async () => {
      const updateUser = jest.spyOn(api, "updateUser").mockResolvedValue({ status: "success", user: { ...initialValues } });
      await openSheet();
      await act(async () => {
        await fireEvent.press(screen.getByText("Save"));
      });
      await waitFor(() => expect(updateUser).toHaveBeenCalled());
      expect(updateUser.mock.calls[0][0]).not.toHaveProperty("sex");
      expect(updateUser.mock.calls[0][0]).not.toHaveProperty("age");
    });

    it("surfaces an error when the calculation fails", async () => {
      jest.spyOn(api, "calculateTargets").mockRejectedValue(new Error("Age must be at least 18"));
      await openSheet();
      await fillBody();
      await pressCalculate();
      expect(screen.getByText("Age must be at least 18")).toBeTruthy();
    });
  });
});
