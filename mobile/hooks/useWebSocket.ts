import { useEffect, useRef } from 'react'
import { useSensing } from '../stores/useSensing'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = API_URL.replace(/^http/, 'ws')

export function useWebSocket() {
  const update = useSensing((s) => s.update)
  const setConnected = useSensing((s) => s.setConnected)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(`${WS_URL}/ws/live`)

      ws.onopen = () => setConnected(true)

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'ping') return
        update({ ...data, connected: true })
      }

      ws.onclose = () => {
        setConnected(false)
        reconnectRef.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws.close()
      wsRef.current = ws
    }

    connect()
    return () => {
      clearTimeout(reconnectRef.current)
      wsRef.current?.close()
    }
  }, [update, setConnected])
}
