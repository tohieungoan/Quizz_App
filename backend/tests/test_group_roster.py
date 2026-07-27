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
    print("Testing connection to DB for Group Roster Analytics API...")

    # 1. Setup mock data
    host = User(
        email="test_host_roster@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Host Roster",
        role="USER",
        status="ACTIVE"
    )
    student_a = User(
        email="alex.j@example.com",
        password=get_password_hash("testpassword"),
        fullname="Alex Johnson",
        role="USER",
        status="ACTIVE"
    )
    student_b = User(
        email="sarah.s@example.com",
        password=get_password_hash("testpassword"),
        fullname="Sarah Smith",
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
        # Create 3 Quizzes owned by Host
        quiz1 = Quiz(user_id=host.id, title="Midterm Biology 101", subject="Biology", difficulty="Medium", status="ACTIVE")
        quiz2 = Quiz(user_id=host.id, title="Advanced Physics Ch. 4", subject="Physics", difficulty="Hard", status="ACTIVE")
        quiz3 = Quiz(user_id=host.id, title="Calculus III Vector Calculus", subject="Mathematics", difficulty="Hard", status="ACTIVE")
        db.add_all([quiz1, quiz2, quiz3])
        db.commit()
        db.refresh(quiz1)
        db.refresh(quiz2)
        db.refresh(quiz3)

        # Create Group owned by Host
        group = Group(
            owner_id=host.id,
            name="Science Group",
            description="Physics and Math Group",
            status="OPEN",
            group_code="SCIENCE_GRP"
        )
        db.add(group)
        db.commit()
        db.refresh(group)

        # Add Student A and B as APPROVED members
        member_a = GroupMember(group_id=group.id, user_id=student_a.id, role_in_group="STUDENT", status="APPROVED", joined_at=datetime.utcnow())
        member_b = GroupMember(group_id=group.id, user_id=student_b.id, role_in_group="STUDENT", status="APPROVED", joined_at=datetime.utcnow())
        db.add_all([member_a, member_b])
        db.commit()

        # Assign 3 Exams to Group (with different schedules to avoid duplicate filter)
        now = datetime.utcnow()
        exam1 = Exam(quiz_id=quiz1.id, host_id=host.id, group_id=group.id, title=quiz1.title, end_time=now + timedelta(days=2), timer=60, status="ACTIVE", created_at=now - timedelta(hours=3))
        exam2 = Exam(quiz_id=quiz2.id, host_id=host.id, group_id=group.id, title=quiz2.title, end_time=now + timedelta(days=3), timer=90, status="ACTIVE", created_at=now - timedelta(hours=2))
        exam3 = Exam(quiz_id=quiz3.id, host_id=host.id, group_id=group.id, title=quiz3.title, end_time=now + timedelta(days=4), timer=120, status="ACTIVE", created_at=now - timedelta(hours=1))
        db.add_all([exam1, exam2, exam3])
        db.commit()
        db.refresh(exam1)
        db.refresh(exam2)
        db.refresh(exam3)

        # Create ExamAssignees for Student A (completed 3/3 with scores: 85, 95, 96)
        assignee_a1 = ExamAssignee(exam_id=exam1.id, user_id=student_a.id, status="COMPLETED", score=85.0, submitted_at=now - timedelta(hours=1))
        assignee_a2 = ExamAssignee(exam_id=exam2.id, user_id=student_a.id, status="COMPLETED", score=95.0, submitted_at=now - timedelta(hours=1))
        assignee_a3 = ExamAssignee(exam_id=exam3.id, user_id=student_a.id, status="COMPLETED", score=96.0, submitted_at=now - timedelta(hours=1))
        
        # Create ExamAssignees for Student B (completed 2/3 with scores: 92, 86; 1 not started)
        assignee_b1 = ExamAssignee(exam_id=exam1.id, user_id=student_b.id, status="COMPLETED", score=92.0, submitted_at=now - timedelta(hours=1))
        assignee_b2 = ExamAssignee(exam_id=exam2.id, user_id=student_b.id, status="COMPLETED", score=86.0, submitted_at=now - timedelta(hours=1))
        # (Third exam exam3 not started - no ExamAssignee or status PENDING)
        assignee_b3 = ExamAssignee(exam_id=exam3.id, user_id=student_b.id, status="PENDING")
        
        db.add_all([assignee_a1, assignee_a2, assignee_a3, assignee_b1, assignee_b2, assignee_b3])
        db.commit()

        # Generate Host Token
        host_token = create_access_token(subject=host.id)

        base_url = "http://127.0.0.1:8000/api/v1"

        # TEST: Get Group Roster
        print("TEST: Calling GET /groups/{group_id}/roster ...")
        url = f"{base_url}/groups/{group.id}/roster"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {host_token}"},
            method="GET"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response:", json.dumps(res_body, indent=2))
            
            assert len(res_body) == 2
            
            # Verify Student A (Alex Johnson)
            student_a_data = next(item for item in res_body if item["email"] == "alex.j@example.com")
            assert student_a_data["name"] == "Alex Johnson"
            assert student_a_data["examsCompleted"] == 3
            assert student_a_data["totalExamsAssigned"] == 3
            assert student_a_data["averageScore"] == "92%" # (85 + 95 + 96) / 3 = 92
            
            # Order of exam scores breakdown should match order_by created_at DESC (exam3, exam2, exam1)
            exam_scores_a = student_a_data["examScores"]
            assert len(exam_scores_a) == 3
            assert exam_scores_a[0]["examTitle"] == "Calculus III Vector Calculus"
            assert exam_scores_a[0]["score"] == "96%"
            assert exam_scores_a[0]["status"] == "Completed"
            
            assert exam_scores_a[1]["examTitle"] == "Advanced Physics Ch. 4"
            assert exam_scores_a[1]["score"] == "95%"
            
            assert exam_scores_a[2]["examTitle"] == "Midterm Biology 101"
            assert exam_scores_a[2]["score"] == "85%"

            # Verify Student B (Sarah Smith)
            student_b_data = next(item for item in res_body if item["email"] == "sarah.s@example.com")
            assert student_b_data["name"] == "Sarah Smith"
            assert student_b_data["examsCompleted"] == 2
            assert student_b_data["totalExamsAssigned"] == 3
            assert student_b_data["averageScore"] == "89%" # (92 + 86) / 2 = 89
            
            exam_scores_b = student_b_data["examScores"]
            assert len(exam_scores_b) == 3
            assert exam_scores_b[0]["examTitle"] == "Calculus III Vector Calculus"
            assert exam_scores_b[0]["score"] == "--"
            assert exam_scores_b[0]["status"] == "Not Started"
            
            assert exam_scores_b[1]["examTitle"] == "Advanced Physics Ch. 4"
            assert exam_scores_b[1]["score"] == "86%"
            
            assert exam_scores_b[2]["examTitle"] == "Midterm Biology 101"
            assert exam_scores_b[2]["score"] == "92%"

        print("\nALL ROSTER ANALYTICS API TESTS PASSED SUCCESSFULLY!")

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
