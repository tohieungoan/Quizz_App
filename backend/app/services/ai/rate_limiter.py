"""Cost-control rate limiter for AI generation endpoints."""

from __future__ import annotations

import asyncio
import time

from app.core.config import settings
from app.core.redis import redis_client

_fallback_lock = asyncio.Lock()
_fallback_buckets: dict[str, tuple[int, float]] = {}


async def consume_ai_generation_quota(user_id: int) -> tuple[bool, int]:
    """Return (allowed, remaining) using an hourly user-scoped fixed window."""
    limit = max(1, settings.AI_GENERATION_LIMIT_PER_HOUR)
    window = int(time.time() // 3600)
    key = f"rate:ai-quiz:{user_id}:{window}"
    try:
        async with redis_client.pipeline(transaction=True) as pipeline:
            pipeline.incr(key)
            pipeline.expire(key, 3700)
            count, _ = await pipeline.execute()
    except Exception:
        now = time.time()
        async with _fallback_lock:
            count, expires_at = _fallback_buckets.get(key, (0, now + 3700))
            if expires_at <= now:
                count, expires_at = 0, now + 3700
            count += 1
            _fallback_buckets[key] = (count, expires_at)
    return count <= limit, max(0, limit - count)
