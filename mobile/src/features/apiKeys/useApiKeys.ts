import { useCallback, useEffect, useState } from "react";
import { getAllApiKeys, removeApiKey, setApiKey, type ApiKeyProvider as ProviderId } from "@/lib/api/apiKeyStorage";
import { API_KEY_PROVIDERS, maskKey, type ApiKeyProvider } from "./providers";

export interface ApiKeyStatus extends ApiKeyProvider {
  isSet: boolean;
  maskedKey: string;
}

/** Same view as web's useApiKeys, over the device's secure storage instead of localStorage. */
export function useApiKeys() {
  const [stored, setStored] = useState<Record<ProviderId, string | null>>({ anthropic: null, groq: null, tavily: null });

  const reload = useCallback(() => getAllApiKeys().then(setStored), []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const keys: ApiKeyStatus[] = API_KEY_PROVIDERS.map((provider) => {
    const value = stored[provider.id];
    return { ...provider, isSet: Boolean(value), maskedKey: value ? maskKey(value) : "" };
  });

  const save = async (provider: ProviderId, apiKey: string) => {
    await setApiKey(provider, apiKey);
    await reload();
  };

  const remove = async (provider: ProviderId) => {
    await removeApiKey(provider);
    await reload();
  };

  return { keys, save, remove };
}
