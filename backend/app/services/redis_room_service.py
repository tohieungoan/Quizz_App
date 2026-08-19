"""
Redis Room Service
High-concurrency Redis caching & in-memory store for live quiz sessions.
Buffers player answers, calculates dynamic scores & streak multipliers in RAM (<1ms latency),
and flushes batches to PostgreSQL on demand or upon room completion.
"""

import json
import logging
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from app.core.redis import redis_client, _redis_available
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

# Fallback in-memory store if Redis server is unreachable
_in_memory_rooms: Dict[str, Dict[str, Any]] = {}


class RedisRoomService:
    """Service providing high-concurrency Redis Operations for Live Rooms."""

    @staticmethod
    def _is_redis_active() -> bool:
        """Check if Redis connection is currently healthy."""
        from app.core.redis import _redis_available
        return _redis_available

    @classmethod
    async def cache_active_question(cls, room_code: str, active_question: Optional[Dict[str, Any]]) -> None:
        """Cache the current active question details in Redis for fast validation."""
        if not active_question:
            return

        key = f"room:{room_code}:active_q"
        try:
            if cls._is_redis_active():
                await redis_client.set(key, json.dumps(active_question), ex=7200)
                return
        except Exception as e:
            logger.warning(f"Failed to cache active question in Redis: {e}")

        # Fallback to local dict
        if room_code not in _in_memory_rooms:
            _in_memory_rooms[room_code] = {}
        _in_memory_rooms[room_code]["active_q"] = active_question

    @classmethod
    async def submit_answer_redis(
        cls,
        room_code: str,
        participant_id: int,
        question_id: int,
        selected_option_id: Optional[int],
        answer_text: Optional[str],
        is_correct: bool,
        score: float,
        correct_option_key: Optional[str],
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Record a participant's answer in Redis memory (< 1ms).
        Updates answer hash, leaderboard sorted set, and option distribution counters.
        Returns total accumulated score and answer payload.
        """
        answer_data = {
            "participant_id": participant_id,
            "question_id": question_id,
            "selected_option_id": selected_option_id,
            "answer_text": answer_text,
            "is_correct": is_correct,
            "score": score,
            "submitted_at": time.time(),
        }

        ans_key = f"room:{room_code}:q:{question_id}:answers"
        leaderboard_key = f"room:{room_code}:leaderboard"
        dist_key = f"room:{room_code}:q:{question_id}:dist"

        try:
            if cls._is_redis_active():
                # 1. Save answer record in hash
                await redis_client.hset(ans_key, str(participant_id), json.dumps(answer_data))
                await redis_client.expire(ans_key, 7200)

                # 2. Increment participant score in Redis Sorted Set
                total_score = await redis_client.zincrby(leaderboard_key, score, str(participant_id))
                await redis_client.expire(leaderboard_key, 7200)

                # 3. Update distribution counter
                if selected_option_id:
                    opt_key = f"opt:{selected_option_id}"
                    await redis_client.hincrby(dist_key, opt_key, 1)
                    await redis_client.expire(dist_key, 7200)
                elif answer_text:
                    clean_text = answer_text.strip().lower()
                    await redis_client.hincrby(dist_key, clean_text, 1)
                    await redis_client.expire(dist_key, 7200)

                return float(total_score or 0.0), answer_data
        except Exception as e:
            logger.warning(f"Redis submit_answer failed, reverting to in-memory fallback: {e}")

        # In-memory fallback if Redis is unavailable
        if room_code not in _in_memory_rooms:
            _in_memory_rooms[room_code] = {"answers": {}, "scores": {}, "dist": {}}

        rdata = _in_memory_rooms[room_code]
        if ans_key not in rdata["answers"]:
            rdata["answers"][ans_key] = {}
        rdata["answers"][ans_key][str(participant_id)] = answer_data

        curr_score = rdata["scores"].get(str(participant_id), 0.0) + score
        rdata["scores"][str(participant_id)] = curr_score

        return float(curr_score), answer_data

    @classmethod
    async def get_redis_leaderboard(cls, room_code: str) -> Dict[int, float]:
        """Fetch real-time scores for all room participants from Redis Sorted Set."""
        leaderboard_key = f"room:{room_code}:leaderboard"
        scores_map: Dict[int, float] = {}

        try:
            if cls._is_redis_active():
                # Get all items with scores from sorted set (highest to lowest)
                results = await redis_client.zrevrange(leaderboard_key, 0, -1, withscores=True)
                for pid_str, score_val in results:
                    scores_map[int(pid_str)] = float(score_val)
                return scores_map
        except Exception as e:
            logger.warning(f"Failed to fetch Redis leaderboard for room {room_code}: {e}")

        # Fallback to local memory
        rdata = _in_memory_rooms.get(room_code, {}).get("scores", {})
        for pid_str, score_val in rdata.items():
            scores_map[int(pid_str)] = float(score_val)

        return scores_map

    @classmethod
    async def flush_room_answers_to_db(cls, room_code: str, room_id: int) -> int:
        """
        Batch flush all cached Redis answers into PostgreSQL database table (`ParticipantAnswer`).
        Called on `next-question` or when room status changes to `ENDED`.
        """
        flushed_count = 0
        from app.models.room import Participant, ParticipantAnswer, Room
        from app.crud.crud_room import crud_room

        db = SessionLocal()
        try:
            # 1. Update participant scores from Redis Sorted Set
            redis_scores = await cls.get_redis_leaderboard(room_code)
            if redis_scores:
                for pid, total_score in redis_scores.items():
                    participant = db.query(Participant).filter(Participant.id == pid).first()
                    if participant:
                        participant.score = total_score
                        db.add(participant)
                db.commit()

            # 2. Flush raw answer records from Redis hashes
            pattern = f"room:{room_code}:q:*:answers"
            answer_keys: List[str] = []

            try:
                if cls._is_redis_active():
                    async for k in redis_client.scan_iter(match=pattern):
                        answer_keys.append(k)
            except Exception:
                pass

            for k in answer_keys:
                try:
                    hash_entries = await redis_client.hgetall(k)
                    for pid_str, json_str in hash_entries.items():
                        adata = json.loads(json_str)
                        pid = adata["participant_id"]
                        qid = adata["question_id"]

                        # Check if already exists in DB to prevent duplicates
                        existing = db.query(ParticipantAnswer).filter(
                            ParticipantAnswer.participant_id == pid,
                            ParticipantAnswer.question_id == qid
                        ).first()

                        if not existing:
                            new_ans = ParticipantAnswer(
                                participant_id=pid,
                                question_id=qid,
                                selected_option_id=adata.get("selected_option_id"),
                                answer_text=adata.get("answer_text"),
                                is_correct=adata.get("is_correct", False),
                                score=adata.get("score", 0),
                            )
                            db.add(new_ans)
                            flushed_count += 1
                except Exception as ex:
                    logger.warning(f"Error parsing answer key {k}: {ex}")

            db.commit()
            logger.info(f"Flushed {flushed_count} cached answers to PostgreSQL for room '{room_code}'")
            return flushed_count
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to batch flush Redis answers for room '{room_code}': {e}")
            return 0
        finally:
            db.close()

    @classmethod
    async def vote_question_redis(cls, room_code: str, question_id: int, voter_id: Union[int, str]) -> int:
        """
        Record a vote for a question in Redis RAM store (<1ms latency).
        Increments the vote count in Redis Sorted Set `room:{room_code}:q_votes`.
        """
        key = f"room:{room_code}:q_votes"
        voters_key = f"room:{room_code}:q:{question_id}:voters"
        try:
            if cls._is_redis_active():
                # Check if participant/voter already voted for this question
                already_voted = await redis_client.sismember(voters_key, str(voter_id))
                if not already_voted:
                    await redis_client.sadd(voters_key, str(voter_id))
                    await redis_client.expire(voters_key, 7200)
                    new_votes = await redis_client.zincrby(key, 1, str(question_id))
                    await redis_client.expire(key, 7200)
                    return int(new_votes) if new_votes is not None else 1
                else:
                    curr_votes = await redis_client.zscore(key, str(question_id))
                    return int(curr_votes) if curr_votes else 1
        except Exception as e:
            logger.warning(f"Redis vote_question failed, falling back to in-memory: {e}")

        # Fallback to local memory
        if room_code not in _in_memory_rooms:
            _in_memory_rooms[room_code] = {}
        if "votes" not in _in_memory_rooms[room_code]:
            _in_memory_rooms[room_code]["votes"] = {}
        
        curr = _in_memory_rooms[room_code]["votes"].get(question_id, 0) + 1
        _in_memory_rooms[room_code]["votes"][question_id] = curr
        return curr

    @classmethod
    async def get_top_voted_questions(cls, room_code: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch top-voted questions ordered by vote counts from Redis RAM enriched with question text."""
        key = f"room:{room_code}:q_votes"
        raw_items: List[Tuple[str, float]] = []
        try:
            if cls._is_redis_active():
                res = await redis_client.zrevrange(key, 0, -1, withscores=True)
                if res and isinstance(res, list):
                    raw_items = [
                        (
                            item[0].decode("utf-8") if isinstance(item[0], bytes) else str(item[0]),
                            float(item[1]),
                        )
                        for item in res
                        if isinstance(item, (tuple, list)) and len(item) == 2
                    ]
        except Exception as e:
            logger.warning(f"Failed to fetch Redis top voted questions: {e}")

        if not raw_items:
            rdata = _in_memory_rooms.get(room_code, {}).get("votes", {})
            sorted_votes = sorted(rdata.items(), key=lambda x: x[1], reverse=True)
            raw_items = [(str(qid), float(count)) for qid, count in sorted_votes]

        from starlette.concurrency import run_in_threadpool
        def _get_q_texts():
            with SessionLocal() as db_session:
                from app.models.room import Room
                from app.models.quiz import Question
                res = []
                voted_dict = {int(qid_str): int(v_cnt) for qid_str, v_cnt in raw_items}

                KEYS = ["A", "B", "C", "D"]
                r_obj = db_session.query(Room).filter(Room.room_code == room_code).first()
                if r_obj and r_obj.quiz and r_obj.quiz.questions:
                    all_qs = sorted(r_obj.quiz.questions, key=lambda q: q.id)
                    for q in all_qs:
                        v_cnt = voted_dict.get(q.id, 0)
                        sorted_opts = sorted(q.options, key=lambda o: o.id) if q.options else []
                        opts_list = [
                            {
                                "id": opt.id,
                                "key": KEYS[idx] if idx < len(KEYS) else "A",
                                "label": opt.content or "",
                                "is_correct": opt.is_correct
                            }
                            for idx, opt in enumerate(sorted_opts)
                        ]
                        res.append({
                            "question_id": q.id,
                            "text": q.content or f"Question #{q.id}",
                            "vote_count": v_cnt,
                            "audio_url": q.audio_url,
                            "media_url": q.media_url,
                            "options": opts_list
                        })
                    res.sort(key=lambda x: (-x["vote_count"], x["question_id"]))
                    return res[:limit]

                for qid_str, vote_count in raw_items:
                    qid = int(qid_str)
                    q_obj = db_session.query(Question).filter(Question.id == qid).first()
                    q_text = q_obj.content if q_obj and q_obj.content else f"Question #{qid}"
                    sorted_opts = sorted(q_obj.options, key=lambda o: o.id) if q_obj and q_obj.options else []
                    opts_list = [
                        {
                            "id": opt.id,
                            "key": KEYS[idx] if idx < len(KEYS) else "A",
                            "label": opt.content or "",
                            "is_correct": opt.is_correct
                        }
                        for idx, opt in enumerate(sorted_opts)
                    ]
                    res.append({
                        "question_id": qid,
                        "text": q_text,
                        "vote_count": int(vote_count),
                        "audio_url": q_obj.audio_url if q_obj else None,
                        "media_url": q_obj.media_url if q_obj else None,
                        "options": opts_list
                    })
                return res

        return await run_in_threadpool(_get_q_texts)

    @classmethod
    async def set_qa_session_state(cls, room_code: str, is_active: bool, current_question_id: Optional[int] = None) -> None:
        """Cache Q&A session state in Redis RAM."""
        key = f"room:{room_code}:qa_state"
        state_data = {
            "is_active": is_active,
            "current_question_id": current_question_id,
            "updated_at": time.time()
        }
        try:
            if cls._is_redis_active():
                await redis_client.set(key, json.dumps(state_data), ex=7200)
                return
        except Exception as e:
            logger.warning(f"Failed to cache QA state in Redis: {e}")

        if room_code not in _in_memory_rooms:
            _in_memory_rooms[room_code] = {}
        _in_memory_rooms[room_code]["qa_state"] = state_data

    @classmethod
    async def get_qa_session_state(cls, room_code: str) -> Dict[str, Any]:
        """Fetch cached Q&A session state from Redis RAM."""
        key = f"room:{room_code}:qa_state"
        try:
            if cls._is_redis_active():
                raw = await redis_client.get(key)
                if raw:
                    return json.loads(raw)
        except Exception as e:
            logger.warning(f"Failed to get QA state from Redis: {e}")

        return _in_memory_rooms.get(room_code, {}).get("qa_state", {"is_active": False, "current_question_id": None})

    @classmethod
    async def add_chat_message(cls, room_code: str, sender: str, text: str, avatar: Optional[str] = None, timestamp: Optional[str] = None, msg_id: Optional[str] = None) -> Dict[str, Any]:
        """Save a live Q&A chat message into Redis RAM."""
        unique_id = msg_id or f"msg_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
        msg_obj = {
            "id": unique_id,
            "sender": sender,
            "text": text,
            "message": text,
            "avatar": avatar,
            "timestamp": timestamp or time.strftime("%H:%M")
        }
        key = f"room:{room_code}:chat_messages"
        try:
            if cls._is_redis_active():
                await redis_client.rpush(key, json.dumps(msg_obj))
                await redis_client.expire(key, 7200)
                return msg_obj
        except Exception as e:
            logger.warning(f"Failed to push chat message to Redis: {e}")

        if room_code not in _in_memory_rooms:
            _in_memory_rooms[room_code] = {}
        if "chat_messages" not in _in_memory_rooms[room_code]:
            _in_memory_rooms[room_code]["chat_messages"] = []
        _in_memory_rooms[room_code]["chat_messages"].append(msg_obj)
        return msg_obj

    @classmethod
    async def get_chat_messages(cls, room_code: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch saved live Q&A chat messages from Redis RAM."""
        key = f"room:{room_code}:chat_messages"
        try:
            if cls._is_redis_active():
                raw_list = await redis_client.lrange(key, 0, -1)
                if raw_list:
                    return [json.loads(item) for item in raw_list[:limit]]
        except Exception as e:
            logger.warning(f"Failed to fetch chat messages from Redis: {e}")

        return _in_memory_rooms.get(room_code, {}).get("chat_messages", [])[:limit]


redis_room_service = RedisRoomService()

