import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { clearAuth, getToken, getUser, storeAuth, type StoredUser } from "@/lib/api/authStorage";
import { registerUnauthorizedHandler, ApiError } from "@/lib/api/client";
import { loginRequest, signupRequest } from "./api";

interface AuthContextValue {
  user: StoredUser | null;
  /** True only during the initial secure-store read on app boot. */
  isBootstrapping: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (name: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      const [token, storedUser] = await Promise.all([getToken(), getUser()]);
      if (token && storedUser) setUser(storedUser);
      setIsBootstrapping(false);
    })();
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => setUser(null));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { access_token, user: loggedInUser } = await loginRequest(username, password);
    await storeAuth(access_token, loggedInUser);
    setUser(loggedInUser);
  }, []);

  const signup = useCallback(async (name: string, username: string, password: string) => {
    const { access_token, user: newUser } = await signupRequest(name, username, password);
    await storeAuth(access_token, newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isBootstrapping, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export { ApiError };
