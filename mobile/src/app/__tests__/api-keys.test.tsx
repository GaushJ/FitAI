import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import ApiKeysScreen from "../(tabs)/api-keys";
import { getApiKey, getApiKeyHeaders, removeApiKey, setApiKey } from "@/lib/api/apiKeyStorage";

jest.mock("@/features/profile/ProfileProvider", () => ({
  useProfile: () => ({ profile: { name: "Ada", username: "ada", current_streak: 2, is_pro: false }, refresh: jest.fn() }),
}));

describe("API keys screen", () => {
  afterEach(async () => {
    await Promise.all(["anthropic", "groq", "tavily"].map((p) => removeApiKey(p as "anthropic")));
  });

  it("lists the same three providers as web with their badges", async () => {
    await render(<ApiKeysScreen />);

    // Each provider appears in the status list and in the "Getting a key" guide.
    expect(await screen.findAllByText("Anthropic Claude")).toHaveLength(2);
    expect(screen.getAllByText("Tavily Search")).toHaveLength(2);
    expect(screen.getByText("Not set · Required")).toBeTruthy();
    expect(screen.getAllByText("Not set · Optional")).toHaveLength(2);
    expect(screen.getByText("0 set")).toBeTruthy();
  });

  it("saves a key for the selected provider, masked like web", async () => {
    await render(<ApiKeysScreen />);

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText("API key"), "  sk-ant-abcdefghij  ");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save API key"));
    });

    await waitFor(() => expect(screen.getByText("Anthropic Claude key saved on this device.")).toBeTruthy());
    await expect(getApiKey("anthropic")).resolves.toBe("sk-ant-abcdefghij");
    expect(screen.getByText("sk-a••••••••ghij")).toBeTruthy();
    expect(screen.getByText("1 set")).toBeTruthy();
  });

  it("stores a Tavily key without sending it (the backend reads only Anthropic/Groq, as on web)", async () => {
    await setApiKey("tavily", "tvly-abcdefghij");
    await setApiKey("groq", "gsk_abcdefghij");

    await expect(getApiKeyHeaders()).resolves.toEqual({ "X-Groq-Key": "gsk_abcdefghij" });
  });

  it("removes a stored key", async () => {
    await setApiKey("groq", "gsk_abcdefghij");
    await render(<ApiKeysScreen />);

    await act(async () => {
      await fireEvent.press(await screen.findByLabelText("Remove Groq key"));
    });

    await waitFor(() => expect(screen.getAllByText("Not set · Optional")).toHaveLength(2));
    await expect(getApiKey("groq")).resolves.toBeNull();
  });
});
