import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";
import { AuthProvider, useAuth } from "../AuthContext";
import { clearAuth, getToken, getUser } from "@/lib/api/authStorage";

function TestConsumer() {
  const { user, isBootstrapping, login, logout } = useAuth();
  if (isBootstrapping) return <Text>loading</Text>;
  return (
    <>
      <Text>{user ? `logged in as ${user.name}` : "logged out"}</Text>
      <Pressable onPress={() => login("ada", "hunter2")}>
        <Text>do-login</Text>
      </Pressable>
      <Pressable onPress={() => logout()}>
        <Text>do-logout</Text>
      </Pressable>
    </>
  );
}

const mockUser = { id: 1, name: "Ada Lovelace", username: "ada" };

beforeEach(() => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ access_token: "jwt-123", token_type: "bearer", user: mockUser }),
  })) as unknown as typeof fetch;
});

afterEach(async () => {
  await clearAuth();
});

describe("AuthContext", () => {
  it("starts logged out when no token is stored, then logs in and persists it", async () => {
    await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("logged out")).toBeTruthy());

    await act(async () => {
      await fireEvent.press(screen.getByText("do-login"));
    });

    expect(screen.getByText("logged in as Ada Lovelace")).toBeTruthy();
    await expect(getToken()).resolves.toBe("jwt-123");
    await expect(getUser()).resolves.toEqual(mockUser);
  });

  it("clears stored auth on logout", async () => {
    await render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => screen.getByText("logged out"));

    await act(async () => {
      await fireEvent.press(screen.getByText("do-login"));
    });
    expect(screen.getByText(/logged in as/)).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByText("do-logout"));
    });

    expect(screen.getByText("logged out")).toBeTruthy();
    await expect(getToken()).resolves.toBeNull();
  });
});
