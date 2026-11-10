// Backend API base URL — falls back to localhost for local development.
// Set NEXT_PUBLIC_API_URL in your hosting provider's env vars (e.g. Vercel)
// to point at your deployed backend.
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
