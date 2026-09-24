from fastapi import APIRouter, Request
from datetime import datetime

router = APIRouter(prefix="/api/logs", tags=["logs"])

@router.post("/client-error")
async def log_client_error(data: dict, request: Request):
    # Visible dans Vercel → Deployments → Functions → Runtime Logs
    print("=" * 80)
    print(f"[CLIENT_ERROR] {datetime.utcnow().isoformat()}")
    print(f"IP: {request.client.host if request.client else 'unknown'}")
    print(f"URL: {data.get('url')}")
    print(f"Message: {data.get('message')}")
    print(f"Component Stack: {data.get('component_stack', '')[:500]}")
    print(f"User Agent: {data.get('user_agent', '')[:200]}")
    print("=" * 80)
    return {"ok": True}
