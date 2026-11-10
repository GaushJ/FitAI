import { clearAuth, getToken, getUser, storeAuth } from "../lib/api/authStorage";

describe("authStorage", () => {
  it("stores and retrieves a token and user, then clears both", async () => {
    await storeAuth("test-jwt", { id: 1, name: "Ada", username: "ada" });

    await expect(getToken()).resolves.toBe("test-jwt");
    await expect(getUser()).resolves.toEqual({ id: 1, name: "Ada", username: "ada" });

    await clearAuth();

    await expect(getToken()).resolves.toBeNull();
    await expect(getUser()).resolves.toBeNull();
  });

  it("returns null for a user that was never stored", async () => {
    await expect(getUser()).resolves.toBeNull();
  });
});
