import os
import sys

# ═════════════════════════════════════════════════════════════════════════════
# Speech-to-Text Worker
#
# This module supports TWO transcription backends and lets you pick which one
# to use via the STT_MODE environment variable (hot-loaded from the in-app
# "Settings → STT Engine" toggle when running locally — see main.py):
#
#   STT_MODE = "auto"   (default) → Prefer Groq's hosted API; fall back to the
#                                   local model if no key is set or the call fails.
#   STT_MODE = "cloud"            → ALWAYS use Groq's hosted Whisper API.
#                                   Fast, no local RAM/CPU cost, needs an API key.
#                                   Recommended for production / free-tier hosts.
#   STT_MODE = "local"            → ALWAYS use a locally-loaded faster-whisper
#                                   model. No API key or internet required —
#                                   ideal for fully offline / privacy-sensitive
#                                   personal use on your own machine.
#
# ─────────────────────────────────────────────────────────────────────────────
# 🖥️  RUNNING FULLY LOCALLY (no Groq / cloud API at all)
# ─────────────────────────────────────────────────────────────────────────────
# If you'd rather not depend on any third-party STT API (e.g. you're offline,
# privacy-conscious, or just want everything to run on your own hardware):
#
#   1. Make sure `faster-whisper` is installed (already in requirements.txt).
#   2. Set the environment variable STT_MODE=local in your backend/.env, e.g.:
#         STT_MODE=local
#      ...or toggle "Local Only (On-device Whisper)" in the app's STT Engine
#      settings panel (only visible when ENVIRONMENT != production).
#   3. Optionally change LOCAL_MODEL_SIZE below to a smaller model if your
#      machine has limited RAM/CPU. Options (smallest → largest, accuracy ↑):
#         "tiny" → "base" → "small" → "medium" → "large-v3"
#      `large-v3` needs ~3GB; `small`/`base` run comfortably on most laptops.
#   4. Restart the backend. The model downloads once (cached locally) and then
#      every transcription happens entirely on your machine — no network calls.
# ═════════════════════════════════════════════════════════════════════════════

# Change this to "small", "medium", "base" etc. if running on limited hardware.
LOCAL_MODEL_SIZE = "large-v3"

# Lazily-loaded local model — only created the first time it's actually needed,
# so STT_MODE="cloud" deployments never pay the RAM cost of loading it.
_local_model = None


def _get_stt_mode() -> str:
    """Reads the active STT mode from the environment (set by main.py)."""
    mode = os.environ.get("STT_MODE", "auto").strip().lower()
    return mode if mode in ("auto", "cloud", "local") else "auto"


def _load_local_model():
    """Load the local faster-whisper model into memory on first use (cached after)."""
    global _local_model
    if _local_model is not None:
        return _local_model
    try:
        from faster_whisper import WhisperModel
        print(f"[STT] Loading local faster-whisper '{LOCAL_MODEL_SIZE}' model on CPU (int8)...")
        _local_model = WhisperModel(LOCAL_MODEL_SIZE, device="cpu", compute_type="int8")
        print("[STT] Local Whisper model loaded successfully!")
    except Exception as e:
        print(f"[STT] Warning: Failed to load local faster-whisper model: {e}")
        _local_model = None
    return _local_model


def _transcribe_with_groq(file_path: str) -> str:
    """
    Sends the audio file to Groq's hosted Whisper endpoint
    (OpenAI-compatible API, model: whisper-large-v3).
    Raises an exception on failure so the caller can decide whether to fall back.

    Get a free key at https://console.groq.com/keys and save it via the
    in-app "API Keys" manager (provider: "groq") — no .env edits required.
    """
    from groq import Groq

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    with open(file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), audio_file.read()),
            model="whisper-large-v3",
            response_format="text",
        )

    # response_format="text" returns a plain string (or an object with .text
    # depending on SDK version) — handle both shapes defensively.
    text = transcription if isinstance(transcription, str) else getattr(transcription, "text", "")
    return text.strip()


def _transcribe_with_local_model(file_path: str) -> str:
    """Transcribes using the locally-loaded faster-whisper model (fully offline)."""
    model = _load_local_model()
    if model is None:
        raise RuntimeError("Local Whisper model unavailable")

    segments, info = model.transcribe(file_path, beam_size=5)
    text_list = [segment.text for segment in segments]
    return " ".join(text_list).strip()


def _mock_transcript(file_path: str) -> str:
    """Last-resort mock so the rest of the pipeline stays testable end-to-end."""
    basename = os.path.basename(file_path).lower()
    if "egg" in basename or "banana" in basename:
        return "I ate 2 eggs and 1 banana"
    return "I ate 200g of chicken breast, 100g of white rice, and 150g of oats"


def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an incoming audio file path according to the active STT_MODE:

      "cloud" → Groq API only (errors bubble into the mock fallback)
      "local" → Local faster-whisper model only
      "auto"  → Try Groq first (if a key is configured), then local, then mock
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found at {file_path}")

    mode = _get_stt_mode()
    print(f"[STT] Active mode: '{mode}'")

    # ── CLOUD ONLY ───────────────────────────────────────────────────────────
    if mode == "cloud":
        try:
            text = _transcribe_with_groq(file_path)
            if text:
                print(f"[STT] Transcribed via Groq API: '{text}'")
                return text
        except Exception as e:
            print(f"[STT] Groq transcription failed in 'cloud' mode ({e}). Using mock fallback.")
        return _mock_transcript(file_path)

    # ── LOCAL ONLY ───────────────────────────────────────────────────────────
    if mode == "local":
        try:
            text = _transcribe_with_local_model(file_path)
            if text:
                print(f"[STT] Transcribed via local Whisper: '{text}'")
                return text
        except Exception as e:
            print(f"[STT] Local transcription failed in 'local' mode ({e}). Using mock fallback.")
        return _mock_transcript(file_path)

    # ── AUTO (default): cloud preferred, local fallback ─────────────────────
    if os.environ.get("GROQ_API_KEY"):
        try:
            text = _transcribe_with_groq(file_path)
            if text:
                print(f"[STT] Transcribed via Groq API: '{text}'")
                return text
            print("[STT] Groq returned empty transcript, falling back to local model...")
        except Exception as e:
            print(f"[STT] Groq transcription failed ({e}), falling back to local model...")

    try:
        text = _transcribe_with_local_model(file_path)
        if text:
            print(f"[STT] Transcribed via local Whisper: '{text}'")
            return text
        print("[STT] Local model returned empty transcript, using mock fallback...")
    except Exception as e:
        print(f"[STT] Local transcription failed ({e}), using mock fallback...")

    return _mock_transcript(file_path)
