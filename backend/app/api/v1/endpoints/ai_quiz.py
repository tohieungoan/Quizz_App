import json
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
import logging

from app.schemas.ai_quiz import (
    AIQuizGenerateRequest,
    AIQuizGenerateResponse,
    DocumentPreviewResponse,
)
from app.services.ai import AIQuizService, LLMOrchestrator
from app.core.config import settings
from app.api.deps import get_current_active_user
from app.services.ai.rate_limiter import consume_ai_generation_quota

logger = logging.getLogger(__name__)

router = APIRouter()
MAX_AI_DOCUMENT_SIZE = 20 * 1024 * 1024


async def _read_upload_with_limit(file: UploadFile) -> bytes:
    chunks = []
    total = 0
    while chunk := await file.read(1024 * 1024):
        total += len(chunk)
        if total > MAX_AI_DOCUMENT_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="AI source documents cannot exceed 20MB.",
            )
        chunks.append(chunk)
    return b"".join(chunks)


@router.post(
    "/generate",
    response_model=AIQuizGenerateResponse,
    summary="Automatically generate quiz questions from document files and/or text prompts",
)
async def generate(
    file: Optional[UploadFile] = File(None, description="Document file to generate questions from"),
    custom_prompt: Optional[str] = Form(None, description="Direct text content or instructions"),
    num_questions: int = Form(5, ge=1, le=50),
    difficulty: str = Form("MEDIUM"),
    question_type: str = Form("multiple"),
    language: str = Form("en"),
    start_page: Optional[int] = Form(None),
    end_page: Optional[int] = Form(None),
    existing_questions: Optional[str] = Form(None, description="JSON array string of existing questions"),
    deleted_blacklist: Optional[str] = Form(None, description="JSON array string of deleted questions"),
    current_user=Depends(get_current_active_user),
):
    try:
        allowed, _ = await consume_ai_generation_quota(current_user.id)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI generation hourly quota exceeded. Please try again later.",
            )
        file_bytes = None
        if file:
            extension = (file.filename or "").lower().rsplit(".", 1)[-1]
            if extension not in {"pdf", "docx", "txt", "md", "markdown", "csv"}:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Supported AI documents are PDF, DOCX, TXT, Markdown, and CSV.",
                )
            file_bytes = await _read_upload_with_limit(file)
            if not file_bytes:
                file_bytes = None

        if not file_bytes and not custom_prompt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide a document file or text prompt content."
            )

        # Parse existing questions array if provided as JSON string
        existing_list: List[str] = []
        if existing_questions:
            try:
                parsed = json.loads(existing_questions)
                if isinstance(parsed, list):
                    existing_list = [str(x) for x in parsed]
            except Exception:
                existing_list = [x.strip() for x in existing_questions.split("\n") if x.strip()]

        # Parse deleted blacklist array
        blacklist_list: List[str] = []
        if deleted_blacklist:
            try:
                parsed = json.loads(deleted_blacklist)
                if isinstance(parsed, list):
                    blacklist_list = [str(x) for x in parsed]
            except Exception:
                blacklist_list = [x.strip() for x in deleted_blacklist.split("\n") if x.strip()]

        response = await AIQuizService.generate_unified(
            file_bytes=file_bytes,
            filename=file.filename if file else "Direct Text Prompt",
            custom_prompt=custom_prompt,
            num_questions=num_questions,
            difficulty=difficulty,
            question_type=question_type,
            language=language,
            start_page=start_page,
            end_page=end_page,
            existing_questions=existing_list,
            deleted_blacklist=blacklist_list
        )
        return response

    except HTTPException:
        raise
    except ValueError as ve:
        logger.warning(f"Input validation error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"System error during AI question generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI generation failed unexpectedly. Please retry or contact support."
        )


@router.post(
    "/preview-document",
    response_model=DocumentPreviewResponse,
    summary="Extract document summary and page count preview"
)
async def preview_document(
    file: UploadFile = File(...),
    start_page: Optional[int] = Form(None),
    end_page: Optional[int] = Form(None),
    current_user=Depends(get_current_active_user),
):
    try:
        extension = (file.filename or "").lower().rsplit(".", 1)[-1]
        if extension not in {"pdf", "docx", "txt", "md", "markdown", "csv"}:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Supported AI documents are PDF, DOCX, TXT, Markdown, and CSV.",
            )
        file_bytes = await _read_upload_with_limit(file)
        return AIQuizService.preview_document(
            file_bytes=file_bytes,
            filename=file.filename or "document.pdf",
            start_page=start_page,
            end_page=end_page
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document preview error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to read the supplied document."
        )


@router.get(
    "/models/status",
    summary="Check AI models configuration status"
)
async def get_models_status(current_user=Depends(get_current_active_user)):
    return {
        "status": "ready",
        "primary_model": settings.OPENROUTER_PRIMARY_MODEL,
        "fallback_model": settings.OPENROUTER_FALLBACK_MODEL,
        "active_cascade": LLMOrchestrator.get_model_cascade(),
    }
