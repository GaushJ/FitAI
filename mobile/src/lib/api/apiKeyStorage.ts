import { secureStorage } from "./secureStorage";

/**
 * User-supplied LLM API keys. Like the web app, these live only on the device
 * and are sent as per-request headers — the backend never persists them.
 * The header names are what the backend actually reads (see the
 * `x_anthropic_key` / `x_groq_key` params in backend/routers).
 */
export const API_KEY_PROVIDERS = ["anthropic", "groq"] as const;
export type ApiKeyProvider = (typeof API_KEY_PROVIDERS)[number];

const HEADER_BY_PROVIDER: Record<ApiKeyProvider, string> = {
  anthropic: "X-Anthropic-Key",
  groq: "X-Groq-Key",
};

const storageKey = (provider: ApiKeyProvider) => `getfitbro_api_key_${provider}`;

export function getApiKey(provider: ApiKeyProvider): Promise<string | null> {
  return secureStorage.getItemAsync(storageKey(provider));
}

export function setApiKey(provider: ApiKeyProvider, key: string): Promise<void> {
  return secureStorage.setItemAsync(storageKey(provider), key);
}

export function removeApiKey(provider: ApiKeyProvider): Promise<void> {
  return secureStorage.deleteItemAsync(storageKey(provider));
}

export async function getAllApiKeys(): Promise<Record<ApiKeyProvider, string | null>> {
  const entries = await Promise.all(API_KEY_PROVIDERS.map(async (p) => [p, await getApiKey(p)] as const));
  return Object.fromEntries(entries) as Record<ApiKeyProvider, string | null>;
}

/** Headers for every provider that currently has a key stored. */
export async function getApiKeyHeaders(): Promise<Record<string, string>> {
  const keys = await getAllApiKeys();
  const headers: Record<string, string> = {};
  for (const provider of API_KEY_PROVIDERS) {
    const key = keys[provider];
    if (key) headers[HEADER_BY_PROVIDER[provider]] = key;
  }
  return headers;
}
