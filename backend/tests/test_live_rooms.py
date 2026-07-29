import json
import urllib.request
import urllib.error
import time
from datetime import datetime
from app.db.session import SessionLocal
from app.models.user import User
from app.models.quiz import Quiz, Question, QuestionOption
from app.models.room import Room
from app.core.security import get_password_hash, create_access_token

def run_test():
    db = SessionLocal()
    print("Testing Live Room Launch & Management APIs...")

    # Clean up leftover test data from previous runs
    test_user_ids = [u[0] for u in db.query(User.id).filter(User.email.in_(["test_host_room@example.com", "test_member_room@example.com"])).all()]
    if test_user_ids:
        db.query(Room).filter(Room.host_id.in_(test_user_ids)).delete(synchronize_session=False)
        db.query(Quiz).filter(Quiz.user_id.in_(test_user_ids)).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_(test_user_ids)).delete(synchronize_session=False)
        db.commit()

    # 1. Setup mock data
    host = User(
        email="test_host_room@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Host Room",
        role="USER",
        status="ACTIVE"
    )
    member = User(
        email="test_member_room@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Member Room",
        role="USER",
        status="ACTIVE"
    )
    db.add_all([host, member])
    db.commit()
    db.refresh(host)
    db.refresh(member)

    try:
        # Create a Quiz
        quiz = Quiz(
            user_id=host.id,
            title="Room Test Quiz",
            subject="General Knowledge",
            difficulty="Easy",
            status="ACTIVE"
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        # Create a Question for Quiz
        q1 = Question(
            quiz_id=quiz.id,
            type="MULTIPLE_CHOICE",
            content="What is React useMemo used for?",
            time_limit=10  # 10 seconds limit for quick test
        )
        db.add(q1)
        db.commit()
        db.refresh(q1)

        # Create Options (Option 2 is correct, index 1 -> B)
        opt1 = QuestionOption(question_id=q1.id, content="To handle side effects", is_correct=False)
        opt2 = QuestionOption(question_id=q1.id, content="To cache calculations", is_correct=True)
        opt3 = QuestionOption(question_id=q1.id, content="To reference DOM elements", is_correct=False)
        db.add_all([opt1, opt2, opt3])
        db.commit()
        db.refresh(opt1)
        db.refresh(opt2)
        db.refresh(opt3)

        print(f"Created test host: {host.id}, test quiz: {quiz.id}, test question: {q1.id}")

        # Generate token for authentication
        token = create_access_token(subject=host.id)
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

        base_url = "http://127.0.0.1:8000/api/v1"

        # TEST 1: Launch Room (POST /rooms/launch)
        print("TEST 1: Launch Live Room...")
        launch_url = f"{base_url}/rooms/launch"
        launch_payload = {
            "quiz_id": quiz.id,
            "mode": "CLASSIC",
            "progression_mode": "manual",
            "allow_skip_question": True,
            "allow_show_rank": True,
            "shuffle_options": False
        }
        
        req = urllib.request.Request(
            launch_url,
            data=json.dumps(launch_payload).encode('utf-8'),
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 201
            assert data["quiz_id"] == quiz.id
            assert data["host_id"] == host.id
            assert data["status"] == "WAITING"
            assert len(data["room_code"]) == 6
            room_code = data["room_code"]
            room_id = data["id"]
            print(f"Successfully launched room. Code: {room_code}, ID: {room_id}")

        # TEST 1.5: Update Room Settings (PATCH /rooms/{room_id}/settings)
        print("TEST 1.5: Updating room settings (progression_mode -> auto)...")
        settings_url = f"{base_url}/rooms/{room_id}/settings"
        settings_payload = {
            "progression_mode": "auto"
        }
        req_settings = urllib.request.Request(
            settings_url,
            data=json.dumps(settings_payload).encode('utf-8'),
            headers=headers,
            method="PATCH"
        )
        with urllib.request.urlopen(req_settings) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["progression_mode"] == "auto"
            print("Successfully updated room settings to auto progression.")


        # TEST 2: Get Room by Code (GET /rooms/{room_code})
        print("TEST 2: Retrieve Room by Code...")
        get_url = f"{base_url}/rooms/{room_code}"
        req_get = urllib.request.Request(get_url, method="GET")
        with urllib.request.urlopen(req_get) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["room_code"] == room_code
            assert data["id"] == room_id
            print(f"Successfully retrieved active room info by code: {room_code}")

        # TEST 2.5: Join Room (POST /rooms/{room_code}/join)
        print("TEST 2.5: Guest & Logged-in User joining room...")
        join_url = f"{base_url}/rooms/{room_code}/join"
        
        # A. Guest joins
        guest_payload = {"nickname": "Anonymous Guest"}
        req_guest = urllib.request.Request(
            join_url,
            data=json.dumps(guest_payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_guest) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 201
            assert data["nickname"] == "Anonymous Guest"
            assert data["user_id"] is None
            assert data["room_id"] == room_id
            guest_participant_id = data["id"]
            print("Guest successfully joined room.")

        # B. Duplicate nickname fails (Should return 400)
        req_dup = urllib.request.Request(
            join_url,
            data=json.dumps(guest_payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            urllib.request.urlopen(req_dup)
            assert False, "Should have failed with 400 since nickname is duplicated"
        except urllib.error.HTTPError as e:
            assert e.code == 400
            print("Successfully verified duplicate nickname join returns 400")

        # C. Logged-in member joins
        member_token = create_access_token(subject=member.id)
        member_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {member_token}"
        }
        member_payload = {"nickname": "Registered Member"}
        req_member = urllib.request.Request(
            join_url,
            data=json.dumps(member_payload).encode('utf-8'),
            headers=member_headers,
            method="POST"
        )
        with urllib.request.urlopen(req_member) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 201
            assert data["nickname"] == "Registered Member"
            assert data["user_id"] == member.id
            assert data["room_id"] == room_id
            member_participant_id = data["id"]
            print("Registered member successfully joined room.")

        # TEST 2.7: Get Room Participants (GET /rooms/{room_id}/participants) & Start Room (POST /rooms/{room_id}/start)
        print("TEST 2.7: Getting room participants list and starting room...")
        participants_url = f"{base_url}/rooms/{room_id}/participants"
        req_parts = urllib.request.Request(participants_url, method="GET")
        with urllib.request.urlopen(req_parts) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert len(data) == 2
            nicknames = [p["nickname"] for p in data]
            assert "Anonymous Guest" in nicknames
            assert "Registered Member" in nicknames
            print("Successfully verified room participants list.")

        # Start Room
        start_url = f"{base_url}/rooms/{room_id}/start"
        req_start = urllib.request.Request(
            start_url,
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req_start) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["status"] == "PLAYING"
            assert data["participants_count"] == 2
            print("Successfully started room session and verified participants_count = 2.")

        # TEST 2.8: Submit Answers & Verify Dynamic Scoring & Timeouts
        print("TEST 2.8: Simulating members submitting answers...")
        
        # We need to sleep briefly to simulate response time
        time.sleep(2)  # 2 seconds elapsed
        
        submit_url = f"{base_url}/rooms/{room_code}/submit-answer"
        
        # A. Guest submits CORRECT answer (opt2) within time limit
        guest_answer_payload = {
            "participant_id": guest_participant_id,
            "question_id": q1.id,
            "selected_option_id": opt2.id
        }
        req_guest_ans = urllib.request.Request(
            submit_url,
            data=json.dumps(guest_answer_payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_guest_ans) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["is_correct"] is True
            assert 750 <= data["score"] <= 950  # 500 + 500 * (1 - 2/10) = 900
            assert data["correct_option_key"] == "B"
            print(f"Guest answer submitted. Correct: True, Score: {data['score']}")

        # B. Sleep another 9 seconds (total 11 seconds elapsed since start) to trigger timeout
        time.sleep(9)
        
        # C. Member submits CORRECT answer (opt2) but AFTER time limit (10s)
        member_answer_payload = {
            "participant_id": member_participant_id,
            "question_id": q1.id,
            "selected_option_id": opt2.id
        }
        req_member_ans = urllib.request.Request(
            submit_url,
            data=json.dumps(member_answer_payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_member_ans) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["is_correct"] is True
            assert data["score"] == 0.0
            print(f"Member answer submitted after timeout. Correct: True, Score: {data['score']} (Expected: 0.0)")

        # TEST 2.9: Fetch Live Session Data (GET /rooms/{room_id}/live-session)
        print("TEST 2.9: Fetching Host Live Dashboard statistics...")
        live_session_url = f"{base_url}/rooms/{room_id}/live-session"
        req_live = urllib.request.Request(
            live_session_url,
            headers=headers,
            method="GET"
        )
        with urllib.request.urlopen(req_live) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["room_id"] == room_id
            assert data["status"] == "PLAYING"
            assert data["active_question"]["id"] == q1.id
            assert len(data["participants"]) == 2
            
            p_guest = next(p for p in data["participants"] if p["id"] == guest_participant_id)
            p_member = next(p for p in data["participants"] if p["id"] == member_participant_id)
            assert p_guest["answered"] is True
            assert p_member["answered"] is True
            assert p_guest["score"] > 0
            assert p_member["score"] == 0.0
            
            assert data["answer_distribution"]["B"] == 2
            assert data["answer_distribution"]["A"] == 0
            print("Successfully verified Host Live Dashboard stats (answers, roster & distribution).")

        # TEST 2.10: Host advances to Next Question -> Quiz finishes
        print("TEST 2.10: Host advances to next question (Quiz should end)...")
        next_q_url = f"{base_url}/rooms/{room_id}/next-question"
        req_next = urllib.request.Request(
            next_q_url,
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req_next) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["status"] == "ENDED"
            print("Successfully verified host next-question finishes game when questions end.")

        # TEST 3: End Room (POST /rooms/{room_id}/end)
        print("TEST 3: End Live Room Session...")
        end_url = f"{base_url}/rooms/{room_id}/end"
        req_end = urllib.request.Request(
            end_url,
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req_end) as res:
            data = json.loads(res.read().decode('utf-8'))
            assert res.status == 200
            assert data["status"] == "ENDED"
            assert data["ended_at"] is not None
            print(f"Successfully ended room session {room_id}")

        # TEST 4: Verify Room is no longer accessible by code (Should return 404)
        print("TEST 4: Verify ended room is no longer accessible...")
        try:
            urllib.request.urlopen(req_get)
            assert False, "Should have failed with 404 since the room is ended"
        except urllib.error.HTTPError as e:
            assert e.code == 404
            print("Successfully verified ended room returns 404")

        print("ALL TESTS PASSED SUCCESSFULLY!")

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8') if hasattr(e, 'read') else ""
        print(f"TEST FAILED with HTTPError: {e.code} - {e.reason}\nResponse Body: {error_body}")
        raise e
    except Exception as e:
        print(f"TEST FAILED: {str(e)}")
        raise e

    finally:
        print("Cleaning up database...")
        # Clean up database records
        db.query(Room).filter(Room.host_id == host.id).delete(synchronize_session=False)
        db.query(Quiz).filter(Quiz.user_id == host.id).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([host.id, member.id])).delete(synchronize_session=False)
        db.commit()
        db.close()
        print("Cleanup done.")

if __name__ == "__main__":
    run_test()
