import asyncio
import logging
from typing import Any, Dict, List, Sequence, Tuple

from fastapi import WebSocket


logger = logging.getLogger(__name__)

BROADCAST_BATCH_SIZE = 200
WEBSOCKET_SEND_TIMEOUT_SECONDS = 5.0


class ConnectionManager:
    def __init__(
        self,
        batch_size: int = BROADCAST_BATCH_SIZE,
        send_timeout_seconds: float = WEBSOCKET_SEND_TIMEOUT_SECONDS,
    ):
        if batch_size <= 0:
            raise ValueError("batch_size must be greater than zero")
        if send_timeout_seconds <= 0:
            raise ValueError("send_timeout_seconds must be greater than zero")

        # A user can have multiple tabs/devices connected to this worker.
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self._connection_locks: Dict[WebSocket, asyncio.Lock] = {}
        self._batch_size = batch_size
        self._send_timeout_seconds = send_timeout_seconds

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self._connection_locks[websocket] = asyncio.Lock()
        logger.info(
            "User %s connected. Total active connections: %s",
            user_id,
            len(self.active_connections[user_id]),
        )

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        self._connection_locks.pop(websocket, None)
        logger.info("User %s disconnected.", user_id)

    def _is_connected(self, connection: WebSocket, user_id: int) -> bool:
        return connection in self.active_connections.get(user_id, [])

    async def _send_safe(
        self,
        connection: WebSocket,
        message: dict[str, Any],
        user_id: int,
    ) -> bool:
        # A lock prevents concurrent broadcasts from writing to the same socket.
        connection_lock = self._connection_locks.setdefault(
            connection,
            asyncio.Lock(),
        )
        try:
            async with connection_lock:
                # The socket may have disconnected while this send was waiting.
                if not self._is_connected(connection, user_id):
                    return False
                await asyncio.wait_for(
                    connection.send_json(message),
                    timeout=self._send_timeout_seconds,
                )
            return True
        except asyncio.CancelledError:
            # Application shutdown/cancellation must not be swallowed.
            raise
        except asyncio.TimeoutError:
            logger.warning(
                "Timed out sending notification to user %s after %.1f seconds",
                user_id,
                self._send_timeout_seconds,
            )
            self.disconnect(connection, user_id)
            return False
        except Exception as exc:
            logger.warning("Failed to send notification to user %s: %s", user_id, exc)
            self.disconnect(connection, user_id)
            return False

    async def _send_in_batches(
        self,
        targets: Sequence[Tuple[int, WebSocket]],
        message: dict[str, Any],
    ) -> None:
        """Send concurrently while keeping resource usage bounded."""
        for start in range(0, len(targets), self._batch_size):
            batch = targets[start : start + self._batch_size]
            await asyncio.gather(
                *(
                    self._send_safe(connection, message, user_id)
                    for user_id, connection in batch
                )
            )

    async def broadcast(self, message: dict[str, Any]):
        """Broadcast in bounded concurrent batches to this worker's sockets."""
        targets = []
        for user_id, connections in list(self.active_connections.items()):
            for connection in list(connections):
                targets.append((user_id, connection))
        await self._send_in_batches(targets, message)

    async def send_personal_message(self, message: dict[str, Any], user_id: int) -> None:
        """Send a notification message to all active WebSocket connections of a specific user."""
        connections = list(self.active_connections.get(user_id, []))
        if not connections:
            return
        targets = [(user_id, connection) for connection in connections]
        await self._send_in_batches(targets, message)


notification_manager = ConnectionManager()

