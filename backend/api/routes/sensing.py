"""Sensing data ingestion from edge agents."""

import asyncio
import time
from datetime import datetime

from fastapi import APIRouter, Request

from api.models.schemas import SensingPush, SensingResponse, SystemInfo

router = APIRouter()


@router.post("/sensing/push", response_model=SensingResponse)
async def push_sensing_data(data: SensingPush, request: Request):
    """Receive sensing data from edge agent and broadcast to clients."""
    state_dict = data.model_dump()
    state_dict["timestamp"] = data.timestamp.isoformat()
    state_dict["type"] = "update"

    # Update shared state
    request.app.state.latest.update(state_dict)
    request.app.state.last_push_time = time.time()

    # Add to history
    request.app.state.history.append({
        "time": data.timestamp.strftime("%H:%M:%S"),
        "presence": data.presence,
        "activity": data.activity,
        "confidence": data.activity_confidence,
        "bpm": data.breathing_bpm,
        "rssi": data.rssi,
        "variance": data.presence_variance,
    })

    # Broadcast to WebSocket clients
    from api.main import broadcast_to_clients
    asyncio.create_task(broadcast_to_clients(state_dict))

    return SensingResponse(received_at=datetime.utcnow())


@router.get("/sensing/current")
async def get_current_state(request: Request):
    """Get the latest sensing state."""
    if request.app.state.latest:
        return request.app.state.latest
    return {"status": "no_data", "message": "No edge agent connected yet"}


@router.get("/system-info", response_model=SystemInfo)
async def system_info():
    return SystemInfo()
