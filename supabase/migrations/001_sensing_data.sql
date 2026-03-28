-- SenseAir: Core sensing data tables

-- Devices (edge agents)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT UNIQUE NOT NULL DEFAULT 'default',
    name TEXT DEFAULT 'ESP32-S3',
    location TEXT,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sensing readings (time-series)
CREATE TABLE IF NOT EXISTS readings (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL DEFAULT 'default',
    presence TEXT NOT NULL DEFAULT 'UNKNOWN',
    presence_variance REAL DEFAULT 0,
    presence_confidence INT DEFAULT 0,
    activity TEXT DEFAULT 'UNKNOWN',
    activity_confidence INT DEFAULT 0,
    breathing_bpm REAL DEFAULT 0,
    breathing_confidence INT DEFAULT 0,
    rssi INT DEFAULT 0,
    packet_rate REAL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_readings_device_time
    ON readings (device_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_readings_timestamp
    ON readings (timestamp DESC);

-- Activity sessions (aggregated)
CREATE TABLE IF NOT EXISTS activity_sessions (
    id BIGSERIAL PRIMARY KEY,
    device_id TEXT NOT NULL DEFAULT 'default',
    activity TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_seconds INT,
    avg_confidence INT DEFAULT 0
);

-- Row-level security (enable later with Supabase Auth)
-- ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;
