from typing import Dict, List
from fastapi import WebSocket

class RoomConnectionManager:
    def __init__(self):
        # Maps room_code -> { nickname: websocket }
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_code: str, nickname: str):
        await websocket.accept()
        if room_code not in self.active_connections:
            self.active_connections[room_code] = {}
        self.active_connections[room_code][nickname] = websocket

    def disconnect(self, websocket: WebSocket, room_code: str, nickname: str):
        if room_code in self.active_connections:
            if nickname in self.active_connections[room_code]:
                del self.active_connections[room_code][nickname]
            if not self.active_connections[room_code]:
                del self.active_connections[room_code]

    async def broadcast_to_room(self, room_code: str, message: dict):
        if room_code in self.active_connections:
            for nickname in list(self.active_connections[room_code].keys()):
                ws = self.active_connections[room_code].get(nickname)
                if ws:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        self.disconnect(ws, room_code, nickname)

    def get_room_members(self, room_code: str) -> List[str]:
        if room_code in self.active_connections:
            return list(self.active_connections[room_code].keys())
        return []

room_websocket_manager = RoomConnectionManager()
