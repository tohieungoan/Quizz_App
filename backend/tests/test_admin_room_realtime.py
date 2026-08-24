import asyncio

from app.api.v1.websockets.admin_room_manager import AdminRoomConnectionManager


def test_publish_builds_admin_room_invalidation_event() -> None:
    async def scenario() -> None:
        manager = AdminRoomConnectionManager()
        deliveries = []

        async def capture(event: dict, envelope: str) -> None:
            deliveries.append((event, envelope))

        manager._dispatch = capture  # type: ignore[method-assign]
        await manager.publish(room_id=42, room_code="123456", reason="ROOM_STARTED")
        await asyncio.sleep(0)

        assert len(deliveries) == 1
        event, envelope = deliveries[0]
        assert event["type"] == "ROOMS_INVALIDATED"
        assert event["room_id"] == 42
        assert event["room_code"] == "123456"
        assert event["reasons"] == ["ROOM_STARTED"]
        assert "ROOM_STARTED" in envelope

    asyncio.run(scenario())


def test_score_invalidations_are_coalesced_per_room() -> None:
    async def scenario() -> None:
        manager = AdminRoomConnectionManager()
        published = []

        async def capture_publish(**event) -> None:
            published.append(event)

        manager.publish = capture_publish  # type: ignore[method-assign]
        manager.schedule_invalidation(
            room_id=7,
            room_code="654321",
            reason="PARTICIPANT_SCORE_UPDATED",
            delay_seconds=0.01,
        )
        manager.schedule_invalidation(
            room_id=7,
            room_code="654321",
            reason="PARTICIPANT_SCORE_UPDATED",
            delay_seconds=0.01,
        )
        await asyncio.sleep(0.03)

        assert len(published) == 1
        assert published[0]["room_id"] == 7
        assert published[0]["reasons"] == ["PARTICIPANT_SCORE_UPDATED"]

    asyncio.run(scenario())
