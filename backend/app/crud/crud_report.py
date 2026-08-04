from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, case
import csv
import io
import zipfile

from app.models.quiz import Quiz, Question
from app.models.user import User
from app.models.room import Room, Participant, ParticipantAnswer
from app.models.exam import Exam, ExamAssignee, ExamAnswer
from app.schemas.report import ReportMetrics, ReportListItem, ReportPageResponse, ReportParticipant, ReportQuestionAnalysis, ReportParticipantPageResponse, ReportQuestionPageResponse

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

        # 1. Fetch ended Rooms
        if report_type in ["ALL", "ROOM"]:
            rooms = (
                db.query(Room, Quiz.title.label("quiz_title"), User.fullname.label("host_name"))
                .join(Quiz, Room.quiz_id == Quiz.id)
                .join(User, Room.host_id == User.id)
                .filter(Room.status == "ENDED")
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

        # 2. Fetch completed Exams (ACTIVE exams that have passed their end_time, or all ACTIVE exams with assignees who completed)
        if report_type in ["ALL", "EXAM"]:
            exams = (
                db.query(Exam, Quiz.title.label("quiz_title"), User.fullname.label("host_name"))
                .join(Quiz, Exam.quiz_id == Quiz.id)
                .join(User, Exam.host_id == User.id)
                .filter(Exam.status.in_(["ACTIVE", "ENDED", "FINISHED", "COMPLETED"]))
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

    def get_report_participants(self, db: Session, session_id: int, session_type: str, skip: int = 0, limit: int = 50) -> ReportParticipantPageResponse:
        results = []
        total = 0
        
        if session_type.upper() == "ROOM":
            query = db.query(Participant).filter(Participant.room_id == session_id)
            total = query.count()
            # Get all participants sorted by score for ranking
            all_participants = query.order_by(desc(Participant.score)).all()
            
            # Build rank map (1-indexed)
            rank_map = {}
            for idx, p in enumerate(all_participants):
                rank_map[p.id] = idx + 1
            
            # Paginate
            paginated = all_participants[skip:skip + limit]
            
            for p in paginated:
                # Calculate correct/total answers
                total_ans = db.query(func.count(ParticipantAnswer.id)).filter(
                    ParticipantAnswer.participant_id == p.id
                ).scalar() or 0
                correct_ans = db.query(func.count(ParticipantAnswer.id)).filter(
                    ParticipantAnswer.participant_id == p.id,
                    ParticipantAnswer.is_correct == True
                ).scalar() or 0
                
                acc = f"{(correct_ans / total_ans * 100):.1f}%" if total_ans > 0 else "0%"
                
                results.append(ReportParticipant(
                    id=f"P-{p.id}",
                    user_id=str(p.user_id) if hasattr(p, 'user_id') and p.user_id else None,
                    nickname=p.nickname or "Anonymous",
                    status=p.status or "Completed",
                    joined_at=p.joined_at.strftime("%Y-%m-%d %H:%M") if hasattr(p, 'joined_at') and p.joined_at else None,
                    score=p.score,
                    correct_answers=f"{correct_ans}/{total_ans}",
                    accuracy=acc,
                    rank=rank_map.get(p.id, 0)
                ))
        elif session_type.upper() == "EXAM":
            query = db.query(ExamAssignee, User.fullname).outerjoin(User, ExamAssignee.user_id == User.id).filter(ExamAssignee.exam_id == session_id)
            total = query.count()
            # Get all for ranking
            all_assignees = query.order_by(desc(ExamAssignee.score)).all()
            
            # Build rank map
            rank_map = {}
            for idx, (a, _) in enumerate(all_assignees):
                rank_map[a.id] = idx + 1
            
            # Paginate
            paginated = all_assignees[skip:skip + limit]
            
            for a, fullname in paginated:
                u_name = fullname if fullname else "Anonymous"
                
                # Calculate correct/total answers
                total_ans = db.query(func.count(ExamAnswer.id)).filter(
                    ExamAnswer.assignee_id == a.id
                ).scalar() or 0
                correct_ans = db.query(func.count(ExamAnswer.id)).filter(
                    ExamAnswer.assignee_id == a.id,
                    ExamAnswer.is_correct == True
                ).scalar() or 0
                
                acc = f"{(correct_ans / total_ans * 100):.1f}%" if total_ans > 0 else "0%"
                
                results.append(ReportParticipant(
                    id=f"EA-{a.id}",
                    user_id=str(a.user_id) if hasattr(a, 'user_id') and a.user_id else None,
                    nickname=u_name,
                    status=a.status or "Completed",
                    joined_at=a.started_at.strftime("%Y-%m-%d %H:%M") if hasattr(a, 'started_at') and a.started_at else None,
                    score=a.score or 0,
                    correct_answers=f"{correct_ans}/{total_ans}",
                    accuracy=acc,
                    rank=rank_map.get(a.id, 0)
                ))
                
        return ReportParticipantPageResponse(
            data=results,
            total=total,
            pageIndex=(skip // limit) + 1 if limit > 0 else 1,
            pageSize=limit
        )

    def get_report_questions(self, db: Session, session_id: int, session_type: str, skip: int = 0, limit: int = 50) -> ReportQuestionPageResponse:
        results = []
        total = 0
        if session_type.upper() == "ROOM":
            room = db.query(Room).filter(Room.id == session_id).first()
            if room:
                query = db.query(
                    Question.id,
                    Question.content,
                    Question.difficulty,
                    func.count(ParticipantAnswer.id).label("total_ans"),
                    func.sum(case((ParticipantAnswer.is_correct == True, 1), else_=0)).label("correct_ans")
                ).outerjoin(
                    ParticipantAnswer,
                    (ParticipantAnswer.question_id == Question.id) &
                    (ParticipantAnswer.participant_id.in_(
                        db.query(Participant.id).filter(Participant.room_id == session_id)
                    ))
                ).filter(
                    Question.quiz_id == room.quiz_id
                ).group_by(Question.id)
                
                total = db.query(func.count(Question.id)).filter(Question.quiz_id == room.quiz_id).scalar() or 0
                stats = query.offset(skip).limit(limit).all()
                
                for row in stats:
                    q_id, q_content, q_diff, t_ans, c_ans = row
                    t_ans = t_ans or 0
                    c_ans = c_ans or 0
                    i_ans = t_ans - c_ans
                    acc = round((c_ans / t_ans * 100), 2) if t_ans > 0 else 0.0
                    
                    results.append(ReportQuestionAnalysis(
                        id=q_id,
                        question=q_content or "No content",
                        correct=int(c_ans),
                        incorrect=int(i_ans),
                        rate=float(acc),
                        difficulty=q_diff or "Medium"
                    ))
                    
        elif session_type.upper() == "EXAM":
            exam = db.query(Exam).filter(Exam.id == session_id).first()
            if exam:
                query = db.query(
                    Question.id,
                    Question.content,
                    Question.difficulty,
                    func.count(ExamAnswer.id).label("total_ans"),
                    func.sum(case((ExamAnswer.is_correct == True, 1), else_=0)).label("correct_ans")
                ).outerjoin(
                    ExamAnswer,
                    (ExamAnswer.question_id == Question.id) &
                    (ExamAnswer.assignee_id.in_(
                        db.query(ExamAssignee.id).filter(ExamAssignee.exam_id == session_id)
                    ))
                ).filter(
                    Question.quiz_id == exam.quiz_id
                ).group_by(Question.id)
                
                total = db.query(func.count(Question.id)).filter(Question.quiz_id == exam.quiz_id).scalar() or 0
                stats = query.offset(skip).limit(limit).all()
                
                for row in stats:
                    q_id, q_content, q_diff, t_ans, c_ans = row
                    t_ans = t_ans or 0
                    c_ans = c_ans or 0
                    i_ans = t_ans - c_ans
                    acc = round((c_ans / t_ans * 100), 2) if t_ans > 0 else 0.0
                    
                    results.append(ReportQuestionAnalysis(
                        id=q_id,
                        question=q_content or "No content",
                        correct=int(c_ans),
                        incorrect=int(i_ans),
                        rate=float(acc),
                        difficulty=q_diff or "Medium"
                    ))
                    
        return ReportQuestionPageResponse(
            data=results,
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
        p_writer.writerow(["Rank", "Participant Name", "Score", "Correct Answers", "Accuracy (%)", "Joined At", "Status"])

        # Generate questions CSV
        questions_output = io.StringIO()
        q_writer = csv.writer(questions_output)
        q_writer.writerow(["Question ID", "Question Content", "Total Answers", "Correct", "Incorrect", "Accuracy (%)"])

        if session_type.upper() == "ROOM":
            # 1. Participants data
            participants = db.query(Participant).filter(Participant.room_id == session_id).order_by(desc(Participant.score)).all()
            for rank, p in enumerate(participants, 1):
                total_ans = db.query(func.count(ParticipantAnswer.id)).filter(
                    ParticipantAnswer.participant_id == p.id
                ).scalar() or 0
                correct_ans = db.query(func.count(ParticipantAnswer.id)).filter(
                    ParticipantAnswer.participant_id == p.id,
                    ParticipantAnswer.is_correct == True
                ).scalar() or 0
                acc = f"{(correct_ans / total_ans * 100):.1f}%" if total_ans > 0 else "0%"
                joined = p.joined_at.strftime("%Y-%m-%d %H:%M") if hasattr(p, 'joined_at') and p.joined_at else "N/A"
                
                p_writer.writerow([
                    rank,
                    p.nickname or "Anonymous", 
                    p.score,
                    f"\t{correct_ans}/{total_ans}",
                    acc,
                    joined,
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
            assignees = db.query(ExamAssignee).filter(ExamAssignee.exam_id == session_id).order_by(desc(ExamAssignee.score)).all()
            for rank, a in enumerate(assignees, 1):
                user = db.query(User).filter(User.id == a.user_id).first()
                u_name = user.fullname if user else "Anonymous"
                
                total_ans = db.query(func.count(ExamAnswer.id)).filter(
                    ExamAnswer.assignee_id == a.id
                ).scalar() or 0
                correct_ans = db.query(func.count(ExamAnswer.id)).filter(
                    ExamAnswer.assignee_id == a.id,
                    ExamAnswer.is_correct == True
                ).scalar() or 0
                acc = f"{(correct_ans / total_ans * 100):.1f}%" if total_ans > 0 else "0%"
                joined = a.started_at.strftime("%Y-%m-%d %H:%M") if hasattr(a, 'started_at') and a.started_at else "N/A"
                
                p_writer.writerow([
                    rank,
                    u_name,
                    a.score,
                    f"\t{correct_ans}/{total_ans}",
                    acc,
                    joined,
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
            zf.writestr("participants.csv", participants_output.getvalue().encode('utf-8-sig'))
            zf.writestr("questions_accuracy.csv", questions_output.getvalue().encode('utf-8-sig'))
            
        return zip_buffer.getvalue()

crud_report = CRUDReport()