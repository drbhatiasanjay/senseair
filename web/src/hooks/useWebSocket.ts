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

export function useWebSocket() {
  const [state, setState] = useState<SensingState>(INITIAL_STATE)
  const [wsConnected, setWsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8000`
    const ws = new WebSocket(`${wsUrl}/ws/live`)

    ws.onopen = () => {
      setWsConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'ping') return
      setState((prev) => ({ ...prev, ...data, connected: true }))
    }

    ws.onclose = () => {
      setWsConnected(false)
      setState((prev) => ({ ...prev, connected: false }))
      // Reconnect after 3s
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    wsRef.current = ws
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { state, wsConnected }
}
