import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.models.quiz import Quiz
from app.models.room import Room, Participant
from app.core.security import get_password_hash, create_access_token
from app.api.v1.websockets.room_manager import room_websocket_manager

def test_lobby_participant_persistence_and_roster():
    client = TestClient(app)
    db: Session = SessionLocal()

    # 1. Clean up existing test host & their rooms/quizzes
    existing_host = db.query(User).filter(User.email == "lobby_test_host@example.com").first()
    if existing_host:
        db.query(Participant).filter(Participant.room_id.in_(
            db.query(Room.id).filter(Room.host_id == existing_host.id)
        )).delete(synchronize_session=False)
        db.query(Room).filter(Room.host_id == existing_host.id).delete(synchronize_session=False)
        db.query(Quiz).filter(Quiz.user_id == existing_host.id).delete(synchronize_session=False)
        db.query(User).filter(User.id == existing_host.id).delete(synchronize_session=False)
        db.commit()

    # 2. Create test host
    host = User(
        email="lobby_test_host@example.com",
        password=get_password_hash("password123"),
        fullname="Lobby Test Host",
        role="USER",
        status="ACTIVE"
    )
    db.add(host)
    db.commit()
    db.refresh(host)

    try:
        # 3. Create published quiz and launch room
        quiz = Quiz(
            user_id=host.id,
            title="Lobby Test Quiz",
            subject="General",
            difficulty="Easy",
            status="PUBLISHED"
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        token = create_access_token(subject=host.id)
        headers = {"Authorization": f"Bearer {token}"}

        res_launch = client.post("/api/v1/rooms/launch", json={
            "quiz_id": quiz.id,
            "mode": "CLASSIC",
            "progression_mode": "manual"
        }, headers=headers)
        assert res_launch.status_code == 201, f"Failed to launch room: {res_launch.text}"
        room_data = res_launch.json()
        room_id = room_data["id"]
        room_code = room_data["room_code"]

        # 4. Join participant 1
        res_join1 = client.post(f"/api/v1/rooms/{room_code}/join", json={"nickname": "Player_One"})
        assert res_join1.status_code == 201
        p1_data = res_join1.json()

        # 5. Join participant 2
        res_join2 = client.post(f"/api/v1/rooms/{room_code}/join", json={"nickname": "Player_Two"})
        assert res_join2.status_code == 201

        # 6. Fetch participants roster via API (should include both participants regardless of WebSocket state)
        res_parts = client.get(f"/api/v1/rooms/{room_id}/participants")
        assert res_parts.status_code == 200
        parts_list = res_parts.json()
        nicknames = [p["nickname"] for p in parts_list]
        assert "Player_One" in nicknames
        assert "Player_Two" in nicknames

        # 7. Simulate page reload for participant 1 (re-calling join endpoint with same nickname)
        res_rejoin = client.post(f"/api/v1/rooms/{room_code}/join", json={"nickname": "Player_One"})
        assert res_rejoin.status_code == 201
        assert res_rejoin.json()["id"] == p1_data["id"]

        # Roster should still contain both participants intact
        res_parts_after = client.get(f"/api/v1/rooms/{room_id}/participants")
        assert res_parts_after.status_code == 200
        nicknames_after = [p["nickname"] for p in res_parts_after.json()]
        assert "Player_One" in nicknames_after
        assert "Player_Two" in nicknames_after

    finally:
        # Cleanup
        db.query(Participant).filter(Participant.nickname.in_(["Player_One", "Player_Two"])).delete(synchronize_session=False)
        db.query(Room).filter(Room.host_id == host.id).delete(synchronize_session=False)
        db.query(Quiz).filter(Quiz.user_id == host.id).delete(synchronize_session=False)
        db.query(User).filter(User.id == host.id).delete(synchronize_session=False)
        db.commit()
        db.close()


@pytest.mark.anyio
async def test_graceful_disconnect_timer_scheduling():
    room_code = "TESTROOM99"
    nickname = "TestGraceUser"

    # Schedule 1-second grace disconnect timer
    room_websocket_manager.schedule_graceful_disconnect(room_code, nickname, grace_seconds=1)
    assert room_code in room_websocket_manager.pending_disconnect_tasks
    assert nickname in room_websocket_manager.pending_disconnect_tasks[room_code]

    task = room_websocket_manager.pending_disconnect_tasks[room_code][nickname]
    assert not task.done()

    # Cancel task manually (simulating re-connect before 1s expires)
    task.cancel()
    await asyncio.sleep(0.1)
    assert task.done()
    assert task.cancelled()
