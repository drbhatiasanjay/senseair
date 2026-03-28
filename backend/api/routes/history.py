"""Historical data endpoints."""

from fastapi import APIRouter, Query, Request

router = APIRouter()


@router.get("/history")
async def get_history(
    request: Request,
    limit: int = Query(default=100, le=500),
):
    """Get recent sensing history entries."""
    entries = list(request.app.state.history)
    return {"entries": entries[-limit:], "total": len(entries)}
