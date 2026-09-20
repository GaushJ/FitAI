import { apiRequest } from "../lib/api/client";
import { removeApiKey, setApiKey } from "../lib/api/apiKeyStorage";
import { storeAuth, clearAuth } from "../lib/api/authStorage";

function mockFetchOk() {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "{}" });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe("apiRequest LLM key headers", () => {
  afterEach(async () => {
    await removeApiKey("anthropic");
    await removeApiKey("groq");
    await clearAuth();
  });

  it("attaches the stored user keys to authenticated requests", async () => {
    await storeAuth("jwt", { id: 1, name: "Ada", username: "ada" });
    await setApiKey("anthropic", "sk-ant-123");
    await setApiKey("groq", "gsk_456");
    const fetchMock = mockFetchOk();

    await apiRequest("/api/track-meal", { method: "POST", json: {} });

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["X-Anthropic-Key"]).toBe("sk-ant-123");
    expect(headers["X-Groq-Key"]).toBe("gsk_456");
    expect(headers["Authorization"]).toBe("Bearer jwt");
  });

  it("sends no key headers when none are stored", async () => {
    const fetchMock = mockFetchOk();

    await apiRequest("/api/dashboard");

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers["X-Anthropic-Key"]).toBeUndefined();
    expect(headers["X-Groq-Key"]).toBeUndefined();
  });

  it("never sends keys on skipAuth requests like login/signup", async () => {
    await setApiKey("anthropic", "sk-ant-123");
    const fetchMock = mockFetchOk();

    await apiRequest("/api/auth/login", { method: "POST", json: {}, skipAuth: true });

    expect(fetchMock.mock.calls[0][1].headers["X-Anthropic-Key"]).toBeUndefined();
  });
});
