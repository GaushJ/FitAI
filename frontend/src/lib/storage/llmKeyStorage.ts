// LLM provider keys never leave the browser — they are stored here and sent as
// request headers (X-Anthropic-Key etc.) so the backend never persists them.
const LOCAL_KEYS_STORAGE_KEY = "fitvoice_api_keys";

export type LlmKeys = Record<string, string>;

export const loadLlmKeys = (): LlmKeys => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_KEYS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LlmKeys) : {};
  } catch {
    return {};
  }
};

const persist = (keys: LlmKeys) => {
  try {
    window.localStorage.setItem(LOCAL_KEYS_STORAGE_KEY, JSON.stringify(keys));
  } catch {
    /* private browsing — ignore */
  }
};

export const saveLlmKey = (provider: string, apiKey: string) => {
  persist({ ...loadLlmKeys(), [provider]: apiKey });
};

export const removeLlmKey = (provider: string) => {
  const keys = loadLlmKeys();
  delete keys[provider];
  persist(keys);
};

/** Headers carrying any stored keys — merged into requests that invoke LLMs. */
export const getLlmKeyHeaders = (): Record<string, string> => {
  const keys = loadLlmKeys();
  const headers: Record<string, string> = {};
  if (keys.anthropic) headers["X-Anthropic-Key"] = keys.anthropic;
  if (keys.groq) headers["X-Groq-Key"] = keys.groq;
  return headers;
};
