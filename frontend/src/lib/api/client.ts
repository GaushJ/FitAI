import { API_BASE } from "@/lib/config";
import { getStoredToken } from "@/lib/storage/authStorage";
import { getLlmKeyHeaders } from "@/lib/storage/llmKeyStorage";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON request body. */
  json?: unknown;
  /** Multipart request body. */
  form?: FormData;
  /** Send the stored JWT. Defaults to true. */
  auth?: boolean;
  /** Attach the user's stored LLM keys (for endpoints that call an LLM). */
  llmKeys?: boolean;
  /** Message used when the server gives no `detail`. */
  errorMessage?: string;
}

/** Low-level call — returns the raw Response without throwing on HTTP errors. */
export function apiFetch(path: string, options: ApiOptions = {}): Promise<Response> {
  const { method, json, form, auth = true, llmKeys = false } = options;
  const headers: Record<string, string> = {};
  if (json !== undefined) headers["Content-Type"] = "application/json";
  if (auth) headers.Authorization = `Bearer ${getStoredToken() ?? ""}`;
  if (llmKeys) Object.assign(headers, getLlmKeyHeaders());

  return fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: json !== undefined ? JSON.stringify(json) : form,
  });
}

async function readErrorDetail(res: Response): Promise<string | null> {
  try {
    const body = await res.json();
    return typeof body?.detail === "string" ? body.detail : null;
  } catch {
    return null;
  }
}

/** JSON call — throws `ApiError` on non-2xx and resolves to the parsed body. */
export async function request<T = void>(path: string, options: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (!res.ok) {
    const detail = await readErrorDetail(res);
    throw new ApiError(detail || options.errorMessage || `Request failed (${res.status})`, res.status);
  }
  return (await res.json().catch(() => undefined)) as T;
}

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401;
