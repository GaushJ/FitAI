import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Shared secret storage for everything that must not live in AsyncStorage
 * (auth token, user, LLM API keys).
 *
 * expo-secure-store has no web implementation (it throws), so on web this
 * falls back to localStorage. iOS/Android — the app's actual targets —
 * always use SecureStore.
 */
const webStorage = {
  getItemAsync: async (key: string) => (typeof localStorage === "undefined" ? null : localStorage.getItem(key)),
  setItemAsync: async (key: string, value: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  },
  deleteItemAsync: async (key: string) => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  },
};

export const secureStorage = Platform.OS === "web" ? webStorage : SecureStore;
