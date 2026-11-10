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
      await fireEvent.changeText(screen.getByPlaceholderText("your_handle"), "ada");
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "wrongpass");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Sign in"));
    });

    await waitFor(() => expect(screen.getByText("Invalid username or password.")).toBeTruthy());
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("asks for both fields instead of calling the API when one is empty", async () => {
    await render(<AuthProvider><LoginForm onSuccess={() => {}} onSwitchToSignup={() => {}} /></AuthProvider>);

    await act(async () => {
      await fireEvent.press(screen.getByText("Sign in"));
    });

    expect(screen.getByText("Enter your username and password.")).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
