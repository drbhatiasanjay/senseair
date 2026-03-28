"""SenseAir Cloud API — FastAPI backend with WebSocket support.

Receives sensing data from edge agents, stores history,
and broadcasts real-time updates to web/mobile clients.
"""

import asyncio
import os
import time
from collections import deque
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from api.models.schemas import (
    HealthResponse,
    SensingPush,
    SensingResponse,
    SystemInfo,
)
from api.routes import health, history, sensing

START_TIME = time.time()

# In-memory state (replaced by Supabase later)
latest_state: dict = {}
state_history: deque = deque(maxlen=500)
connected_clients: set[WebSocket] = set()
last_push_time: float | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("  SenseAir API starting...")
    yield
    print("  SenseAir API shutting down...")


app = FastAPI(
    title="SenseAir API",
    description="WiFi CSI Sensing — Cloud Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store shared state on app for access from routes
app.state.latest = latest_state
app.state.history = state_history
app.state.clients = connected_clients
app.state.start_time = START_TIME
app.state.last_push_time = None

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(sensing.router, prefix="/api", tags=["sensing"])
app.include_router(history.router, prefix="/api", tags=["history"])


@app.websocket("/ws/live")
async def websocket_live(ws: WebSocket):
    """Real-time WebSocket stream for dashboard clients."""
    await ws.accept()
    connected_clients.add(ws)
    try:
        # Send current state immediately
        if latest_state:
            await ws.send_json(latest_state)
        # Keep alive — wait for disconnect
        while True:
            # Heartbeat every 30s to keep connection alive
            try:
                await asyncio.wait_for(ws.receive_text(), timeout=30)
            except asyncio.TimeoutError:
                await ws.send_json({"type": "ping"})
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(ws)


async def broadcast_to_clients(data: dict):
    """Send data to all connected WebSocket clients."""
    dead = set()
    for ws in connected_clients.copy():
        try:
            await ws.send_json(data)
        except Exception:
            dead.add(ws)
    for ws in dead:
        connected_clients.discard(ws)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True)
