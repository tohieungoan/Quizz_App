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
    upload,
    users,
    rooms,
    notifications,
)
from app.api.v1.websockets import ws_notifications

api_router = APIRouter()

# Core & User Endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Quiz & Question Endpoints
api_router.include_router(quizzes.router, tags=["Quizzes"])
api_router.include_router(questions.router, prefix="/quizzes", tags=["Questions"])
api_router.include_router(exams.router, prefix="/exams", tags=["Exams"])

# Admin Endpoints
api_router.include_router(dashboard.router, prefix="/admin/dashboard", tags=["Dashboard"])
api_router.include_router(reports.router, prefix="/admin/reports", tags=["Reports"])
api_router.include_router(badges.router, prefix="/admin/badges", tags=["Badges"])
api_router.include_router(rooms.router, prefix="/admin/rooms", tags=["Rooms"])

# WebSockets
api_router.include_router(ws_notifications.router, tags=["WebSockets"])