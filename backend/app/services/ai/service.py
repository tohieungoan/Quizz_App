import time
import asyncio
import math
from typing import List, Optional
import logging

from app.schemas.ai_quiz import (
    AIQuestionItem,
    AIQuizGenerateResponse,
    DocumentPreviewResponse,
)
from app.services.ai.document_parser import DocumentParserService
from app.services.ai.prompt_builder import PromptBuilder
from app.services.ai.orchestrator import LLMOrchestrator, LLMOrchestratorError
from app.services.ai.validator import AIQuizValidator

logger = logging.getLogger(__name__)


class AIQuizService:
    """
    Unified Enterprise AI Quiz Service Facade.
    Coordinates document parsing, prompt construction, LLM orchestration,
    and Pydantic output validation into a single clean interface.
    """

    @classmethod
    async def generate_unified(
        cls,
        file_bytes: Optional[bytes] = None,
        filename: str = "Direct Text Prompt",
        custom_prompt: Optional[str] = None,
        num_questions: int = 5,
        difficulty: str = "MEDIUM",
        question_type: str = "multiple",
        language: str = "en",
        start_page: Optional[int] = None,
        end_page: Optional[int] = None,
        existing_questions: Optional[List[str]] = None,
        deleted_blacklist: Optional[List[str]] = None,
    ) -> AIQuizGenerateResponse:
        """
        Generates assessment questions from uploaded document and/or direct text prompt.
        """
        start_time = time.time()
        
        raw_text = ""
        author_instructions = custom_prompt if file_bytes else None
        if file_bytes:
            # 1. Parse document text & pages
            file_text, _ = DocumentParserService.extract_text(
                file_bytes=file_bytes,
                filename=filename,
                start_page=start_page,
                end_page=end_page
            )
            raw_text += file_text + "\n\n"
            
        if custom_prompt and not file_bytes:
            raw_text = custom_prompt
            
        if not raw_text or len(raw_text.strip()) < 20:
            raise ValueError(f"Insufficient text content to generate quiz questions. Please provide more context.")

        # 2. Smart Chunking
        chunked_text = DocumentParserService.smart_chunk_text(raw_text, num_questions)

        # 3. Build System Prompt
        system_prompt = PromptBuilder.build_system_prompt()

        # 4. LLM Orchestration in Parallel Batches
        # Adaptive batching: max 5 parallel requests to prevent rate limits.
        batch_size = max(3, math.ceil(num_questions / 5))
        tasks = []
        remaining = num_questions
        
        total_batches = math.ceil(num_questions / batch_size)
        batch_index = 1
        while remaining > 0:
            current_batch = min(remaining, batch_size)
            batch_user_prompt = PromptBuilder.build_user_prompt(
                document_content=chunked_text,
                filename=filename,
                num_questions=current_batch,
                difficulty=difficulty,
                question_type=question_type,
                language=language,
                existing_questions=existing_questions,
                deleted_blacklist=deleted_blacklist,
                custom_prompt=author_instructions,
                batch_index=batch_index,
                total_batches=total_batches,
            )
            tasks.append(LLMOrchestrator.invoke_chat_completion(
                system_prompt=system_prompt,
                user_prompt=batch_user_prompt,
                num_questions=current_batch
            ))
            remaining -= current_batch
            batch_index += 1

        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Merge results
        merged_questions = []
        model_used = "unknown"
        for res in results:
            if isinstance(res, Exception):
                logger.error(f"Parallel AI Batch Error: {res}")
                continue
            batch_dict, batch_model = res
            if "questions" in batch_dict and isinstance(batch_dict["questions"], list):
                merged_questions.extend(batch_dict["questions"])
            model_used = batch_model

        if not merged_questions:
            raise ValueError("The AI model was unable to generate valid questions. Please try again.")

        deduplicated_questions = []
        seen_content = set()
        for question in merged_questions:
            content = " ".join(str(question.get("content") or question.get("question") or "").split())
            key = content.casefold()
            if content and key not in seen_content:
                seen_content.add(key)
                deduplicated_questions.append(question)

        parsed_dict = {"questions": deduplicated_questions[:num_questions]}

        # 5. Validation & Normalization
        validated_questions = AIQuizValidator.validate_and_normalize(parsed_dict)

        if not validated_questions:
            raise ValueError("Generated questions did not pass the assessment quality criteria.")
        if len(validated_questions) != num_questions:
            logger.warning(
                "Only %s of %s AI-generated questions passed quality validation; returning the valid subset.",
                len(validated_questions),
                num_questions,
            )

        elapsed_ms = int((time.time() - start_time) * 1000)

        return AIQuizGenerateResponse(
            success=True,
            model_used=model_used,
            total_questions=len(validated_questions),
            questions=validated_questions,
            processing_time_ms=elapsed_ms
        )

    @classmethod
    def preview_document(
        cls,
        file_bytes: bytes,
        filename: str,
        start_page: Optional[int] = None,
        end_page: Optional[int] = None
    ) -> DocumentPreviewResponse:
        """
        Extracts summary metadata and text preview without invoking LLMs.
        """
        text, total_pages = DocumentParserService.extract_text(
            file_bytes=file_bytes,
            filename=filename,
            start_page=start_page,
            end_page=end_page
        )

        preview = text[:800] + ("..." if len(text) > 800 else "")

        return DocumentPreviewResponse(
            filename=filename,
            total_pages=total_pages,
            character_count=len(text),
            preview_text=preview
        )
