"""
Redis Room Service
High-concurrency Redis caching & in-memory store for live quiz sessions.
Buffers player answers, calculates dynamic scores & streak multipliers in RAM (<1ms latency),
and flushes batches to PostgreSQL on demand or upon room completion.
"""

import json
import logging
import time
from typing import Any, Dict, List, Optional, Tuple

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
        score: int,
        correct_option_key: Optional[str],
    ) -> Tuple[int, Dict[str, Any]]:
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

                return int(total_score), answer_data
        except Exception as e:
            logger.warning(f"Redis submit_answer failed, reverting to in-memory fallback: {e}")

        # In-memory fallback if Redis is unavailable
        if room_code not in _in_memory_rooms:
            _in_memory_rooms[room_code] = {"answers": {}, "scores": {}, "dist": {}}

        rdata = _in_memory_rooms[room_code]
        if ans_key not in rdata["answers"]:
            rdata["answers"][ans_key] = {}
        rdata["answers"][ans_key][str(participant_id)] = answer_data

        curr_score = rdata["scores"].get(str(participant_id), 0) + score
        rdata["scores"][str(participant_id)] = curr_score

        return curr_score, answer_data

    @classmethod
    async def get_redis_leaderboard(cls, room_code: str) -> Dict[int, int]:
        """Fetch real-time scores for all room participants from Redis Sorted Set."""
        leaderboard_key = f"room:{room_code}:leaderboard"
        scores_map: Dict[int, int] = {}

        try:
            if cls._is_redis_active():
                # Get all items with scores from sorted set (highest to lowest)
                results = await redis_client.zrevrange(leaderboard_key, 0, -1, withscores=True)
                for pid_str, score_val in results:
                    scores_map[int(pid_str)] = int(score_val)
                return scores_map
        except Exception as e:
            logger.warning(f"Failed to fetch Redis leaderboard for room {room_code}: {e}")

        # Fallback to local memory
        rdata = _in_memory_rooms.get(room_code, {}).get("scores", {})
        for pid_str, score_val in rdata.items():
            scores_map[int(pid_str)] = int(score_val)

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


redis_room_service = RedisRoomService()
