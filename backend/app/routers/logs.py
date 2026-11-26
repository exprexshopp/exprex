import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/logs", tags=["logs"])
server_logger = logging.getLogger("express.client")

SENSITIVE_KEYS = re.compile(r"password|secret|token|authorization|cookie", re.I)


def redact(value: object) -> object:
    if isinstance(value, dict):
        return {
            key: "[REDACTED]" if SENSITIVE_KEYS.search(str(key)) else redact(nested)
            for key, nested in value.items()
        }
    if isinstance(value, list):
        return [redact(item) for item in value[:50]]
    if isinstance(value, str):
        return re.sub(
            r"(password|secret|token|authorization)\s*[=:]\s*[\"']?[^\s,\"']+",
            r"\1=[REDACTED]",
            value,
            flags=re.I,
        )[:2000]
    return value


@router.post("/client-error")
async def log_client_error(data: dict, request: Request):
    safe = redact(data)
    level = safe.get("level") if isinstance(safe, dict) else "error"
    message = str(safe.get("message", "Browser error") if isinstance(safe, dict) else "Browser error")[:500]

    log_message = (
        "[CLIENT_LOG] %s | ip=%s | level=%s | url=%s | ua=%s | message=%s | details=%s | component_stack=%s"
        % (
            datetime.now(timezone.utc).isoformat(),
            request.client.host if request.client else "unknown",
            level,
            str(safe.get("url", ""))[:300] if isinstance(safe, dict) else "",
            str(safe.get("user_agent", ""))[:200] if isinstance(safe, dict) else "",
            message,
            str(safe.get("details", ""))[:2000] if isinstance(safe, dict) else "",
            str(safe.get("component_stack", ""))[:500] if isinstance(safe, dict) else "",
        )
    )

    if level == "warn":
        server_logger.warning(log_message)
    elif level == "info":
        server_logger.info(log_message)
    else:
        server_logger.error(log_message)

    return {"ok": True}
