"""
Aggregate all routers for API version 1.
Include sub-routers from auth.py, users.py, groups.py, quizzes.py, exams.py...
"""
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, groups, badges

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(badges.router, prefix="/admin/badges", tags=["Admin - Badges"])


