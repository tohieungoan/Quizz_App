from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
import csv
import io
import zipfile

from app.models.quiz import Quiz, Question
from app.models.user import User
from app.models.room import Room, Participant, ParticipantAnswer
from app.models.exam import Exam, ExamAssignee, ExamAnswer
from app.schemas.report import ReportMetrics, ReportListItem, ReportPageResponse

class CRUDReport:
    def get_metrics(self, db: Session) -> ReportMetrics:
        total_participants = db.query(func.count(Participant.id)).scalar() or 0
        total_assignees = db.query(func.count(ExamAssignee.id)).scalar() or 0
        total_users = total_participants + total_assignees

        total_questions = db.query(func.count(Question.id)).scalar() or 0

        # Calculate average score percentage from ParticipantAnswer
        # Assuming is_correct is boolean
        total_answers = db.query(func.count(ParticipantAnswer.id)).scalar() or 0
        correct_answers = db.query(func.count(ParticipantAnswer.id)).filter(ParticipantAnswer.is_correct == True).scalar() or 0
        
        avg_score = 0.0
        if total_answers > 0:
            avg_score = (correct_answers / total_answers) * 100.0

        return ReportMetrics(
            avg_score=round(avg_score, 1),
            total_participants=total_users,
            total_questions=total_questions
        )

    def get_reports_paginated(
        self, db: Session, search: str = "", report_type: str = "ALL", skip: int = 0, limit: int = 5
    ) -> ReportPageResponse:
        
        all_reports = []

        # 1. Fetch finished Rooms
        if report_type in ["ALL", "ROOM"]:
            rooms = (
                db.query(Room, Quiz.title.label("quiz_title"), User.fullname.label("host_name"))
                .join(Quiz, Room.quiz_id == Quiz.id)
                .join(User, Room.host_id == User.id)
                .filter(Room.status == "FINISHED")
                .all()
            )
            for row in rooms:
                room, quiz_title, host_name = row
                # Count participants
                p_count = db.query(func.count(Participant.id)).filter(Participant.room_id == room.id).scalar() or 0
                
                # Avg score for this room
                r_total_ans = db.query(func.count(ParticipantAnswer.id)).join(Participant).filter(Participant.room_id == room.id).scalar() or 0
                r_corr_ans = db.query(func.count(ParticipantAnswer.id)).join(Participant).filter(Participant.room_id == room.id, ParticipantAnswer.is_correct == True).scalar() or 0
                r_avg = f"{(r_corr_ans / r_total_ans * 100):.1f}%" if r_total_ans > 0 else "0.0%"

                date_str = room.ended_at.strftime("%Y-%m-%d %H:%M") if room.ended_at else (room.created_at.strftime("%Y-%m-%d %H:%M") if room.created_at else "")

                # Apply search filter
                search_lower = search.lower()
                if search_lower in (quiz_title or "").lower() or search_lower in (room.title or room.room_code or "").lower() or search_lower in (host_name or "").lower():
                    all_reports.append(ReportListItem(
                        id=room.id,
                        type="ROOM",
                        room_code=room.room_code or "",
                        quiz_title=quiz_title or "",
                        room_title=room.title or room.room_code or "",
                        host=host_name or "",
                        date=date_str,
                        participants=p_count,
                        avg_score=r_avg
                    ))

        # 2. Fetch finished Exams
        if report_type in ["ALL", "EXAM"]:
            exams = (
                db.query(Exam, Quiz.title.label("quiz_title"), User.fullname.label("host_name"))
                .join(Quiz, Exam.quiz_id == Quiz.id)
                .join(User, Exam.host_id == User.id)
                .filter(Exam.status == "FINISHED") # Assuming FINISHED status for exams
                .all()
            )
            for row in exams:
                exam, quiz_title, host_name = row
                p_count = db.query(func.count(ExamAssignee.id)).filter(ExamAssignee.exam_id == exam.id).scalar() or 0
                
                # Avg score for exam
                e_total_ans = db.query(func.count(ExamAnswer.id)).join(ExamAssignee).filter(ExamAssignee.exam_id == exam.id).scalar() or 0
                e_corr_ans = db.query(func.count(ExamAnswer.id)).join(ExamAssignee).filter(ExamAssignee.exam_id == exam.id, ExamAnswer.is_correct == True).scalar() or 0
                e_avg = f"{(e_corr_ans / e_total_ans * 100):.1f}%" if e_total_ans > 0 else "0.0%"
                
                date_str = exam.end_time.strftime("%Y-%m-%d %H:%M") if exam.end_time else (exam.created_at.strftime("%Y-%m-%d %H:%M") if exam.created_at else "")

                search_lower = search.lower()
                if search_lower in (quiz_title or "").lower() or search_lower in (exam.title or "").lower() or search_lower in (host_name or "").lower():
                    all_reports.append(ReportListItem(
                        id=exam.id,
                        type="EXAM",
                        room_code=f"EX-{exam.id}",
                        quiz_title=quiz_title or "",
                        room_title=exam.title or f"Exam {exam.id}",
                        host=host_name or "",
                        date=date_str,
                        participants=p_count,
                        avg_score=e_avg
                    ))

        # Sort by date descending (simple string sort works well enough for YYYY-MM-DD HH:MM)
        all_reports.sort(key=lambda x: x.date, reverse=True)
        
        total = len(all_reports)
        paginated_reports = all_reports[skip : skip + limit]

        return ReportPageResponse(
            data=paginated_reports,
            total=total,
            pageIndex=(skip // limit) + 1 if limit > 0 else 1,
            pageSize=limit
        )

    def export_report_zip(self, db: Session, session_id: int, session_type: str) -> bytes:
        """
        Generates a ZIP file in memory containing participants.csv and questions_accuracy.csv
        """
        # Generate participants CSV
        participants_output = io.StringIO()
        p_writer = csv.writer(participants_output)
        p_writer.writerow(["Student Name", "Score", "Time Taken (mins)", "Status"])

        # Generate questions CSV
        questions_output = io.StringIO()
        q_writer = csv.writer(questions_output)
        q_writer.writerow(["Question ID", "Question Content", "Total Answers", "Correct", "Incorrect", "Accuracy (%)"])

        if session_type.upper() == "ROOM":
            # 1. Participants data
            participants = db.query(Participant).filter(Participant.room_id == session_id).all()
            for p in participants:
                p_writer.writerow([
                    p.nickname or "Anonymous", 
                    p.score, 
                    "N/A", 
                    p.status or "Completed"
                ])
                
            # 2. Questions Accuracy data
            room = db.query(Room).filter(Room.id == session_id).first()
            if room:
                questions = db.query(Question).filter(Question.quiz_id == room.quiz_id).all()
                for q in questions:
                    total_ans = db.query(func.count(ParticipantAnswer.id)).join(Participant).filter(
                        Participant.room_id == session_id,
                        ParticipantAnswer.question_id == q.id
                    ).scalar() or 0
                    
                    correct_ans = db.query(func.count(ParticipantAnswer.id)).join(Participant).filter(
                        Participant.room_id == session_id,
                        ParticipantAnswer.question_id == q.id,
                        ParticipantAnswer.is_correct == True
                    ).scalar() or 0
                    
                    incorrect_ans = total_ans - correct_ans
                    acc = f"{(correct_ans / total_ans * 100):.1f}%" if total_ans > 0 else "0.0%"
                    
                    content_preview = (q.content[:50] + "...") if q.content and len(q.content) > 50 else (q.content or "No content")
                    q_writer.writerow([q.id, content_preview, total_ans, correct_ans, incorrect_ans, acc])

        elif session_type.upper() == "EXAM":
            # 1. Assignees data
            assignees = db.query(ExamAssignee).filter(ExamAssignee.exam_id == session_id).all()
            for a in assignees:
                user = db.query(User).filter(User.id == a.user_id).first()
                u_name = user.fullname if user else "Anonymous"
                p_writer.writerow([
                    u_name,
                    a.score,
                    "N/A",
                    a.status or "Completed"
                ])
                
            # 2. Questions Accuracy data
            exam = db.query(Exam).filter(Exam.id == session_id).first()
            if exam:
                questions = db.query(Question).filter(Question.quiz_id == exam.quiz_id).all()
                for q in questions:
                    total_ans = db.query(func.count(ExamAnswer.id)).join(ExamAssignee).filter(
                        ExamAssignee.exam_id == session_id,
                        ExamAnswer.question_id == q.id
                    ).scalar() or 0
                    
                    correct_ans = db.query(func.count(ExamAnswer.id)).join(ExamAssignee).filter(
                        ExamAssignee.exam_id == session_id,
                        ExamAnswer.question_id == q.id,
                        ExamAnswer.is_correct == True
                    ).scalar() or 0
                    
                    incorrect_ans = total_ans - correct_ans
                    acc = f"{(correct_ans / total_ans * 100):.1f}%" if total_ans > 0 else "0.0%"
                    
                    content_preview = (q.content[:50] + "...") if q.content and len(q.content) > 50 else (q.content or "No content")
                    q_writer.writerow([q.id, content_preview, total_ans, correct_ans, incorrect_ans, acc])

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("participants.csv", participants_output.getvalue().encode('utf-8'))
            zf.writestr("questions_accuracy.csv", questions_output.getvalue().encode('utf-8'))
            
        return zip_buffer.getvalue()

crud_report = CRUDReport()
