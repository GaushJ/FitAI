import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { MealComposer } from "../MealComposer";
import * as api from "../../api";

jest.mock("../../api");

describe("MealComposer", () => {
  afterEach(() => jest.clearAllMocks());

  it("submits typed text and reports the result, clearing the input", async () => {
    const trackMealWithText = jest.spyOn(api, "trackMealWithText").mockResolvedValue({
      status: "success",
      transcript: "2 eggs",
      streak: 1,
      ingredients: [],
      macros: { calories: 150, protein: 12, carbs: 1, fat: 10 },
      warning: null,
    });
    const onLogged = jest.fn();

    await render(<MealComposer onLogged={onLogged} />);

    const input = screen.getByPlaceholderText("Log a meal… e.g. 2 eggs and toast");
    await act(async () => {
      await fireEvent.changeText(input, "2 eggs");
    });
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Log meal"));
    });

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(trackMealWithText).toHaveBeenCalledWith("2 eggs");
    expect(input.props.value).toBe("");
  });

  it("shows an error banner when the request fails", async () => {
    jest.spyOn(api, "trackMealWithText").mockRejectedValue(new Error("LLM key missing"));

    await render(<MealComposer onLogged={() => {}} />);

    const input = screen.getByPlaceholderText("Log a meal… e.g. 2 eggs and toast");
    await act(async () => {
      await fireEvent.changeText(input, "2 eggs");
    });
    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Log meal"));
    });

    await waitFor(() => expect(screen.getByText("LLM key missing")).toBeTruthy());
  });

  it("switches to the recording UI when the mic button is pressed", async () => {
    await render(<MealComposer onLogged={() => {}} />);

    await act(async () => {
      await fireEvent.press(screen.getByLabelText("Record a voice note"));
    });

    expect(await screen.findByText("Listening… speak your meal")).toBeTruthy();
  });
});
