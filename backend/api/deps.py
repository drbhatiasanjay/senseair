"""Shared dependencies for route auth checks."""

import os

from fastapi import HTTPException, Request

from api.routes.auth import verify_token

# API key for edge agent (no login needed)
EDGE_API_KEY = os.environ.get("EDGE_API_KEY", "senseair-edge-2026")


def require_auth(request: Request) -> str:
    """Verify Bearer token from dashboard/mobile clients. Returns email."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    email = verify_token(auth[7:])
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return email


def require_edge_key(request: Request) -> None:
    """Verify API key from edge agent."""
    key = request.headers.get("X-API-Key", "")
    if key != EDGE_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid edge API key")
