import { render, screen } from "@testing-library/react-native";
import { StatsGrid } from "../StatsGrid";

describe("StatsGrid", () => {
  it("renders all four stat values", async () => {
    await render(
      <StatsGrid stats={{ current_streak: 6, best_streak: 14, total_days_logged: 58, total_meals: 132 }} />
    );

    expect(screen.getByText("6 days")).toBeTruthy();
    expect(screen.getByText("14 days")).toBeTruthy();
    expect(screen.getByText("58 days")).toBeTruthy();
    expect(screen.getByText("132")).toBeTruthy();
  });
});
