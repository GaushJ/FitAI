import os

# ═════════════════════════════════════════════════════════════════════════════
# Speech-to-Text — Groq's hosted Whisper API only.
#
# Get a free key at https://console.groq.com/keys and save it via the in-app
# "API Keys" manager (provider: "groq"), or set GROQ_API_KEY as a server env var.
# ═════════════════════════════════════════════════════════════════════════════


def transcribe_audio(file_path: str, groq_api_key: str = "") -> str:
    """
    Transcribes an audio file via Groq's hosted Whisper endpoint.
    Raises on any failure — callers must surface the error rather than log a
    fabricated transcript, since a wrong-but-successful-looking meal log is
    worse than a visible failure.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found at {file_path}")

    from groq import Groq

    api_key = groq_api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise RuntimeError("Groq API key not set. Add one under Settings → API Keys.")

    client = Groq(api_key=api_key)

    with open(file_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), audio_file.read()),
            model="whisper-large-v3",
            response_format="text",
            # Pin the language instead of relying on auto-detect — auto-detect is
            # what caused the earlier hallucination into Spanish on a bad clip.
            language="en",
            # temperature=0 makes decoding deterministic/conservative instead of
            # sampling — reduces the model "getting creative" on ambiguous audio.
            #
            # Deliberately NOT passing `prompt` here: a food-vocabulary prompt
            # was tried and measurably made things worse — on short or
            # low-confidence audio, Whisper leaned on the prompt's own words
            # ("whey protein", "grams") instead of the real audio, producing
            # confident-looking transcripts of things that were never said.
            # Confirmed by testing: changing the prompt text changed what got
            # hallucinated, even on unrelated audio. Not worth the risk.
            temperature=0,
        )

    # response_format="text" returns a plain string (or an object with .text
    # depending on SDK version) — handle both shapes defensively.
    text = transcription if isinstance(transcription, str) else getattr(transcription, "text", "")
    text = text.strip()
    if not text:
        raise RuntimeError("Groq returned an empty transcript.")

    print(f"[STT] Transcribed via Groq: '{text}'")
    return text
