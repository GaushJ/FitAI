"""
LLM provider — Anthropic Claude via LangChain.

The API key is read per-request from a ContextVar set by main.py before any
LLM call. This means the key never touches the database — it lives in the
user's browser localStorage and is sent as an X-Anthropic-Key request header.

Fallback chain: request header → ANTHROPIC_API_KEY env var → EnvironmentError.
"""
import os
from contextvars import ContextVar
from langchain_anthropic import ChatAnthropic

_MODEL = "claude-sonnet-4-6"

# Set once per FastAPI request before invoking the graph or any LLM call.
_api_key_ctx: ContextVar[str] = ContextVar("anthropic_api_key", default="")


def set_request_key(key: str) -> None:
    _api_key_ctx.set(key)


def _resolve_key() -> str:
    key = _api_key_ctx.get() or os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise EnvironmentError(
            "No Anthropic API key found. Add your key in the app under Settings → API Keys."
        )
    return key


def get_llm(temperature: float = 0) -> ChatAnthropic:
    return ChatAnthropic(model=_MODEL, api_key=_resolve_key(), temperature=temperature)


def get_resolution_llm(temperature: float = 0) -> ChatAnthropic:
    return get_llm(temperature=temperature)
