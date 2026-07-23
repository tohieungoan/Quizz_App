"""
Gom tất cả các routers của API version 1.
Include các sub-routers từ auth.py, users.py, quizzes.py, exams.py...
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, badges

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(badges.router, prefix="/admin/badges", tags=["Admin - Badges"])


