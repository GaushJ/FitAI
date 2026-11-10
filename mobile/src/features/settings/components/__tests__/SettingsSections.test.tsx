import { Text } from "react-native";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { BodyProfileFields, MacroTargetFields, TargetPlanSummary } from "..";
import { useTargetsForm } from "../../useTargetsForm";
import * as api from "../../api";
import type { UserSettings } from "../../types";

jest.mock("../../api");

const profile: UserSettings = { name: "Test User", target_calories: 2000, target_protein: 150, target_carbs: 200, target_fat: 65 };

/** The Settings screen's form wiring, without the screen's providers. */
function Harness({ onSaved = jest.fn() }: { onSaved?: () => void }) {
  const form = useTargetsForm(profile, onSaved);
  return (
    <>
      <BodyProfileFields
        body={form.body}
        onChange={form.setBodyField}
        canCalculate={form.bodyProfile !== null}
        calculating={form.calculating}
        onCalculate={form.calculate}
      />
      {form.plan ? <TargetPlanSummary plan={form.plan} /> : null}
      <MacroTargetFields
        targets={form.targets}
        onMacroChange={form.setMacro}
        onCaloriesChange={form.setCaloriesText}
        onCaloriesCommit={form.commitCalories}
      />
      <Text onPress={form.save}>save</Text>
      {form.error ? <Text>{form.error}</Text> : null}
    </>
  );
}

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
  warnings: ["Your BMI is 17.3 (under 18.5)."],
};

async function fillBody() {
  await act(async () => {
    await fireEvent.press(screen.getByText("Male"));
    await fireEvent.changeText(screen.getByLabelText(/^Age \(yr\)/), "30");
    await fireEvent.changeText(screen.getByLabelText(/^Height \(cm\)/), "180");
    await fireEvent.changeText(screen.getByLabelText(/^Weight \(kg\)/), "80");
  });
  await act(async () => {
    await fireEvent.press(screen.getByLabelText("Activity level"));
  });
  await act(async () => {
    await fireEvent.press(screen.getByText("Moderately active"));
  });
  await act(async () => {
    await fireEvent.press(screen.getByLabelText("Goal"));
  });
  await act(async () => {
    await fireEvent.press(screen.getByText("Recomposition"));
  });
}

describe("Settings & targets form", () => {
  afterEach(() => jest.clearAllMocks());

  it("shows the macro split and updates calories when a macro is edited (4/4/9)", async () => {
    await render(<Harness />);

    // 150 g × 4 = 600 of 1,985 macro kcal.
    expect(screen.getByText("Protein (30.2%)")).toBeTruthy();
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("Protein grams"), "210");
    });
    expect(screen.getByLabelText("Daily calorie target").props.value).toBe(String(210 * 4 + 200 * 4 + 65 * 9));
    expect(screen.getByText("≈ 840 kcal")).toBeTruthy();
  });

  it("rescales the macros when calories are committed", async () => {
    await render(<Harness />);
    const calories = screen.getByLabelText("Daily calorie target");

    await act(async () => {
      await fireEvent.changeText(calories, "1500");
    });
    expect(screen.getByLabelText("Protein grams").props.value).toBe("150");
    await act(async () => {
      await fireEvent(calories, "endEditing");
    });
    expect(Number(screen.getByLabelText("Protein grams").props.value)).toBeLessThan(150);
  });

  it("calculates targets from the body form and shows web's Mifflin–St Jeor summary", async () => {
    jest.spyOn(api, "calculateTargets").mockResolvedValue(plan);
    await render(<Harness />);

    await fillBody();
    expect(screen.getByText("Exercise 3–5 days a week")).toBeTruthy();
    await act(async () => {
      await fireEvent.press(screen.getByText("Calculate my targets"));
    });

    expect(api.calculateTargets).toHaveBeenCalledWith({
      sex: "male",
      age: 30,
      height_cm: 180,
      weight_kg: 80,
      activity_level: "moderate",
      goal: "recomposition",
    });
    expect(screen.getByLabelText("Daily calorie target").props.value).toBe("2608");
    expect(screen.getByText("Goal: Recomposition")).toBeTruthy();
    expect(screen.getByText("−151 kcal")).toBeTruthy();
    expect(screen.getByText("Your BMI is 17.3 (under 18.5).")).toBeTruthy();
  });

  it("saves targets and the body profile", async () => {
    jest.spyOn(api, "updateUser").mockResolvedValue({ status: "success", user: profile });
    const onSaved = jest.fn();
    await render(<Harness onSaved={onSaved} />);

    await fillBody();
    await act(async () => {
      await fireEvent.press(screen.getByText("save"));
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(api.updateUser).toHaveBeenCalledWith(expect.objectContaining({ name: "Test User", target_calories: 2000, sex: "male", goal: "recomposition" }));
  });

  it("refuses an empty target", async () => {
    await render(<Harness />);
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("Daily calorie target"), "");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("save"));
    });
    expect(screen.getByText("Targets must be valid, non-negative numbers.")).toBeTruthy();
    expect(api.updateUser).not.toHaveBeenCalled();
  });
});
