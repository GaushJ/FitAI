import { render, screen } from "@testing-library/react-native";
import { MacroProgress } from "../MacroProgress";

describe("MacroProgress", () => {
  it("shows rounded current/target calories", async () => {
    await render(
      <MacroProgress
        totals={{ calories: 2400.4, protein: 90, carbs: 60, fat: 40 }}
        targets={{ calories: 2000, protein: 150, carbs: 200, fat: 65 }}
      />
    );

    expect(screen.getByText("2400 / 2000")).toBeTruthy();
  });

  it("renders without dividing by zero when a target is 0", async () => {
    await render(
      <MacroProgress
        totals={{ calories: 500, protein: 10, carbs: 10, fat: 10 }}
        targets={{ calories: 0, protein: 0, carbs: 0, fat: 0 }}
      />
    );

    expect(screen.getByText("Today's Macros")).toBeTruthy();
  });
});
