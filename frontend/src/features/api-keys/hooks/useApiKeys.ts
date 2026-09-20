"use client";

import { useState } from "react";
import { loadLlmKeys, removeLlmKey, saveLlmKey, type LlmKeys } from "@/lib/storage/llmKeyStorage";
import { API_KEY_PROVIDERS, type ApiKeyProvider } from "@/features/api-keys/providers";

export interface ApiKeyStatus extends ApiKeyProvider {
  isSet: boolean;
  maskedKey: string;
}

const mask = (key: string) => `${key.slice(0, 4)}••••••••${key.slice(-4)}`;

/** Keys live only in this browser's localStorage — this hook is a view over that store. */
export function useApiKeys() {
  const [stored, setStored] = useState<LlmKeys>(loadLlmKeys);

  const keys: ApiKeyStatus[] = API_KEY_PROVIDERS.map((provider) => ({
    ...provider,
    isSet: Boolean(stored[provider.id]),
    maskedKey: stored[provider.id] ? mask(stored[provider.id]) : "",
  }));

  const save = (providerId: string, apiKey: string) => {
    saveLlmKey(providerId, apiKey);
    setStored(loadLlmKeys());
  };

  const remove = (providerId: string) => {
    removeLlmKey(providerId);
    setStored(loadLlmKeys());
  };

  return { keys, missingCount: keys.filter((k) => !k.isSet).length, save, remove };
}
