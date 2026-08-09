"""Gemini LLM client with a graceful no-key fallback."""
from __future__ import annotations

import json
import re

from config import Config

try:  # google-genai SDK (optional dependency)
    from google import genai
    from google.genai import types as genai_types

    _GENAI_AVAILABLE = True
except Exception:  # noqa: BLE001
    genai = None
    genai_types = None
    _GENAI_AVAILABLE = False


def _extract_json(text: str):
    text = (text or "").strip()
    # Try direct parse
    try:
        return json.loads(text)
    except Exception:  # noqa: BLE001
        pass
    # Try a ```json ... ``` fenced block
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        try:
            return json.loads(fence.group(1).strip())
        except Exception:  # noqa: BLE001
            pass
    # Try the first balanced {...} block
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except Exception:  # noqa: BLE001
            pass
    return None


class GeminiClient:
    def __init__(self):
        self.enabled = bool(Config.GEMINI_API_KEY) and _GENAI_AVAILABLE
        self._client = None
        if self.enabled:
            try:
                self._client = genai.Client(
                    api_key=Config.GEMINI_API_KEY,
                    http_options={"timeout": Config.GEMINI_TIMEOUT},
                )
            except Exception as exc:  # noqa: BLE001
                print(f"[llm] could not initialise Gemini client ({exc}); running without LLM")
                self.enabled = False
        if not self.enabled:
            print("[llm] no GEMINI_API_KEY configured — using deterministic fallback analysis")

    def complete_json(self, prompt: str) -> dict | None:
        """Ask Gemini to produce a JSON object. Returns None on failure."""
        if not self.enabled or self._client is None:
            return None
        try:
            response = self._client.models.generate_content(
                model=Config.GEMINI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                ),
            )
            return _extract_json(response.text)
        except Exception as exc:  # noqa: BLE001
            print(f"[llm] Gemini call failed ({exc})")
            return None


# Singleton instance reused across requests.
client = GeminiClient()