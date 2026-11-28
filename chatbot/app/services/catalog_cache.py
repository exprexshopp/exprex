"""Cache mémoire court pour les snapshots catalogue (évite un SELECT JSON à chaque message)."""

from __future__ import annotations

import time
from typing import Dict, List, Optional, Tuple

from app.config import settings

# scope -> (expires_at_monotonic, products)
_cache: Dict[str, Tuple[float, List[dict]]] = {}


def get(scope: str) -> Optional[List[dict]]:
    ttl = settings.CATALOG_CACHE_TTL
    if ttl <= 0:
        return None
    entry = _cache.get(scope)
    if not entry:
        return None
    expires, products = entry
    if time.monotonic() > expires:
        _cache.pop(scope, None)
        return None
    return products


def set(scope: str, products: List[dict]) -> None:
    ttl = settings.CATALOG_CACHE_TTL
    if ttl <= 0:
        return
    _cache[scope] = (time.monotonic() + ttl, products)


def invalidate(scope: Optional[str] = None) -> None:
    if scope is None:
        _cache.clear()
    else:
        _cache.pop(scope, None)
