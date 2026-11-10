import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button } from "../Button";

describe("Button", () => {
  it("renders its label and fires onPress", async () => {
    const onPress = jest.fn();
    await render(<Button onPress={onPress}>Log meal</Button>);

    await fireEvent.press(screen.getByText("Log meal"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress when disabled", async () => {
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress} disabled>
        Log meal
      </Button>
    );

    await fireEvent.press(screen.getByText("Log meal"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
