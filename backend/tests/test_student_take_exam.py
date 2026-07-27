import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.user import User
from app.models.quiz import Quiz, Question, QuestionOption
from app.models.group import Group, GroupMember
from app.models.exam import Exam, ExamAssignee, ExamAnswer
from app.models.notification import Notification
from app.core.security import get_password_hash, create_access_token

def run_test():
    db = SessionLocal()
    print("Testing Student Exam Taking Flow API...")

    # 1. Setup mock data
    host = User(
        email="test_host_take@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Host Take",
        role="USER",
        status="ACTIVE"
    )
    student = User(
        email="test_student_take@example.com",
        password=get_password_hash("testpassword"),
        fullname="Test Student Take",
        role="USER",
        status="ACTIVE"
    )
    db.add_all([host, student])
    db.commit()
    db.refresh(host)
    db.refresh(student)

    try:
        # Create a Quiz with 2 multiple choice questions
        quiz = Quiz(user_id=host.id, title="Biology Basics", subject="Biology", difficulty="Easy", status="ACTIVE")
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        # Question 1: 1 option is correct (Option 1)
        q1 = Question(quiz_id=quiz.id, type="MULTIPLE_CHOICE", content="What is cellular respiration?", time_limit=10)
        db.add(q1)
        db.commit()
        db.refresh(q1)
        
        opt1_1 = QuestionOption(question_id=q1.id, content="ATP synthesis process", is_correct=True)
        opt1_2 = QuestionOption(question_id=q1.id, content="Protein breakdown process", is_correct=False)
        db.add_all([opt1_1, opt1_2])
        db.commit()

        # Question 2: 1 option is correct (Option 4)
        q2 = Question(quiz_id=quiz.id, type="MULTIPLE_CHOICE", content="How many chambers does a human heart have?", time_limit=10)
        db.add(q2)
        db.commit()
        db.refresh(q2)

        opt2_3 = QuestionOption(question_id=q2.id, content="3 chambers", is_correct=False)
        opt2_4 = QuestionOption(question_id=q2.id, content="4 chambers", is_correct=True)
        db.add_all([opt2_3, opt2_4])
        db.commit()
        db.refresh(opt1_1)
        db.refresh(opt1_2)
        db.refresh(opt2_3)
        db.refresh(opt2_4)

        # Create Group
        group = Group(owner_id=host.id, name="Biology Class", status="OPEN", group_code="BIO101")
        db.add(group)
        db.commit()
        db.refresh(group)

        # Add Student as APPROVED member
        member = GroupMember(group_id=group.id, user_id=student.id, role_in_group="STUDENT", status="APPROVED", joined_at=datetime.utcnow())
        db.add(member)
        db.commit()

        # Assign Exam to Group
        now = datetime.utcnow()
        exam = Exam(
            quiz_id=quiz.id,
            host_id=host.id,
            group_id=group.id,
            title="Biology Final Exam",
            end_time=now + timedelta(days=1),
            timer=10,  # 10 minutes
            status="ACTIVE"
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)

        # Create ExamAssignee
        assignee = ExamAssignee(exam_id=exam.id, user_id=student.id, status="PENDING")
        db.add(assignee)
        db.commit()
        db.refresh(assignee)

        # Generate Student Token
        student_token = create_access_token(subject=student.id)
        base_url = "http://127.0.0.1:8000/api/v1"

        # TEST 1: Try to retrieve questions before starting (Expected to fail)
        print("TEST 1: Get questions before start (Expected to fail)...")
        url_take = f"{base_url}/exams/{exam.id}/take"
        req = urllib.request.Request(
            url_take,
            headers={"Authorization": f"Bearer {student_token}"},
            method="GET"
        )
        try:
            with urllib.request.urlopen(req) as response:
                print("Error: should not succeed.")
                assert False
        except urllib.error.HTTPError as e:
            res_body = json.loads(e.read().decode("utf-8"))
            print("Response 1:", res_body)
            assert e.code == 400
            assert "start the exam first" in res_body["detail"]
            print("TEST 1 PASSED: Cannot take questions before calling start")

        # TEST 2: Start the exam
        print("TEST 2: Start the exam (Expected to succeed)...")
        url_start = f"{base_url}/exams/{exam.id}/start"
        req = urllib.request.Request(
            url_start,
            headers={"Authorization": f"Bearer {student_token}"},
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 2:", res_body)
            assert "started successfully" in res_body["message"]
        print("TEST 2 PASSED: Exam started successfully")

        # TEST 3: Try to start the exam again (Expected to succeed for continuing)
        print("TEST 3: Try starting again (Expected to succeed for continuing)...")
        req_start_again = urllib.request.Request(
            url_start,
            headers={"Authorization": f"Bearer {student_token}"},
            method="POST"
        )
        with urllib.request.urlopen(req_start_again) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 3:", res_body)
            assert "already in progress" in res_body["message"]
            assert "Continuing" in res_body["message"]
        print("TEST 3 PASSED: Continuing exam (start endpoint redirects to continuing message if within time)")

        # TEST 4: Get questions (Expected to succeed and hide correctness)
        print("TEST 4: Get questions (Excluding correct options)...")
        req = urllib.request.Request(
            url_take,
            headers={"Authorization": f"Bearer {student_token}"},
            method="GET"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 4:", json.dumps(res_body, indent=2))
            assert len(res_body["questions"]) == 2
            
            # Verify options correct answer safety
            for q in res_body["questions"]:
                for o in q["options"]:
                    assert "is_correct" not in o
            print("TEST 4 PASSED: Retrieved questions, hidden correct options correctly")

        # TEST 5: Submit answers
        print("TEST 5: Save answers to questions...")
        # Q1: Correct (opt1_1)
        payload_ans1 = {
            "question_id": q1.id,
            "selected_option_id": opt1_1.id
        }
        req_ans1 = urllib.request.Request(
            f"{base_url}/exams/{exam.id}/answer",
            data=json.dumps(payload_ans1).encode("utf-8"),
            headers={"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_ans1) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 5.1:", res_body)
            assert "saved successfully" in res_body["message"]

        # Q2: Incorrect (opt2_3)
        payload_ans2 = {
            "question_id": q2.id,
            "selected_option_id": opt2_3.id
        }
        req_ans2 = urllib.request.Request(
            f"{base_url}/exams/{exam.id}/answer",
            data=json.dumps(payload_ans2).encode("utf-8"),
            headers={"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req_ans2) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 5.2:", res_body)
        print("TEST 5 PASSED: Answers saved successfully")

        # TEST 6: Submit the exam (Expected score: 50.0%)
        print("TEST 6: Submit the exam...")
        url_submit = f"{base_url}/exams/{exam.id}/submit"
        req = urllib.request.Request(
            url_submit,
            headers={"Authorization": f"Bearer {student_token}"},
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 6:", res_body)
            assert "submitted successfully" in res_body["message"]
            assert res_body["score"] == "50.0%"
        print("TEST 6 PASSED: Exam submitted, score calculated as 50.0% successfully")

        # TEST 7: Try to change answers after submit (Expected to fail)
        print("TEST 7: Change answer after submit (Expected to fail)...")
        try:
            with urllib.request.urlopen(req_ans1) as response:
                assert False
        except urllib.error.HTTPError as e:
            res_body = json.loads(e.read().decode("utf-8"))
            print("Response 7:", res_body)
            assert e.code == 400
            assert "only submit answers while the exam is IN_PROGRESS" in res_body["detail"]
            print("TEST 7 PASSED: Actions locked after submission")

        # TEST 8: Test Abandon Flow (Create another active exam and student abandons it)
        print("TEST 8: Test Abandon/Exit Flow...")
        exam_ab = Exam(quiz_id=quiz.id, host_id=host.id, group_id=group.id, title="Chemistry Exam", end_time=now + timedelta(days=1), timer=10, status="ACTIVE")
        db.add(exam_ab)
        db.commit()
        db.refresh(exam_ab)

        assignee_ab = ExamAssignee(exam_id=exam_ab.id, user_id=student.id, status="PENDING")
        db.add(assignee_ab)
        db.commit()
        db.refresh(assignee_ab)

        # Student starts exam_ab
        req_start_ab = urllib.request.Request(
            f"{base_url}/exams/{exam_ab.id}/start",
            headers={"Authorization": f"Bearer {student_token}"},
            method="POST"
        )
        with urllib.request.urlopen(req_start_ab):
            pass

        # Student abandons exam_ab (Exited/Close tab)
        req_abandon = urllib.request.Request(
            f"{base_url}/exams/{exam_ab.id}/abandon",
            headers={"Authorization": f"Bearer {student_token}"},
            method="POST"
        )
        with urllib.request.urlopen(req_abandon) as response:
            res_body = json.loads(response.read().decode("utf-8"))
            print("Response 8:", res_body)
            assert "abandoned (exited)" in res_body["message"]
            assert res_body["score"] == "0.0%"

        # Student try to start again (Expected to fail)
        try:
            with urllib.request.urlopen(req_start_ab) as response:
                assert False
        except urllib.error.HTTPError as e:
            res_body = json.loads(e.read().decode("utf-8"))
            print("Response 8.2:", res_body)
            assert e.code == 400
            assert "completed or abandoned" in res_body["detail"]
            print("TEST 8 PASSED: Abandon locks the exam and scores it 0% (if no answers saved) or current score")

        print("\nALL STUDENT EXAM TAKING TESTS PASSED SUCCESSFULLY!")

    finally:
        # Cleanup
        print("Cleaning up database...")
        db.query(Notification).filter(Notification.user_id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.query(ExamAnswer).filter(ExamAnswer.exam_assignee_id.in_(
            db.query(ExamAssignee.id).filter(ExamAssignee.user_id == student.id)
        )).delete(synchronize_session=False)
        db.query(ExamAssignee).filter(ExamAssignee.user_id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.query(Exam).filter(Exam.host_id == host.id).delete(synchronize_session=False)
        db.query(GroupMember).filter(GroupMember.user_id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.query(Group).filter(Group.owner_id == host.id).delete(synchronize_session=False)
        db.query(QuestionOption).filter(QuestionOption.question_id.in_(
            db.query(Question.id).filter(Question.quiz_id == quiz.id)
        )).delete(synchronize_session=False)
        db.query(Question).filter(Question.quiz_id == quiz.id).delete(synchronize_session=False)
        db.query(Quiz).filter(Quiz.user_id == host.id).delete(synchronize_session=False)
        db.query(User).filter(User.id.in_([host.id, student.id])).delete(synchronize_session=False)
        db.commit()
        db.close()
        print("Cleanup done.")

if __name__ == "__main__":
    run_test()
