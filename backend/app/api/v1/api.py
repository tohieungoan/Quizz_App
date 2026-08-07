"""
Aggregate all routers for API version 1.
Include sub-routers from auth.py, users.py, groups.py, quizzes.py, exams.py, dashboard.py...
"""
from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    badges,
    dashboard,
    reports,
    exams,
    groups,
    questions,
    quizzes,
    rooms,
    upload,
    users,
    notifications,
    admin_settings,
    ai_quiz,
)
from app.api.v1.websockets import ws_notifications, ws_room

api_router = APIRouter()

# Core & User Endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(badges.router, prefix="/badges", tags=["Badges"])

# AI Quiz Generator Endpoints
api_router.include_router(ai_quiz.router, prefix="/ai-quiz", tags=["AI Quiz Generator"])

# Quiz & Question Endpoints
api_router.include_router(quizzes.router, tags=["Quizzes"])
api_router.include_router(questions.router, prefix="/quizzes", tags=["Questions"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])

# Admin Endpoints
api_router.include_router(dashboard.router, prefix="/admin/dashboard", tags=["Dashboard"])
api_router.include_router(reports.router, prefix="/admin/reports", tags=["Reports"])
api_router.include_router(badges.router, prefix="/admin/badges", tags=["Badges"])
api_router.include_router(rooms.router, prefix="/admin/rooms", tags=["Rooms"])
api_router.include_router(admin_settings.router, prefix="/admin/settings", tags=["Admin Settings"])

# WebSockets
api_router.include_router(ws_notifications.router, tags=["WebSockets"])
api_router.include_router(ws_room.router, tags=["WebSockets"])