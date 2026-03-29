"""Historical data endpoints."""

from fastapi import APIRouter, Depends, Query, Request

from api.deps import require_auth

router = APIRouter()


@router.get("/history")
async def get_history(
    request: Request,
    email: str = Depends(require_auth),
    limit: int = Query(default=100, le=500),
):
    """Get recent sensing history entries (requires login)."""
    entries = list(request.app.state.history)
    return {"entries": entries[-limit:], "total": len(entries)}
