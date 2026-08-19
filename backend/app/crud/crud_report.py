from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, case, literal
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
        normalized_type = report_type.upper()
        search_term = f"%{search.strip()}%"

        # Aggregate child tables once and join the summaries into their parent
        # sessions. This avoids running three extra queries for every report.
        room_participant_counts = (
            db.query(
                Participant.room_id.label("room_id"),
                func.count(Participant.id).label("participant_count"),
            )
            .group_by(Participant.room_id)
            .subquery()
        )
        room_answer_stats = (
            db.query(
                Participant.room_id.label("room_id"),
                func.count(ParticipantAnswer.id).label("total_answers"),
                func.sum(
                    case((ParticipantAnswer.is_correct.is_(True), 1), else_=0)
                ).label("correct_answers"),
            )
            .outerjoin(
                ParticipantAnswer,
                ParticipantAnswer.participant_id == Participant.id,
            )
            .group_by(Participant.room_id)
            .subquery()
        )
        exam_assignee_counts = (
            db.query(
                ExamAssignee.exam_id.label("exam_id"),
                func.count(ExamAssignee.id).label("participant_count"),
            )
            .group_by(ExamAssignee.exam_id)
            .subquery()
        )
        exam_answer_stats = (
            db.query(
                ExamAssignee.exam_id.label("exam_id"),
                func.count(ExamAnswer.id).label("total_answers"),
                func.sum(
                    case((ExamAnswer.is_correct.is_(True), 1), else_=0)
                ).label("correct_answers"),
            )
            .outerjoin(
                ExamAnswer,
                ExamAnswer.exam_assignee_id == ExamAssignee.id,
            )
            .group_by(ExamAssignee.exam_id)
            .subquery()
        )

        report_queries = []

        if normalized_type in ["ALL", "ROOM"]:
            room_query = (
                db.query(
                    Room.id.label("id"),
                    literal("ROOM").label("type"),
                    func.coalesce(Room.room_code, "").label("room_code"),
                    func.coalesce(Quiz.title, "").label("quiz_title"),
                    func.coalesce(Room.title, Room.room_code, "").label("room_title"),
                    func.coalesce(User.fullname, "").label("host"),
                    func.coalesce(Room.ended_at, Room.created_at).label("event_date"),
                    func.coalesce(room_participant_counts.c.participant_count, 0).label("participants"),
                    func.coalesce(room_answer_stats.c.total_answers, 0).label("total_answers"),
                    func.coalesce(room_answer_stats.c.correct_answers, 0).label("correct_answers"),
                )
                .join(Quiz, Room.quiz_id == Quiz.id)
                .join(User, Room.host_id == User.id)
                .outerjoin(
                    room_participant_counts,
                    room_participant_counts.c.room_id == Room.id,
                )
                .outerjoin(
                    room_answer_stats,
                    room_answer_stats.c.room_id == Room.id,
                )
                .filter(Room.status == "ENDED")
            )
            if search.strip():
                room_query = room_query.filter(
                    or_(
                        Quiz.title.ilike(search_term),
                        Room.title.ilike(search_term),
                        Room.room_code.ilike(search_term),
                        User.fullname.ilike(search_term),
                    )
                )
            report_queries.append(room_query)

        if normalized_type in ["ALL", "EXAM"]:
            exam_query = (
                db.query(
                    Exam.id.label("id"),
                    literal("EXAM").label("type"),
                    literal("").label("room_code"),
                    func.coalesce(Quiz.title, "").label("quiz_title"),
                    func.coalesce(Exam.title, "").label("room_title"),
                    func.coalesce(User.fullname, "").label("host"),
                    func.coalesce(Exam.end_time, Exam.created_at).label("event_date"),
                    func.coalesce(exam_assignee_counts.c.participant_count, 0).label("participants"),
                    func.coalesce(exam_answer_stats.c.total_answers, 0).label("total_answers"),
                    func.coalesce(exam_answer_stats.c.correct_answers, 0).label("correct_answers"),
                )
                .join(Quiz, Exam.quiz_id == Quiz.id)
                .join(User, Exam.host_id == User.id)
                .outerjoin(
                    exam_assignee_counts,
                    exam_assignee_counts.c.exam_id == Exam.id,
                )
                .outerjoin(
                    exam_answer_stats,
                    exam_answer_stats.c.exam_id == Exam.id,
                )
                .filter(Exam.status.in_(["ACTIVE", "ENDED", "FINISHED", "COMPLETED"]))
            )
            if search.strip():
                exam_query = exam_query.filter(
                    or_(
                        Quiz.title.ilike(search_term),
                        Exam.title.ilike(search_term),
                        User.fullname.ilike(search_term),
                    )
                )
            report_queries.append(exam_query)

        if not report_queries:
            return ReportPageResponse(
                data=[],
                total=0,
                pageIndex=(skip // limit) + 1 if limit > 0 else 1,
                pageSize=limit,
            )

        combined_query = report_queries[0]
        if len(report_queries) > 1:
            combined_query = combined_query.union_all(*report_queries[1:])
        combined_reports = combined_query.subquery()

        # Count and paginate in SQL. Only the requested rows are materialized.
        total = db.query(func.count()).select_from(combined_reports).scalar() or 0
        rows = (
            db.query(combined_reports)
            .order_by(
                combined_reports.c.event_date.desc(),
                combined_reports.c.type.asc(),
                combined_reports.c.id.desc(),
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

        paginated_reports = []
        for row in rows:
            total_answers = int(row.total_answers or 0)
            correct_answers = int(row.correct_answers or 0)
            avg_score = (
                f"{(correct_answers / total_answers * 100):.1f}%"
                if total_answers > 0
                else "0.0%"
            )
            event_date = row.event_date.strftime("%Y-%m-%d %H:%M") if row.event_date else ""
            room_code = row.room_code or (f"EX-{row.id}" if row.type == "EXAM" else "")
            room_title = row.room_title or (f"Exam {row.id}" if row.type == "EXAM" else room_code)

            paginated_reports.append(
                ReportListItem(
                    id=row.id,
                    type=row.type,
                    room_code=room_code,
                    quiz_title=row.quiz_title or "",
                    room_title=room_title,
                    host=row.host or "",
                    date=event_date,
                    participants=int(row.participants or 0),
                    avg_score=avg_score,
                )
            )

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
