"""
audio_handler.py — Handles audio download from Evolution API and transcription via OpenAI Whisper.
"""
import os
import io
import httpx
from openai import AsyncOpenAI

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "whisper-1")


async def download_audio(audio_url: str, evolution_api_key: str = None) -> bytes:
    """Download audio file from Evolution API media URL."""
    headers = {}
    if evolution_api_key:
        headers["apikey"] = evolution_api_key

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(audio_url, headers=headers)
        response.raise_for_status()
        return response.content


async def transcribe_audio(
    audio_bytes: bytes,
    openai_client: AsyncOpenAI,
    language: str = "pt",
    filename: str = "audio.ogg",
) -> dict:
    """
    Transcribe audio bytes using OpenAI Whisper API.
    Returns dict with 'text' (transcription) and 'duration' (estimated seconds).
    """
    # Map our language codes to Whisper ISO-639-1
    lang_map = {"pt": "pt", "en": "en", "es": "es"}
    whisper_lang = lang_map.get(language, "pt")

    # Create a file-like object for the API
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    transcription = await openai_client.audio.transcriptions.create(
        model=WHISPER_MODEL,
        file=audio_file,
        language=whisper_lang,
        response_format="verbose_json",
    )

    return {
        "text": transcription.text,
        "duration": getattr(transcription, "duration", None),
    }
