import { useCallback, useEffect, useRef, useState } from 'react'

export interface SensingState {
  presence: string
  presence_variance: number
  presence_confidence: number
  activity: string
  activity_confidence: number
  breathing_bpm: number
  breathing_confidence: number
  rssi: number
  packet_rate: number
  packet_count: number
  subcarriers: number[]
  smoothed_activity: string
  smoothed_presence: string
  gesture?: string
  motion_intensity?: string
  duration?: string
  duration_seconds?: number
  session_total?: string
  today_profile?: Record<string, number>
  timestamp: string
  connected: boolean
}

const INITIAL_STATE: SensingState = {
  presence: 'UNKNOWN',
  presence_variance: 0,
  presence_confidence: 0,
  activity: 'UNKNOWN',
  activity_confidence: 0,
  breathing_bpm: 0,
  breathing_confidence: 0,
  rssi: 0,
  packet_rate: 0,
  packet_count: 0,
  subcarriers: [],
  smoothed_activity: 'UNKNOWN',
  smoothed_presence: 'UNKNOWN',
  timestamp: '',
  connected: false,
}

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`

export function useWebSocket(token?: string) {
  const [state, setState] = useState<SensingState>(INITIAL_STATE)
  const [wsConnected, setWsConnected] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Try WebSocket first (for local dev), fall back to HTTP polling (for Vercel)
  const connectWs = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000`
    try {
      const ws = new WebSocket(`${wsUrl}/ws/live`)

      ws.onopen = () => {
        setWsConnected(true)
        // Stop polling if WS connects
        if (intervalRef.current) clearInterval(intervalRef.current)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'ping') return
        setState((prev) => ({ ...prev, ...data, connected: true }))
      }

      ws.onclose = () => {
        setWsConnected(false)
        setState((prev) => ({ ...prev, connected: false }))
        // Fall back to polling
        startPolling()
      }

      ws.onerror = () => {
        ws.close()
      }

      wsRef.current = ws
    } catch {
      // WebSocket not available, use polling
      startPolling()
    }
  }, [])

  const poll = useCallback(async () => {
    try {
      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const resp = await fetch(`${API_URL}/api/sensing/current`, { headers })
      if (resp.ok) {
        const data = await resp.json()
        if (data.status !== 'no_data') {
          setState((prev) => ({ ...prev, ...data, connected: true }))
          setWsConnected(true)
        }
      }
    } catch {
      setWsConnected(false)
    }
  }, [])

  const startPolling = useCallback(() => {
    if (intervalRef.current) return
    poll()
    intervalRef.current = setInterval(poll, 1000)
  }, [poll])

  useEffect(() => {
    // Try WebSocket first
    connectWs()
    // Also start polling as fallback after 3s if WS doesn't connect
    reconnectRef.current = setTimeout(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        startPolling()
      }
    }, 3000)

    return () => {
      clearTimeout(reconnectRef.current)
      clearInterval(intervalRef.current)
      wsRef.current?.close()
    }
  }, [connectWs, startPolling])

  return { state, wsConnected }
}
