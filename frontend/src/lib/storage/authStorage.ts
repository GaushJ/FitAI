// The JWT returned by /api/auth/login (or /signup) lives here and is sent as
// "Authorization: Bearer <token>" on every authenticated request.
const AUTH_TOKEN_KEY = "fitvoice_auth_token";
const AUTH_USER_KEY = "fitvoice_auth_user";

export interface StoredUser {
  id: number;
  name: string;
  username: string;
}

const isBrowser = () => typeof window !== "undefined";

export const getStoredToken = (): string | null =>
  isBrowser() ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

export const getStoredUser = (): StoredUser | null => {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const storeAuth = (token: string, user: StoredUser) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
};

/** `useSyncExternalStore` subscription for "is a token stored?". */
export const subscribeToAuthChanges = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};
