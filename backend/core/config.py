"""Centralized app configuration — the env vars that used to be read ad hoc
across main.py. Import from here rather than reading os.environ directly in
routers/services, so every config value has exactly one source of truth."""
import os

# ── JWT / Auth configuration ──────────────────────────────────────────────────
# Set JWT_SECRET to a long random string in your hosting provider's env vars.
# The fallback is fine for local development but MUST be overridden in production
# — this default is visible in source, so it provides zero security once deployed.
SECRET_KEY = os.environ.get("JWT_SECRET", "fitvoice-dev-secret-change-me-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

# ── Supported API providers ───────────────────────────────────────────────────
# Metadata only (labels/descriptions) — GET /api/keys never returns actual key
# values. Keys themselves live in the user's browser localStorage, sent per-request
# as headers (X-Anthropic-Key, X-Groq-Key) — see services/llm_provider.py.
SUPPORTED_PROVIDERS = {
    "anthropic": {"label": "Anthropic Claude", "env_key": "ANTHROPIC_API_KEY", "description": "Used for ingredient extraction, macro resolution & label vision (required)"},
    "groq":      {"label": "Groq",             "env_key": "GROQ_API_KEY",      "description": "Ultra-fast Whisper API for speech-to-text"},
    "tavily":    {"label": "Tavily Search",     "env_key": "TAVILY_API_KEY",    "description": "Web search fallback for unknown ingredients"},
}

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOW_ORIGINS = [
    "http://localhost:3000",
    "https://fit-ai-black-one.vercel.app",
]
