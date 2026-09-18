import { getApiKey, getApiKeyHeaders, removeApiKey, setApiKey } from "../lib/api/apiKeyStorage";

describe("apiKeyStorage", () => {
  afterEach(async () => {
    await removeApiKey("anthropic");
    await removeApiKey("groq");
  });

  it("stores, reads, and removes a key per provider independently", async () => {
    await setApiKey("anthropic", "sk-ant-123");
    await setApiKey("groq", "gsk_456");

    await expect(getApiKey("anthropic")).resolves.toBe("sk-ant-123");
    await expect(getApiKey("groq")).resolves.toBe("gsk_456");

    await removeApiKey("anthropic");

    await expect(getApiKey("anthropic")).resolves.toBeNull();
    await expect(getApiKey("groq")).resolves.toBe("gsk_456");
  });

  it("builds request headers only for providers that have a key", async () => {
    await expect(getApiKeyHeaders()).resolves.toEqual({});

    await setApiKey("anthropic", "sk-ant-123");
    await expect(getApiKeyHeaders()).resolves.toEqual({ "X-Anthropic-Key": "sk-ant-123" });

    await setApiKey("groq", "gsk_456");
    await expect(getApiKeyHeaders()).resolves.toEqual({
      "X-Anthropic-Key": "sk-ant-123",
      "X-Groq-Key": "gsk_456",
    });
  });
});
