import { apiRequest } from "@/lib/api/client";
import type { AuthResponse } from "./types";

export function loginRequest(username: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    json: { username, password },
    skipAuth: true,
  });
}

export function signupRequest(name: string, username: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/api/auth/signup", {
    method: "POST",
    json: { name, username, password },
    skipAuth: true,
  });
}
