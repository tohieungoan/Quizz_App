import logging
from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize redis connection pool with low timeout for local fallback speed
redis_client = aioredis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=0.5,  # 0.5s connection timeout
    socket_timeout=0.5,          # 0.5s command timeout
    retry_on_timeout=False
)

# In-memory fallback dictionary if Redis server is offline
_in_memory_cache = {}
# Flag to keep track of Redis availability and avoid repeated connection timeouts
_redis_available = True

async def set_token(key: str, value: str, expire_seconds: int) -> bool:
    """
    Store a key-value pair in Redis with an expiration time (TTL).
    Falls back to in-memory dictionary if Redis is unavailable.
    """
    global _redis_available
    if _redis_available:
        try:
            await redis_client.set(key, value, ex=expire_seconds)
            return True
        except Exception as e:
            _redis_available = False  # Mark as offline to bypass future timeouts
            logger.warning(f"Redis went offline, falling back to In-Memory storage. (Key: {key}). Error: {str(e)}")
    
    import time
    _in_memory_cache[key] = {
        "value": value,
        "expires_at": time.time() + expire_seconds
    }
    return True

async def get_token(key: str) -> Optional[str]:
    """
    Retrieve a value by key from Redis.
    Falls back to in-memory dictionary if Redis is unavailable.
    """
    global _redis_available
    if _redis_available:
        try:
            val = await redis_client.get(key)
            if isinstance(val, bytes):
                return val.decode("utf-8")
            return val
        except Exception as e:
            _redis_available = False
            logger.warning(f"Redis went offline, reading from In-Memory storage. (Key: {key}). Error: {str(e)}")
    
    import time
    item = _in_memory_cache.get(key)
    if item:
        if time.time() < item["expires_at"]:
            return item["value"]
        else:
            del _in_memory_cache[key]
    return None

async def delete_token(key: str) -> bool:
    """
    Delete a key from Redis.
    Falls back to in-memory dictionary if Redis is unavailable.
    """
    global _redis_available
    if _redis_available:
        try:
            result = await redis_client.delete(key)
            return result > 0
        except Exception as e:
            _redis_available = False
            logger.warning(f"Redis went offline, deleting from In-Memory storage. (Key: {key}). Error: {str(e)}")
    
    if key in _in_memory_cache:
        del _in_memory_cache[key]
        return True
    return False
