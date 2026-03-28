"""Health check endpoint."""

import time

from fastapi import APIRouter, Request

from api.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        app="SenseAir",
        uptime_seconds=round(time.time() - request.app.state.start_time, 1),
        edge_connected=request.app.state.last_push_time is not None
        and (time.time() - request.app.state.last_push_time) < 10,
        last_push=request.app.state.last_push_time,
    )
