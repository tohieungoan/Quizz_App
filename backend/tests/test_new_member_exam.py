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
    print("Testing connection to DB for New Member Auto Exam Assignment...")

    # 1. Setup mock data
    host = User(
        email="test_host_member@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Host Member",
        role="USER",
        status="ACTIVE"
    )
    student_a = User(
        email="test_student_a@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Student A",
        role="USER",
        status="ACTIVE"
    )
    student_b = User(
        email="test_student_b@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Student B",
        role="USER",
        status="ACTIVE"
    )
    db.add_all([host, student_a, student_b])
    db.commit()
    db.refresh(host)
    db.refresh(student_a)
    db.refresh(student_b)

    print(f"Created test users: Host({host.id}), Student A({student_a.id}), Student B({student_b.id})")

    try:
        # Create Quiz owned by Host
        quiz = Quiz(
            user_id=host.id,
            title="Geometry Quiz",
            subject="Mathematics",
            description="Testing member auto assignment",
            difficulty="Medium",
            is_public=False,
            status="ACTIVE"
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        # Create Group owned by Host
        group = Group(
            owner_id=host.id,
            name="Geometry Class",
            description="Geometry study group",
            status="OPEN",
            group_code="GEOMETRY_CLASS"
        )
        db.add(group)
        db.commit()
        db.refresh(group)

        # Add Student A as APPROVED member
        member_a = GroupMember(
            group_id=group.id,
            user_id=student_a.id,
            role_in_group="STUDENT",
            status="APPROVED",
            joined_at=datetime.utcnow()
        )
        db.add(member_a)
        db.commit()

        # Add Student B as PENDING member
        member_b = GroupMember(
            group_id=group.id,
            user_id=student_b.id,
            role_in_group="STUDENT",
            status="PENDING",
            requested_at=datetime.utcnow()
        )
        db.add(member_b)
        db.commit()
        print("Setup completed. Student A is APPROVED, Student B is PENDING.")

        # Generate tokens
        host_token = create_access_token(subject=host.id)
        student_b_token = create_access_token(subject=student_b.id)

        base_url = "http://127.0.0.1:8000/api/v1"

        # TEST 1: Assign Quiz to Group
        print("TEST 1: Assigning Quiz to Group...")
        url = f"{base_url}/exams/assign"
        deadline = datetime.utcnow() + timedelta(days=2)
        payload = {
            "quiz_id": quiz.id,
            "group_id": group.id,
            "title": "Geometry Midterm",
            "end_time": deadline.isoformat(),
            "timer": 45,
            "navigation_rule": "FREE_NAV",
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
            exam_id = res_body["exam"]["id"]
            print(f"Exam created with ID: {exam_id}. Assigned count: {res_body['assignees_count']}")
            assert res_body["assignees_count"] == 1  # Chỉ có Student A được gán lúc này

        # TEST 2: Approve Student B to join group
        print("TEST 2: Approving Student B to join group...")
        url = f"{base_url}/groups/{group.id}/requests/{student_b.id}/approve"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {host_token}"},
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", res_body)

        # Check DB to verify Student B is now APPROVED
        db.expire_all()
        mb = db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == student_b.id).first()
        assert mb.status == "APPROVED"
        print("Student B group membership is now APPROVED.")

        # Check if Student B has been automatically assigned the exam
        assignee_b = db.query(ExamAssignee).filter(ExamAssignee.exam_id == exam_id, ExamAssignee.user_id == student_b.id).first()
        assert assignee_b is not None
        assert assignee_b.status == "PENDING"
        print("TEST 2 PASSED: Student B was automatically assigned the ongoing exam!")

        # Verify Student B received Notification for the exam
        notif = db.query(Notification).filter(
            Notification.user_id == student_b.id,
            Notification.type == "EXAM_ASSIGNED"
        ).first()
        assert notif is not None
        assert "Geometry Midterm" in notif.content
        print("TEST 3 PASSED: Student B received exam assignment notification.")

        print("\nALL AUTO ASSIGN NEW MEMBER TESTS PASSED SUCCESSFULLY!")

    finally:
        # Cleanup
        print("Cleaning up database...")
        db.query(Notification).filter(Notification.user_id.in_([host.id, student_a.id, student_b.id])).delete(synchronize_session=False)
        db.query(ExamAssignee).filter(ExamAssignee.user_id.in_([host.id, student_a.id, student_b.id])).delete(synchronize_session=False)
        db.query(Exam).filter(Exam.host_id == host.id).delete(synchronize_session=False)
        db.query(GroupMember).filter(GroupMember.user_id.in_([host.id, student_a.id, student_b.id])).delete(synchronize_session=False)
        db.query(Group).filter(Group.owner_id == host.id).delete(synchronize_session=False)
        db.query(Quiz).filter(Quiz.user_id == host.id).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([host.id, student_a.id, student_b.id])).delete(synchronize_session=False)
        db.commit()
        db.close()
        print("Cleanup done.")

if __name__ == "__main__":
    run_test()
