import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * JWT + user persistence — the mobile replacement for the web app's
 * localStorage (`fitvoice_auth_token`/`fitvoice_auth_user`). Never use
 * AsyncStorage for these: both are secrets/PII-adjacent.
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

const storage = Platform.OS === "web" ? webStorage : SecureStore;

const TOKEN_KEY = "getfitbro_auth_token";
const USER_KEY = "getfitbro_auth_user";

export interface StoredUser {
  id: number;
  name: string;
  username: string;
}

export async function getToken(): Promise<string | null> {
  return storage.getItemAsync(TOKEN_KEY);
}

export async function getUser(): Promise<StoredUser | null> {
  const raw = await storage.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export async function storeAuth(token: string, user: StoredUser): Promise<void> {
  await storage.setItemAsync(TOKEN_KEY, token);
  await storage.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearAuth(): Promise<void> {
  await storage.deleteItemAsync(TOKEN_KEY);
  await storage.deleteItemAsync(USER_KEY);
}
