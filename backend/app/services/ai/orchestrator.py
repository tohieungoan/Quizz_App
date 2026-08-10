import time
import httpx
from typing import Any, Dict, List, Tuple
import logging

from app.core.config import settings
from app.services.ai.json_healer import JSONHealingService, JSONHealingError

logger = logging.getLogger(__name__)


class LLMOrchestratorError(Exception):
    pass


class LLMOrchestrator:
    """
    Enterprise Hybrid Multi-Provider LLM Orchestrator.
    - Tier 1: Google AI Studio (Gemini API - Ultra Fast, 1M context, Free Tier).
    - Tier 2: OpenRouter Cascade (Multi-Model fallback).
    Manages dynamic token budgeting, structured-output healing, and transparent failover.
    """

    GEMINI_MODELS = [
        "gemini-3.1-flash-lite",
        "gemini-2.0-flash-lite",
        "gemini-flash-latest",
    ]

    @classmethod
    def get_openrouter_cascade(cls) -> List[str]:
        """
        Builds the fallback list of OpenRouter AI models.
        """
        primary = settings.OPENROUTER_PRIMARY_MODEL or "inclusionai/ling-3.0-flash:free"
        fallback = settings.OPENROUTER_FALLBACK_MODEL or "google/gemma-4-26b-a4b-it:free"

        models = [primary, fallback, "openai/gpt-oss-20b:free", "openrouter/free"]
        return list(dict.fromkeys([m for m in models if m]))

    @classmethod
    async def _invoke_gemini(
        cls,
        client: httpx.AsyncClient,
        system_prompt: str,
        user_prompt: str,
        num_questions: int,
        gemini_key: str
    ) -> Tuple[Dict[str, Any], str]:
        """
        Invokes Google AI Studio Gemini API directly.
        """
        primary_model = settings.GEMINI_PRIMARY_MODEL or "gemini-3.1-flash-lite"
        models_to_try = list(dict.fromkeys([primary_model] + cls.GEMINI_MODELS))
        last_error = None

        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            payload = {
                "system_instruction": {
                    "parts": [{"text": system_prompt}]
                },
                "contents": [
                    {"role": "user", "parts": [{"text": user_prompt}]}
                ],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            }

            try:
                logger.info(f"Đang gửi yêu cầu đến Google AI Studio: [{model}]...")
                response = await client.post(url, json=payload)

                if response.status_code != 200:
                    err_text = response.text
                    logger.warning(f"Google Gemini [{model}] trả về HTTP {response.status_code}: {err_text[:200]}")
                    last_error = f"HTTP {response.status_code}: {err_text[:200]}"
                    continue

                resp_data = response.json()
                candidates = resp_data.get("candidates", [])
                if not candidates:
                    last_error = "Candidates rỗng từ Google AI Studio"
                    continue

                parts = candidates[0].get("content", {}).get("parts", [])
                if not parts or not parts[0].get("text"):
                    last_error = "Nội dung phản hồi rỗng từ Google AI Studio"
                    continue

                raw_text = parts[0]["text"]
                parsed_dict = JSONHealingService.heal_and_parse(raw_text)
                logger.info(f"Google AI Studio [{model}] tạo câu hỏi thành công!")
                return parsed_dict, f"Google {model}"

            except Exception as ex:
                logger.warning(f"Lỗi khi gọi Google Gemini [{model}]: {ex}")
                last_error = str(ex)
                continue

        raise LLMOrchestratorError(f"Google AI Studio không phản hồi: {last_error}")

    @classmethod
    async def _invoke_openrouter(
        cls,
        client: httpx.AsyncClient,
        system_prompt: str,
        user_prompt: str,
        num_questions: int,
        api_key: str
    ) -> Tuple[Dict[str, Any], str]:
        """
        Invokes OpenRouter multi-model fallback cascade.
        """
        max_output_tokens = min(4000, max(2000, num_questions * 350))
        models_to_try = cls.get_openrouter_cascade()
        last_error = None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "QuizzApp Enterprise",
            "Content-Type": "application/json"
        }

        for model in models_to_try:
            try:
                logger.info(f"Đang thử OpenRouter Fallback Model: [{model}]...")

                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": max_output_tokens
                }

                if "ling" not in model.lower() and "gpt-oss" not in model.lower():
                    payload["response_format"] = {"type": "json_object"}

                response = await client.post(
                    f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 400 and "response_format" in payload:
                    del payload["response_format"]
                    response = await client.post(
                        f"{settings.OPENROUTER_BASE_URL.rstrip('/')}/chat/completions",
                        headers=headers,
                        json=payload
                    )

                if response.status_code != 200:
                    err_msg = f"HTTP {response.status_code}: {response.text}"
                    logger.warning(f"OpenRouter {model} lỗi: {err_msg}")
                    last_error = err_msg
                    continue

                resp_data = response.json()
                choices = resp_data.get("choices", [])
                if not choices:
                    continue

                raw_content = choices[0].get("message", {}).get("content", "")
                if not raw_content or not raw_content.strip():
                    continue

                parsed_dict = JSONHealingService.heal_and_parse(raw_content)
                logger.info(f"OpenRouter [{model}] tạo câu hỏi thành công!")
                return parsed_dict, model

            except Exception as ex:
                logger.warning(f"Lỗi OpenRouter {model}: {ex}")
                last_error = str(ex)
                continue

        raise LLMOrchestratorError(f"OpenRouter không phản hồi thành công: {last_error}")

    @classmethod
    async def invoke_chat_completion(
        cls,
        system_prompt: str,
        user_prompt: str,
        num_questions: int = 5,
        timeout_seconds: float = 60.0
    ) -> Tuple[Dict[str, Any], str]:
        """
        Executes chat completion:
        1. Attempts Google AI Studio (Gemini API) if GEMINI_API_KEY is configured.
        2. Falls back to OpenRouter if Gemini fails or key is missing.
        """
        gemini_key = settings.GEMINI_API_KEY
        openrouter_key = settings.OPENROUTER_API_KEY

        if not gemini_key and not openrouter_key:
            raise LLMOrchestratorError("Chưa thiết lập GEMINI_API_KEY hoặc OPENROUTER_API_KEY trong .env.")

        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            # 1. Primary: Google AI Studio
            if gemini_key:
                try:
                    return await cls._invoke_gemini(
                        client=client,
                        system_prompt=system_prompt,
                        user_prompt=user_prompt,
                        num_questions=num_questions,
                        gemini_key=gemini_key
                    )
                except Exception as g_err:
                    logger.warning(f"Google AI Studio gặp sự cố: {g_err}. Đang chuyển sang OpenRouter Fallback...")

            # 2. Secondary Fallback: OpenRouter
            if openrouter_key:
                return await cls._invoke_openrouter(
                    client=client,
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    num_questions=num_questions,
                    api_key=openrouter_key
                )

        raise LLMOrchestratorError("Tất cả các nhà cung cấp AI (Google AI Studio & OpenRouter) đều không phản hồi.")
