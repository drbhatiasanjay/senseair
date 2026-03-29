"""Simple email-based authentication with JWT tokens."""

import hashlib
import hmac
import json
import os
import time
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

router = APIRouter()

# Allowed emails
ALLOWED_EMAILS = {
    "gargangel2233@gmail.com",
    "asifsayed245@gmail.com",
}

# Secret for signing tokens (use env var in production)
JWT_SECRET = os.environ.get("JWT_SECRET", "senseair-secret-key-change-in-prod")
TOKEN_EXPIRY = 7 * 24 * 3600  # 7 days


class LoginRequest(BaseModel):
    email: EmailStr


class LoginVerify(BaseModel):
    email: EmailStr
    code: str


class TokenResponse(BaseModel):
    token: str
    email: str
    expires_at: str


# In-memory OTP store (email -> {code, expires})
_otps: dict[str, dict] = {}


def _make_token(email: str) -> str:
    """Create a simple signed token."""
    payload = {
        "email": email,
        "exp": int(time.time()) + TOKEN_EXPIRY,
        "iat": int(time.time()),
    }
    payload_b64 = json.dumps(payload, separators=(",", ":"))
    sig = hmac.new(JWT_SECRET.encode(), payload_b64.encode(), hashlib.sha256).hexdigest()[:32]
    return f"{payload_b64}.{sig}"


def verify_token(token: str) -> str | None:
    """Verify token and return email, or None if invalid."""
    try:
        parts = token.rsplit(".", 1)
        if len(parts) != 2:
            return None
        payload_str, sig = parts
        expected_sig = hmac.new(JWT_SECRET.encode(), payload_str.encode(), hashlib.sha256).hexdigest()[:32]
        if not hmac.compare_digest(sig, expected_sig):
            return None
        payload = json.loads(payload_str)
        if payload.get("exp", 0) < time.time():
            return None
        return payload.get("email")
    except Exception:
        return None


def _generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(int.from_bytes(os.urandom(3), "big") % 1000000).zfill(6)


@router.post("/auth/login")
async def login(req: LoginRequest):
    """Request login — generates OTP for allowed emails."""
    email = req.email.lower().strip()
    if email not in ALLOWED_EMAILS:
        raise HTTPException(status_code=403, detail="Email not authorized")

    code = _generate_otp()
    _otps[email] = {"code": code, "expires": time.time() + 600}  # 10 min

    # In production, send this via email (SendGrid, etc.)
    # For now, return it directly (dev mode)
    return {
        "status": "otp_sent",
        "message": f"OTP sent to {email}",
        "dev_code": code,  # Remove in production!
    }


@router.post("/auth/verify", response_model=TokenResponse)
async def verify(req: LoginVerify):
    """Verify OTP and return auth token."""
    email = req.email.lower().strip()
    if email not in ALLOWED_EMAILS:
        raise HTTPException(status_code=403, detail="Email not authorized")

    otp_data = _otps.get(email)
    if not otp_data:
        raise HTTPException(status_code=400, detail="No OTP requested. Call /auth/login first.")

    if time.time() > otp_data["expires"]:
        del _otps[email]
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    if otp_data["code"] != req.code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    # OTP valid — issue token
    del _otps[email]
    token = _make_token(email)
    exp = datetime.fromtimestamp(time.time() + TOKEN_EXPIRY, tz=timezone.utc)

    return TokenResponse(token=token, email=email, expires_at=exp.isoformat())


@router.get("/auth/me")
async def me(request: Request):
    """Check current auth status from Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    email = verify_token(auth[7:])
    if not email:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"email": email, "authenticated": True}
