import { request } from "@/lib/api/client";
import type { StoredUser } from "@/lib/storage/authStorage";

export interface AuthResponse {
  access_token: string;
  user: StoredUser;
}

export const login = (username: string, password: string) =>
  request<AuthResponse>("/api/auth/login", {
    method: "POST",
    json: { username, password },
    auth: false,
    errorMessage: "Login failed.",
  });

export const signup = (payload: { username: string; password: string; name: string }) =>
  request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    json: payload,
    auth: false,
    errorMessage: "Signup failed.",
  });
