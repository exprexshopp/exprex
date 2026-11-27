import secrets
import uuid


def new_id(prefix: str = "") -> str:
    """ID court unique (style Exprex : string primary key)."""
    raw = uuid.uuid4().hex[:16]
    return f"{prefix}{raw}" if prefix else raw


def new_token(n: int = 32) -> str:
    return secrets.token_urlsafe(n)
