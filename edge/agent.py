"""SenseAir Edge Agent — Reads ESP32 CSI and pushes to cloud API.

Runs locally on the machine connected to ESP32-S3 via USB serial.
Performs ML inference locally, then POSTs results to the cloud API.

Usage:
    python edge/agent.py
    python edge/agent.py --api-url https://senseair-api.onrender.com
    python edge/agent.py --model models/activity_random_forest.pkl
"""

import argparse
import json
import os
import pickle
import sys
import time
import warnings
from collections import deque
from datetime import datetime, timezone

import numpy as np
import requests
import serial

warnings.filterwarnings('ignore', category=RuntimeWarning)

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from detect_port import get_port, get_baud
from analysis.feature_extraction import extract_features_from_window
from analysis.phase_sanitizer import unwrap_and_detrend, bandpass_filter
from analysis.breathing_detector import estimate_breathing_rate

# Defaults
DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_MODEL = "models/activity_random_forest.pkl"
TARGET_SUBCARRIERS = 64
BUFFER_SIZE = 200
PUSH_INTERVAL = 0.5  # Push to cloud every 500ms


def normalize_subcarriers(arr, target=TARGET_SUBCARRIERS):
    n = len(arr)
    if n == target:
        return arr
    if n > target:
        indices = np.linspace(0, n - 1, target, dtype=int)
        return arr[indices]
    return np.pad(arr, (0, target - n), mode='constant')


def parse_csi_from_line(line):
    line = line.strip()
    if not line.startswith("CSI_DATA"):
        return None, None, None
    try:
        fields = line.split(',')
        rssi = float(fields[3])
        data_start = line.index('"[')
        data_str = line[data_start:].strip('"')
        raw = json.loads(data_str)
        n = len(raw) // 2
        csi = np.array([complex(raw[2 * i + 1], raw[2 * i]) for i in range(n)])
        amp = normalize_subcarriers(np.abs(csi))
        phase = normalize_subcarriers(np.angle(csi))
        return amp, phase, rssi
    except (ValueError, IndexError, json.JSONDecodeError):
        return None, None, None


class EdgeAgent:
    def __init__(self, api_url: str, model_path: str, device_id: str = "default", api_key: str = "senseair-edge-2026"):
        self.api_url = api_url.rstrip('/')
        self.device_id = device_id
        self.api_key = api_key
        self.model_data = None

        # Buffers
        self.amp_buffer = deque(maxlen=BUFFER_SIZE)
        self.phase_buffer = deque(maxlen=BUFFER_SIZE)
        self.rssi_buffer = deque(maxlen=BUFFER_SIZE)
        self.timestamp_buffer = deque(maxlen=BUFFER_SIZE)
        self.activity_history = deque(maxlen=5)
        self.presence_history = deque(maxlen=5)

        # State
        self.baseline_var = None
        self.packet_count = 0
        self.packet_rate = 0

        # Load ML model
        if model_path and os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                self.model_data = pickle.load(f)
            print(f"  Model loaded: {model_path}")
            print(f"  Classes: {self.model_data['classes']}")
        else:
            print(f"  No model at {model_path} — activity classification disabled")

    def detect_presence(self):
        if len(self.amp_buffer) < 5:
            return 'UNKNOWN', 0
        buf = np.array(list(self.amp_buffer))
        var_per_sub = np.var(buf, axis=0)
        current_var = float(np.mean(var_per_sub))
        if self.baseline_var is None or self.baseline_var < 0.01:
            return 'CALIBRATING', current_var
        ratio = current_var / self.baseline_var
        if ratio > 9.0:
            return 'MOTION', current_var
        elif ratio > 3.0:
            return 'PRESENT', current_var
        else:
            return 'EMPTY', current_var

    def classify_activity(self):
        if self.model_data is None or len(self.amp_buffer) < 10:
            return 'N/A', 0
        amp_win = np.array(list(self.amp_buffer))[-10:]
        phase_win = np.array(list(self.phase_buffer))[-10:]
        rssi_win = np.array(list(self.rssi_buffer))[-10:]
        features = extract_features_from_window(amp_win, phase_win, rssi_win)
        features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)
        if features.shape[0] != self.model_data['feature_count']:
            return 'MISMATCH', 0
        features_scaled = self.model_data['scaler'].transform(features.reshape(1, -1))
        prediction = self.model_data['model'].predict(features_scaled)[0]
        label = self.model_data['label_encoder'].inverse_transform([prediction])[0]
        confidence = 0
        if hasattr(self.model_data['model'], 'predict_proba'):
            proba = self.model_data['model'].predict_proba(features_scaled)[0]
            confidence = float(proba[prediction])
        return label.upper(), round(confidence * 100)

    def detect_breathing(self, presence):
        if presence in ('EMPTY', 'UNKNOWN', 'CALIBRATING'):
            return 0, 0
        if len(self.phase_buffer) < 20:
            return 0, 0
        recent_phases = np.array(list(self.phase_buffer))
        recent_ts = np.array(list(self.timestamp_buffer))
        cutoff = time.time() - 45
        mask = recent_ts >= cutoff
        if np.sum(mask) < 15:
            return 0, 0
        phases = recent_phases[mask]
        ts = recent_ts[mask]
        dt = np.diff(ts)
        sample_rate = 1.0 / np.median(dt) if len(dt) > 0 and np.median(dt) > 0 else 1.0
        phase_clean = unwrap_and_detrend(phases)
        phase_filtered = bandpass_filter(phase_clean, 0.1, 0.5, sample_rate)
        variances = np.var(phase_filtered, axis=0)
        variances[0] = 0
        n_best = min(10, len(variances))
        best_idx = np.argsort(variances)[-n_best:][::-1]
        best_scores = variances[best_idx]
        if np.max(best_scores) < 0.001:
            return 0, 0
        weights = best_scores / (np.sum(best_scores) + 1e-10)
        combined = np.average(phase_filtered[:, best_idx], axis=1, weights=weights)
        br = estimate_breathing_rate(combined, sample_rate)
        if br['bpm'] and 6 <= br['bpm'] <= 30 and br['confidence'] > 0.15:
            return br['bpm'], round(br['confidence'] * 100)
        return 0, 0

    def push_to_cloud(self, data: dict):
        try:
            resp = requests.post(
                f"{self.api_url}/api/sensing/push",
                json=data,
                headers={"X-API-Key": self.api_key},
                timeout=5,
            )
            if resp.status_code != 200:
                print(f"  Push failed: {resp.status_code}")
        except requests.RequestException as e:
            print(f"  Push error: {e}")

    def run(self):
        port = get_port()
        if not port:
            print("  ERROR: No ESP32 found. Check USB connection.")
            return
        baud = get_baud()
        print(f"  Connecting to {port} at {baud} baud...")

        try:
            ser = serial.Serial(port, baud, timeout=1)
        except serial.SerialException as e:
            print(f"  Serial error: {e}")
            return

        print(f"  Edge agent running — pushing to {self.api_url}")
        print("  Press Ctrl+C to stop\n")

        calibration_packets = []
        calibration_done = False
        CALIBRATE_PACKETS = 15
        rate_count = 0
        last_rate_check = time.time()
        last_push = 0

        while True:
            try:
                raw = ser.readline()
                if not raw:
                    continue

                line = raw.decode('utf-8', errors='ignore').strip()
                amp, phase, rssi = parse_csi_from_line(line)
                if amp is None:
                    continue

                self.packet_count += 1
                rate_count += 1
                now = time.time()

                self.amp_buffer.append(amp)
                self.phase_buffer.append(phase)
                self.rssi_buffer.append(rssi)
                self.timestamp_buffer.append(now)

                # Packet rate
                if now - last_rate_check >= 2:
                    self.packet_rate = round(rate_count / (now - last_rate_check), 1)
                    rate_count = 0
                    last_rate_check = now

                # Calibration
                if not calibration_done:
                    calibration_packets.append(amp)
                    if len(calibration_packets) >= CALIBRATE_PACKETS:
                        cal_array = np.array(calibration_packets)
                        self.baseline_var = float(np.mean(np.var(cal_array, axis=0)))
                        calibration_done = True
                        print(f"  Calibration done. Baseline: {self.baseline_var:.4f}")
                    continue

                # Push to cloud at PUSH_INTERVAL
                if now - last_push < PUSH_INTERVAL:
                    continue
                last_push = now

                # Detect everything
                presence, variance = self.detect_presence()
                activity, act_conf = self.classify_activity()

                real_activities = ('SITTING', 'STANDING', 'WALKING', 'WAVING')
                if activity in real_activities:
                    presence = 'PRESENT'

                bpm, br_conf = self.detect_breathing(presence)

                # Smoothing
                self.activity_history.append(activity)
                self.presence_history.append(presence)
                smoothed_activity = max(set(self.activity_history), key=list(self.activity_history).count)
                smoothed_presence = max(set(self.presence_history), key=list(self.presence_history).count)

                # Presence confidence
                baseline = self.baseline_var
                ratio = (variance / baseline) if baseline and baseline > 0.01 else 0
                presence_conf = min(ratio / 10 * 100, 100) if ratio > 0 else 0

                payload = {
                    "presence": presence,
                    "presence_variance": round(variance, 2),
                    "presence_confidence": round(presence_conf),
                    "activity": activity,
                    "activity_confidence": act_conf,
                    "breathing_bpm": bpm,
                    "breathing_confidence": br_conf,
                    "rssi": int(rssi),
                    "packet_rate": self.packet_rate,
                    "packet_count": self.packet_count,
                    "subcarriers": amp.tolist()[:64],
                    "smoothed_activity": smoothed_activity,
                    "smoothed_presence": smoothed_presence,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "device_id": self.device_id,
                }

                # Console output
                status_line = (
                    f"  [{datetime.now().strftime('%H:%M:%S')}] "
                    f"{smoothed_presence:>10} | {smoothed_activity:>10} ({act_conf}%) | "
                    f"BPM: {bpm:>5.1f} | RSSI: {int(rssi)} | {self.packet_rate} pkt/s"
                )
                print(status_line, end='\r')

                # Push to cloud
                self.push_to_cloud(payload)

            except serial.SerialException:
                print("\n  Serial disconnected. Reconnecting in 5s...")
                time.sleep(5)
                break
            except KeyboardInterrupt:
                print("\n  Edge agent stopped.")
                return


def main():
    parser = argparse.ArgumentParser(description="SenseAir Edge Agent")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="Cloud API URL")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="ML model path")
    parser.add_argument("--device-id", default="default", help="Device identifier")
    args = parser.parse_args()

    print("=" * 50)
    print("  SenseAir Edge Agent")
    print("=" * 50)
    print(f"  API: {args.api_url}")
    print(f"  Model: {args.model}")
    print(f"  Device: {args.device_id}")
    print()

    agent = EdgeAgent(args.api_url, args.model, args.device_id)
    agent.run()


if __name__ == "__main__":
    main()
