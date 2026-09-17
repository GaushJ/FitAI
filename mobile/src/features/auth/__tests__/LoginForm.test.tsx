import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { AuthProvider } from "../AuthContext";
import { LoginForm } from "../components/LoginForm";

beforeEach(() => {
  global.fetch = jest.fn(async () => ({
    ok: false,
    status: 401,
    json: async () => ({ detail: "Invalid username or password." }),
    text: async () => JSON.stringify({ detail: "Invalid username or password." }),
  })) as unknown as typeof fetch;
});

describe("LoginForm", () => {
  it("shows the backend's error message when login fails", async () => {
    const onSuccess = jest.fn();
    await render(<AuthProvider><LoginForm onSuccess={onSuccess} onSwitchToSignup={() => {}} /></AuthProvider>);

    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("your_username"), "ada");
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "wrongpass");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Sign In"));
    });

    await waitFor(() => expect(screen.getByText("Invalid username or password.")).toBeTruthy());
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
