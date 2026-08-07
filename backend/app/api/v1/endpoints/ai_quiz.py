import json
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
import logging

from app.schemas.ai_quiz import (
    AIQuizGenerateRequest,
    AIQuizGenerateResponse,
    DocumentPreviewResponse,
)
from app.services.ai import AIQuizService, LLMOrchestrator
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


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
):
    try:
        file_bytes = None
        if file:
            file_bytes = await file.read()
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
            detail=f"AI System Error: {str(e)}"
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
):
    try:
        file_bytes = await file.read()
        return AIQuizService.preview_document(
            file_bytes=file_bytes,
            filename=file.filename or "document.pdf",
            start_page=start_page,
            end_page=end_page
        )
    except Exception as e:
        logger.error(f"Document preview error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read document: {str(e)}"
        )


@router.get(
    "/models/status",
    summary="Check AI models configuration status"
)
async def get_models_status():
    return {
        "status": "ready",
        "primary_model": settings.OPENROUTER_PRIMARY_MODEL,
        "fallback_model": settings.OPENROUTER_FALLBACK_MODEL,
        "active_cascade": LLMOrchestrator.get_model_cascade(),
    }
