from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status

from app.api.deps import get_current_user_ws
from app.api.v1.websockets.admin_room_manager import admin_room_manager
from app.models.user import User


router = APIRouter()


@router.websocket("/ws/admin/rooms")
async def websocket_admin_rooms(
    websocket: WebSocket,
    current_user: User = Depends(get_current_user_ws),
) -> None:
    if current_user.status != "ACTIVE" or current_user.role != "SUPER_ADMIN":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await admin_room_manager.connect(websocket, current_user.id)
    try:
        while True:
            message = await websocket.receive_json()
            if isinstance(message, dict) and message.get("type") == "PING":
                await admin_room_manager.send_to(
                    current_user.id,
                    websocket,
                    {"type": "PONG"},
                )
    except WebSocketDisconnect:
        pass
    finally:
        admin_room_manager.disconnect(websocket, current_user.id)
