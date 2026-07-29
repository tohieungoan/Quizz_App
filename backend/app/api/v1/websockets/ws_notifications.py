from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user_ws
from app.api.v1.websockets.manager import manager
from app.models.user import User

router = APIRouter()

@router.websocket("/ws/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_ws)
):
    """
    WebSocket endpoint for real-time notifications.
    Clients connect here to receive system broadcasts instantly.
    """
    await manager.connect(websocket, current_user.id)
    try:
        while True:
            # We keep the connection open and wait for any messages from client (if needed)
            # Currently just a one-way street (Server -> Client) for broadcasts, but we need to receive to keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, current_user.id)
    except Exception as e:
        manager.disconnect(websocket, current_user.id)
