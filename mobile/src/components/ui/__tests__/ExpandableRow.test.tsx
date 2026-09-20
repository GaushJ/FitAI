import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { ExpandableRow } from "../ExpandableRow";

describe("ExpandableRow", () => {
  it("hides detail content until the header is pressed", async () => {
    await render(
      <ExpandableRow header={<Text>Two eggs and toast</Text>}>
        <Text>320 kcal · 18g protein</Text>
      </ExpandableRow>
    );

    expect(screen.queryByText("320 kcal · 18g protein")).toBeNull();

    await fireEvent.press(screen.getByRole("button"));
    expect(screen.getByText("320 kcal · 18g protein")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button"));
    expect(screen.queryByText("320 kcal · 18g protein")).toBeNull();
  });

  it("starts expanded when defaultExpanded is set", async () => {
    await render(
      <ExpandableRow header={<Text>Header</Text>} defaultExpanded>
        <Text>Detail</Text>
      </ExpandableRow>
    );

    expect(screen.getByText("Detail")).toBeTruthy();
  });
});
