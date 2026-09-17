import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { AuthProvider } from "../AuthContext";
import { SignupForm } from "../components/SignupForm";

describe("SignupForm", () => {
  it("shows a live mismatch warning when confirm password differs, and clears it once they match", async () => {
    await render(
      <AuthProvider>
        <SignupForm onSuccess={() => {}} onSwitchToLogin={() => {}} />
      </AuthProvider>
    );

    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("Min 6 characters"), "supersecret");
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "different");
    });

    expect(screen.getByText("Passwords don't match.")).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("••••••••"), "supersecret");
    });

    expect(screen.queryByText("Passwords don't match.")).toBeNull();
  });

  it("lowercases and strips spaces from the username as it's typed", async () => {
    await render(
      <AuthProvider>
        <SignupForm onSuccess={() => {}} onSwitchToLogin={() => {}} />
      </AuthProvider>
    );

    const usernameInput = screen.getByPlaceholderText("your_handle");
    await act(async () => {
      await fireEvent.changeText(usernameInput, "Ada Lovelace");
    });

    expect(usernameInput.props.value).toBe("ada_lovelace");
  });
});
