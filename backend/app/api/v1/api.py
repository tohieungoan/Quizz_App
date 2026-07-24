"""
Aggregate all routers for API version 1.
Include sub-routers from auth.py, users.py, groups.py, quizzes.py, exams.py...
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    badges,
    groups,
    questions,
    quizzes,
    upload,
    users,
)

api_router = APIRouter()

# Core & User Endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])

# Quiz & Question Endpoints
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
api_router.include_router(questions.router, prefix="/quizzes", tags=["Questions"])

# Admin Endpoints
api_router.include_router(badges.router, prefix="/admin/badges", tags=["Admin - Badges"])