import { create } from 'zustand'

export interface SensingState {
  presence: string
  presence_confidence: number
  activity: string
  activity_confidence: number
  breathing_bpm: number
  breathing_confidence: number
  rssi: number
  packet_rate: number
  subcarriers: number[]
  smoothed_activity: string
  smoothed_presence: string
  connected: boolean
  duration?: string
  motion_intensity?: string
}

interface SensingStore extends SensingState {
  update: (data: Partial<SensingState>) => void
  setConnected: (v: boolean) => void
}

export const useSensing = create<SensingStore>((set) => ({
  presence: 'UNKNOWN',
  presence_confidence: 0,
  activity: 'UNKNOWN',
  activity_confidence: 0,
  breathing_bpm: 0,
  breathing_confidence: 0,
  rssi: 0,
  packet_rate: 0,
  subcarriers: [],
  smoothed_activity: 'UNKNOWN',
  smoothed_presence: 'UNKNOWN',
  connected: false,
  update: (data) => set((s) => ({ ...s, ...data })),
  setConnected: (connected) => set({ connected }),
}))
