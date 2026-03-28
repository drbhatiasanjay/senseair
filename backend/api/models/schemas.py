"""Pydantic schemas for SenseAir cloud API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class SensingPush(BaseModel):
    """Data pushed from edge agent to cloud."""
    presence: str = Field(default="UNKNOWN", description="EMPTY|PRESENT|MOTION|CALIBRATING|UNKNOWN")
    presence_variance: float = 0
    presence_confidence: int = 0
    activity: str = Field(default="UNKNOWN")
    activity_confidence: int = 0
    breathing_bpm: float = 0
    breathing_confidence: int = 0
    rssi: int = 0
    packet_rate: float = 0
    packet_count: int = 0
    subcarriers: list[float] = Field(default_factory=list)
    smoothed_activity: str = "UNKNOWN"
    smoothed_presence: str = "UNKNOWN"
    gesture: Optional[str] = None
    motion_intensity: Optional[str] = None
    duration: Optional[str] = None
    duration_seconds: Optional[float] = None
    session_total: Optional[str] = None
    today_profile: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    device_id: str = Field(default="default", description="Edge device identifier")


class SensingResponse(BaseModel):
    status: str = "ok"
    received_at: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    app: str = "SenseAir"
    uptime_seconds: float = 0
    edge_connected: bool = False
    last_push: Optional[datetime] = None


class HistoryEntry(BaseModel):
    time: str
    presence: str
    activity: str
    confidence: int
    bpm: float
    rssi: int
    variance: float


class SystemInfo(BaseModel):
    esp_board: str = "ESP32-S3-WROOM-1"
    esp_chip: str = "ESP32-S3 (QFN56) rev v0.2"
    esp_features: str = "WiFi, BLE, 8MB PSRAM"
    wifi_ssid: str = "Manzil1102"
    wifi_band: str = "2.4 GHz"
    wifi_channel: int = 2
    subcarriers: int = 64
    ml_model: str = "Random Forest"
    ml_accuracy: str = "85%"
    ml_classes: int = 6
