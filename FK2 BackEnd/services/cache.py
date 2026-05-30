"""
TTL-based cache manager for AI Insight Engine.

Priority:
  1. Redis (if REDIS_URL is configured)
  2. In-memory dict with asyncio.Lock (always available)

Cache is keyed on SHA-256 of the serialised input payload,
so the AI is only re-invoked when the underlying data changes.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
from typing import Any, Optional

log = logging.getLogger(__name__)


# ── In-Memory Backend ──────────────────────────────────────────────────────────

class _MemoryStore:
    """Thread-safe, async-compatible TTL dict."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[Any, float]] = {}  # key -> (value, expiry_ts)
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expiry = entry
            if time.monotonic() > expiry:
                del self._store[key]
                return None
            return value

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        async with self._lock:
            self._store[key] = (value, time.monotonic() + ttl_seconds)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)

    async def flush_pattern(self, prefix: str) -> int:
        """Delete all keys that start with *prefix*. Returns count deleted."""
        async with self._lock:
            to_delete = [k for k in self._store if k.startswith(prefix)]
            for k in to_delete:
                del self._store[k]
            return len(to_delete)

    async def size(self) -> int:
        async with self._lock:
            now = time.monotonic()
            # Prune expired entries while we're here
            expired = [k for k, (_, exp) in self._store.items() if now > exp]
            for k in expired:
                del self._store[k]
            return len(self._store)


# ── Redis Backend (optional) ───────────────────────────────────────────────────

class _RedisStore:
    def __init__(self, redis_url: str) -> None:
        import redis.asyncio as aioredis  # type: ignore[import-not-found]
        self._client = aioredis.from_url(redis_url, decode_responses=True)

    async def get(self, key: str) -> Optional[Any]:
        raw = await self._client.get(key)
        if raw is None:
            return None
        return json.loads(raw)

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        await self._client.setex(key, ttl_seconds, json.dumps(value, ensure_ascii=False))

    async def delete(self, key: str) -> None:
        await self._client.delete(key)

    async def flush_pattern(self, prefix: str) -> int:
        keys = await self._client.keys(f"{prefix}*")
        if keys:
            await self._client.delete(*keys)
        return len(keys)

    async def size(self) -> int:
        return await self._client.dbsize()


# ── Public CacheManager ────────────────────────────────────────────────────────

class CacheManager:
    """
    Single global cache instance.  Call `init()` once at application startup.
    """

    _backend: _MemoryStore | _RedisStore | None = None
    _ttl: int = 3600  # default: 1 hour

    @classmethod
    def init(cls, redis_url: Optional[str] = None, ttl_seconds: int = 3600) -> None:
        cls._ttl = ttl_seconds
        if redis_url:
            try:
                cls._backend = _RedisStore(redis_url)
                log.info("CacheManager: using Redis backend at %s", redis_url)
            except Exception as exc:
                log.warning("CacheManager: Redis init failed (%s), falling back to memory.", exc)
                cls._backend = _MemoryStore()
        else:
            cls._backend = _MemoryStore()
            log.info("CacheManager: using in-memory backend (TTL=%ds)", ttl_seconds)

    @classmethod
    def _store(cls) -> _MemoryStore | _RedisStore:
        if cls._backend is None:
            cls._backend = _MemoryStore()
        return cls._backend

    @classmethod
    def make_key(cls, namespace: str, payload: dict) -> str:
        """Deterministic SHA-256 key from a JSON-serialisable payload."""
        canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str)
        digest = hashlib.sha256(canonical.encode()).hexdigest()[:16]
        return f"{namespace}:{digest}"

    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        try:
            return await cls._store().get(key)
        except Exception as exc:
            log.error("Cache GET error: %s", exc)
            return None

    @classmethod
    async def set(cls, key: str, value: Any, ttl: Optional[int] = None) -> None:
        try:
            await cls._store().set(key, value, ttl or cls._ttl)
        except Exception as exc:
            log.error("Cache SET error: %s", exc)

    @classmethod
    async def delete(cls, key: str) -> None:
        try:
            await cls._store().delete(key)
        except Exception as exc:
            log.error("Cache DELETE error: %s", exc)

    @classmethod
    async def invalidate_insights(cls, mall_id: str) -> int:
        """
        Invalidate all cached insights for a specific mall.
        Called automatically after a new file is uploaded.
        """
        prefix = f"insight:{mall_id}"
        try:
            count = await cls._store().flush_pattern(prefix)
            log.info("Cache invalidated %d insight entries for mall %s", count, mall_id)
            return count
        except Exception as exc:
            log.error("Cache flush error: %s", exc)
            return 0

    @classmethod
    async def stats(cls) -> dict:
        try:
            size = await cls._store().size()
            backend = "redis" if isinstance(cls._backend, _RedisStore) else "memory"
            return {"backend": backend, "entries": size, "default_ttl_seconds": cls._ttl}
        except Exception:
            return {"backend": "unknown", "entries": -1}
