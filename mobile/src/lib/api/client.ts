import { API_BASE_URL } from "./config";
import { clearAuth, getToken } from "./authStorage";

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Set by the root layout so the client can react to session expiry without
 * importing expo-router into this lib (keeps lib/api free of navigation
 * concerns). Called once, on mount.
 */
let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON body — sets Content-Type: application/json and stringifies. Mutually exclusive with `form`. */
  json?: unknown;
  /** multipart/form-data body — pass an already-built FormData (file uploads use {uri, name, type} entries). */
  form?: FormData;
  /** Extra headers, e.g. X-Anthropic-Key/X-Groq-Key for endpoints that accept client-supplied LLM keys. */
  headers?: Record<string, string>;
  /** Skip attaching the Authorization header (auth endpoints only). */
  skipAuth?: boolean;
}

/**
 * Thin fetch wrapper — every network call in the app goes through this, not
 * a direct `fetch`. Centralizes auth-header attachment and 401 handling so
 * individual features never have to think about session expiry themselves.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", json, form, headers = {}, skipAuth = false } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  let body: BodyInit | undefined;

  if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
    // Do not set Content-Type for multipart — fetch sets the boundary itself.
  }

  if (!skipAuth) {
    const token = await getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers: finalHeaders, body });

  if (res.status === 401 && !skipAuth) {
    await clearAuth();
    onUnauthorized?.();
    throw new ApiError(401, "Session expired");
  }

  if (!res.ok) {
    let detail: unknown;
    try {
      detail = await res.json();
    } catch {
      // Non-JSON error body (rare) — leave detail undefined.
    }
    const message =
      (detail && typeof detail === "object" && "detail" in detail
        ? String((detail as { detail: unknown }).detail)
        : undefined) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, detail);
  }

  // 204 / empty-body responses (e.g. some DELETE endpoints) — guard against
  // res.json() throwing on an empty stream.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** For binary responses (e.g. GET /api/brand-preferences/export) — returns the Blob and filename. */
export async function apiRequestBlob(
  path: string,
  options: RequestOptions = {}
): Promise<{ blob: Blob; filename: string | null }> {
  const token = options.skipAuth ? null : await getToken();
  const headers: Record<string, string> = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { method: options.method ?? "GET", headers });

  if (res.status === 401 && !options.skipAuth) {
    await clearAuth();
    onUnauthorized?.();
    throw new ApiError(401, "Session expired");
  }
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);

  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  return { blob: await res.blob(), filename: match?.[1] ?? null };
}
