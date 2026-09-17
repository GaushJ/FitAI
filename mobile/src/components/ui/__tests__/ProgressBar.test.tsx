import { render, screen } from "@testing-library/react-native";
import { ProgressBar } from "../ProgressBar";

describe("ProgressBar", () => {
  it("clamps a percent above 100 to 100 for the fill width", async () => {
    await render(<ProgressBar percent={150} color="bg-macro-calories" />);
    expect(screen.getByTestId("progress-bar-fill")).toHaveStyle({ width: "100%" });
  });

  it("clamps a negative percent to 0", async () => {
    await render(<ProgressBar percent={-20} color="bg-macro-protein" />);
    expect(screen.getByTestId("progress-bar-fill")).toHaveStyle({ width: "0%" });
  });
});
