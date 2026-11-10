import { render, screen, fireEvent } from "@testing-library/react-native";
import { MacroSummary } from "../MacroSummary";
import type { DashboardUser } from "../../types";

const profile: DashboardUser = {
  name: "Ada",
  username: "ada",
  current_streak: 1,
  is_pro: false,
  target_calories: 2003,
  target_protein: 133,
  target_carbs: 244,
  target_fat: 55,
};

describe("MacroSummary", () => {
  it("shows consumed vs target with web's remaining / reached copy", async () => {
    await render(
      <MacroSummary totals={{ calories: 1380.4, protein: 108, carbs: 142, fat: 42 }} profile={profile} onAdjustTargets={() => {}} />
    );

    expect(screen.getByText("1,380")).toBeTruthy();
    expect(screen.getByText("623 kcal remaining")).toBeTruthy();
    expect(screen.getByText("25g remaining")).toBeTruthy();
    expect(screen.getByText("69% reached")).toBeTruthy();
    expect(screen.getByText("Target 2,003")).toBeTruthy();
  });

  it("reports overage and caps the percentage at 150", async () => {
    await render(
      <MacroSummary totals={{ calories: 4000, protein: 10, carbs: 10, fat: 10 }} profile={profile} onAdjustTargets={() => {}} />
    );

    expect(screen.getByText("1997 kcal over target")).toBeTruthy();
    expect(screen.getByText("150% reached")).toBeTruthy();
  });

  it("links to the targets screen", async () => {
    const onAdjustTargets = jest.fn();
    await render(<MacroSummary totals={{ calories: 0, protein: 0, carbs: 0, fat: 0 }} profile={profile} onAdjustTargets={onAdjustTargets} />);

    await fireEvent.press(screen.getByText("Adjust macro targets"));
    expect(onAdjustTargets).toHaveBeenCalled();
  });
});
