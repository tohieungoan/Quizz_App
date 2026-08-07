import pytest
import json
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.models.quiz import Quiz, Question, QuestionOption
from app.models.room import Room
from app.core.security import get_password_hash, create_access_token

def test_websocket_room_submit_answer():
    client = TestClient(app)
    db = SessionLocal()

    # Clean up test users
    db.query(User).filter(User.email == "ws_test_user@example.com").delete()
    db.commit()

    # 1. Create test host & member
    host = User(
        email="ws_test_user@example.com",
        password=get_password_hash("password"),
        fullname="WS Test Host",
        role="USER",
        status="ACTIVE"
    )
    db.add(host)
    db.commit()
    db.refresh(host)

    try:
        # Create Quiz & Question
        quiz = Quiz(user_id=host.id, title="WS Test Quiz", subject="Tech", difficulty="Easy", status="ACTIVE")
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        q1 = Question(quiz_id=quiz.id, type="MULTIPLE_CHOICE", content="What is 2+2?", time_limit=30)
        db.add(q1)
        db.commit()
        db.refresh(q1)

        opt1 = QuestionOption(question_id=q1.id, content="3", is_correct=False)
        opt2 = QuestionOption(question_id=q1.id, content="4", is_correct=True)
        db.add_all([opt1, opt2])
        db.commit()
        db.refresh(opt1)
        db.refresh(opt2)

        # Launch Room via REST API
        token = create_access_token(subject=host.id)
        headers = {"Authorization": f"Bearer {token}"}
        res_launch = client.post("/api/v1/rooms/launch", json={
            "quiz_id": quiz.id,
            "mode": "CLASSIC",
            "progression_mode": "manual"
        }, headers=headers)
        assert res_launch.status_code == 201
        room_data = res_launch.json()
        room_code = room_data["room_code"]
        room_id = room_data["id"]

        # Join Room as Member
        res_join = client.post(f"/api/v1/rooms/{room_code}/join", json={"nickname": "WSMember"})
        assert res_join.status_code == 201
        participant_id = res_join.json()["id"]

        # Start Room
        res_start = client.post(f"/api/v1/rooms/{room_id}/start", headers=headers)
        assert res_start.status_code == 200

        # Connect Member via WebSocket & submit answer over WS
        with client.websocket_connect(f"/api/v1/ws/rooms/{room_code}?nickname=WSMember&isHost=false") as websocket:
            # Send PING
            websocket.send_json({"type": "PING"})
            msg = websocket.receive_json()
            if msg.get("type") == "PLAYER_JOINED":
                msg = websocket.receive_json()
            assert msg.get("type") == "PONG"

            # Send SUBMIT_ANSWER over WebSocket (<5ms)
            websocket.send_json({
                "type": "SUBMIT_ANSWER",
                "participant_id": participant_id,
                "question_id": q1.id,
                "selected_option_id": opt2.id,
                "streak": 0
            })

            msg_ans = websocket.receive_json()
            assert msg_ans["type"] == "SUBMIT_ANSWER_RESPONSE"
            assert msg_ans["status"] == "SUCCESS"
            assert msg_ans["is_correct"] is True
            assert msg_ans["score"] > 0
            assert msg_ans["correct_option_key"] == "B"
            print("Successfully verified WebSocket answer submission & scoring!")

    finally:
        # Cleanup DB
        db.query(Room).filter(Room.host_id == host.id).delete()
        db.query(Quiz).filter(Quiz.user_id == host.id).delete()
        db.query(User).filter(User.id == host.id).delete()
        db.commit()
        db.close()
