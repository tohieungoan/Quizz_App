import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.user import User
from app.models.quiz import Quiz
from app.models.group import Group, GroupMember
from app.models.exam import Exam, ExamAssignee
from app.models.notification import Notification
from app.core.security import get_password_hash, create_access_token

def run_test():
    db = SessionLocal()
    print("Testing connection to DB for Exam Assign...")

    # 1. Setup mock data
    host = User(
        email="test_host_exam@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Host Exam",
        role="USER",
        status="ACTIVE"
    )
    student = User(
        email="test_student_exam@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Student Exam",
        role="USER",
        status="ACTIVE"
    )
    db.add_all([host, student])
    db.commit()
    db.refresh(host)
    db.refresh(student)

    print(f"Created test users: Host({host.id}), Student({student.id})")

    try:
        # Create Quiz owned by Host
        quiz = Quiz(
            user_id=host.id,
            title="Math Quiz 101",
            subject="Mathematics",
            description="Testing exam assignment",
            difficulty="Medium",
            is_public=False,
            status="ACTIVE"
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)
        print(f"Created test quiz: {quiz.id} ({quiz.title})")

        # Create Group owned by Host
        group = Group(
            owner_id=host.id,
            name="Math Class A",
            description="Mathematics study group",
            status="OPEN",
            group_code="MATH_CLASS_A"
        )
        db.add(group)
        db.commit()
        db.refresh(group)
        print(f"Created test group: {group.id} ({group.name})")

        # Add Student as APPROVED member of Group
        member = GroupMember(
            group_id=group.id,
            user_id=student.id,
            role_in_group="STUDENT",
            status="APPROVED",
            joined_at=datetime.utcnow()
        )
        db.add(member)
        db.commit()
        print("Added Student as APPROVED member")

        # Generate tokens
        host_token = create_access_token(subject=host.id)
        student_token = create_access_token(subject=student.id)

        # Base URL of local server
        base_url = "http://127.0.0.1:8000/api/v1"

        # TEST 1: Assign Quiz as Exam
        print("TEST 1: Assign Quiz as Exam...")
        url = f"{base_url}/exams/assign"
        deadline = datetime.utcnow() + timedelta(days=2)
        payload = {
            "quiz_id": quiz.id,
            "group_id": group.id,
            "title": "Algebra Midterm Exam",
            "end_time": deadline.isoformat(),
            "timer": 90,  # 90 minutes
            "navigation_rule": "FIXED_NAV",
            "results_published": True,
            "status": "ACTIVE"
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {host_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)
            assert res_body["exam"]["title"] == "Algebra Midterm Exam"
            assert res_body["exam"]["navigation_rule"] == "FIXED_NAV"
            assert res_body["exam"]["results_published"] is True
            assert res_body["assignees_count"] == 1
            exam_id = res_body["exam"]["id"]

        # Check DB for ExamAssignee and Notification
        assignee = db.query(ExamAssignee).filter(ExamAssignee.exam_id == exam_id, ExamAssignee.user_id == student.id).first()
        assert assignee is not None
        assert assignee.status == "PENDING"

        notif = db.query(Notification).filter(Notification.user_id == student.id, Notification.type == "EXAM_ASSIGNED").first()
        assert notif is not None
        assert "Algebra Midterm Exam" in notif.content
        print("TEST 1 PASSED: Exam (with navigation_rule/results_published), ExamAssignee, and Notification created correctly")

        # TEST 1.5: Try to assign the same quiz to the same group again (should fail with 400)
        print("TEST 1.5: Duplicate Exam Assignment (Expected to fail)...")
        req_dup = urllib.request.Request(
            f"{base_url}/exams/assign",
            data=data,
            headers={
                "Authorization": f"Bearer {host_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req_dup) as response:
                print("Error: duplicate exam assignment succeeded but should have failed!")
                assert False
        except urllib.error.HTTPError as e:
            assert e.code == 400
            error_body = json.loads(e.read().decode("utf-8"))
            assert "already exists" in error_body["detail"]
            print("TEST 1.5 PASSED: Duplicate exam assignment rejected correctly with 400 Bad Request")

        # TEST 1.6: Try to assign the same quiz to the same group but with DIFFERENT end_time (should succeed for practice)
        print("TEST 1.6: Assign Same Quiz but with Different Schedule (Expected to succeed)...")
        payload_diff = payload.copy()
        payload_diff["end_time"] = (deadline + timedelta(days=3)).isoformat()
        data_diff = json.dumps(payload_diff).encode("utf-8")
        req_diff = urllib.request.Request(
            f"{base_url}/exams/assign",
            data=data_diff,
            headers={
                "Authorization": f"Bearer {host_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req_diff) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 1.6:", res_body)
            assert res_body["exam"]["title"] == "Algebra Midterm Exam"
            print("TEST 1.6 PASSED: Re-assigned same quiz for practice with different schedule successfully")

        # TEST 2: Retrieve Assigned Exams (Host perspective)
        print("TEST 2: Retrieve Assigned Exams...")
        url = f"{base_url}/exams/assigned"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {host_token}"},
            method="GET"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)
            assert len(res_body) >= 1
            assigned_exam = next(item for item in res_body if item["id"] == exam_id)
            assert assigned_exam["title"] == "Algebra Midterm Exam"
            assert assigned_exam["results_published"] is True
            assert assigned_exam["total_assignees"] == 1
            assert assigned_exam["submitted_count"] == 0
        print("TEST 2 PASSED: Host retrieved correct assigned exam list")

        # TEST 3: Retrieve My Exams (Student perspective)
        print("TEST 3: Retrieve My Exams...")
        url = f"{base_url}/exams/my-exams"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {student_token}"},
            method="GET"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)
            assert len(res_body) >= 1
            student_exam = next(item for item in res_body if item["exam_id"] == exam_id)
            assert student_exam["exam_title"] == "Algebra Midterm Exam"
            assert student_exam["status"] == "PENDING"
            assert student_exam["timer"] == 90
            assert student_exam["host_fullname"] == "Test Host Exam"
            assert student_exam["quiz_subject"] == "Mathematics"
        print("TEST 3 PASSED: Student retrieved correct assigned exam list")

        # TEST 4: Get Exam Details (Read single)
        print("TEST 4: Get Exam Details...")
        url = f"{base_url}/exams/{exam_id}"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {host_token}"},
            method="GET"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 4:", res_body)
            assert res_body["exam"]["id"] == exam_id
            assert res_body["assignees_count"] == 1
            assert res_body["assignees"][0]["user_id"] == student.id
        print("TEST 4 PASSED: Retrieved exam details correctly")

        # TEST 5: Update Exam Details (Update)
        print("TEST 5: Update Exam Details...")
        url = f"{base_url}/exams/{exam_id}"
        payload_update = {
            "title": "Algebra Midterm Exam v2",
            "timer": 120,
            "results_published": False
        }
        data_update = json.dumps(payload_update).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_update,
            headers={
                "Authorization": f"Bearer {host_token}",
                "Content-Type": "application/json"
            },
            method="PUT"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 5:", res_body)
            assert res_body["title"] == "Algebra Midterm Exam v2"
            assert res_body["timer"] == 120
            assert res_body["results_published"] is False
        print("TEST 5 PASSED: Updated exam settings successfully")

        # TEST 6: Delete Exam (Delete)
        print("TEST 6: Delete Exam...")
        url = f"{base_url}/exams/{exam_id}"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {host_token}"},
            method="DELETE"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 6:", res_body)
            assert "deleted successfully" in res_body["message"]
            assert res_body["exam_id"] == exam_id

        # Verify it is deleted in DB
        db.expire_all()
        deleted_exam = db.query(Exam).filter(Exam.id == exam_id).first()
        assert deleted_exam is None
        print("TEST 6 PASSED: Deleted exam successfully")

        print("\nALL EXAM ASSIGN TESTS PASSED SUCCESSFULLY!")

    finally:
        # Cleanup
        print("Cleaning up database...")
        db.query(Notification).filter(Notification.user_id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.query(ExamAssignee).filter(ExamAssignee.user_id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.query(Exam).filter(Exam.host_id == host.id).delete(synchronize_session=False)
        db.query(GroupMember).filter(GroupMember.user_id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.query(Group).filter(Group.owner_id == host.id).delete(synchronize_session=False)
        db.query(Quiz).filter(Quiz.user_id == host.id).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.commit()
        db.close()
        print("Cleanup done.")

if __name__ == "__main__":
    run_test()
