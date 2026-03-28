import { useState } from 'react'
import { useWebSocket } from './hooks/useWebSocket'
import { Avatar } from './components/Avatar'
import { StatusCard } from './components/StatusCard'
import { SubcarrierChart } from './components/SubcarrierChart'

type Tab = 'visual' | 'data' | 'room'

function presenceColor(p: string) {
  switch (p) {
    case 'MOTION': return '#f87171'
    case 'PRESENT': return '#34d399'
    case 'EMPTY': return '#64748b'
    case 'CALIBRATING': return '#fbbf24'
    default: return '#94a3b8'
  }
}

export default function App() {
  const { state, wsConnected } = useWebSocket()
  const [tab, setTab] = useState<Tab>('visual')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'visual', label: 'Visual' },
    { id: 'data', label: 'Data' },
    { id: 'room', label: 'Room' },
  ]

  return (
    <div className="min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
            SenseAir
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{
            background: wsConnected ? '#34d39922' : '#f8717122',
            color: wsConnected ? '#34d399' : '#f87171',
          }}>
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Tabs */}
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.id ? 'var(--accent-glow)' : 'transparent',
                color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: tab === t.id ? '1px solid var(--border-hover)' : '1px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto p-6">
        {tab === 'visual' && (
          <div className="grid gap-5" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
            {/* Avatar Panel */}
            <div
              className="rounded-2xl flex flex-col items-center justify-center p-8"
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border)',
                minHeight: 480,
              }}
            >
              <Avatar
                presence={state.smoothed_presence || state.presence}
                activity={state.smoothed_activity || state.activity}
                breathingBpm={state.breathing_bpm}
              />
              <div className="mt-4 text-center">
                <div className="text-lg font-semibold" style={{ color: presenceColor(state.smoothed_presence || state.presence) }}>
                  {state.smoothed_presence || state.presence}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {state.smoothed_activity || state.activity}
                  {state.activity_confidence > 0 && ` (${state.activity_confidence}%)`}
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', alignContent: 'start' }}>
              <StatusCard
                label="Presence"
                value={state.smoothed_presence || state.presence}
                subValue={`Confidence: ${state.presence_confidence}%`}
                color={presenceColor(state.smoothed_presence || state.presence)}
              />
              <StatusCard
                label="Activity"
                value={state.smoothed_activity || state.activity}
                subValue={`${state.activity_confidence}% confidence`}
                color="#a78bfa"
              />
              <StatusCard
                label="Breathing"
                value={state.breathing_bpm > 0 ? `${state.breathing_bpm.toFixed(1)} BPM` : '--'}
                subValue={state.breathing_confidence > 0 ? `${state.breathing_confidence}% confidence` : 'No signal'}
                color="#63b3ed"
              />
              <StatusCard
                label="Signal"
                value={`${state.rssi} dBm`}
                subValue={`${state.packet_rate} pkt/s`}
                color={state.rssi > -50 ? '#34d399' : state.rssi > -70 ? '#fbbf24' : '#f87171'}
              />
              <div className="col-span-2">
                <SubcarrierChart
                  subcarriers={state.subcarriers}
                  presence={state.smoothed_presence || state.presence}
                />
              </div>
              {state.duration && (
                <StatusCard
                  label="Duration"
                  value={state.duration}
                  subValue={state.session_total ? `Session: ${state.session_total}` : undefined}
                  color="#fbbf24"
                />
              )}
            </div>
          </div>
        )}

        {tab === 'data' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <StatusCard label="Packets" value={state.packet_count} subValue={`${state.packet_rate} pkt/s`} />
            <StatusCard label="RSSI" value={`${state.rssi} dBm`} color={state.rssi > -50 ? '#34d399' : '#fbbf24'} />
            <StatusCard label="Variance" value={state.presence_variance.toFixed(2)} />
            <StatusCard label="Presence" value={state.presence} color={presenceColor(state.presence)} />
            <StatusCard label="Activity" value={state.activity} subValue={`${state.activity_confidence}%`} color="#a78bfa" />
            <StatusCard label="Breathing" value={state.breathing_bpm > 0 ? `${state.breathing_bpm.toFixed(1)} BPM` : '--'} color="#63b3ed" />
            <div className="col-span-3">
              <SubcarrierChart subcarriers={state.subcarriers} presence={state.presence} />
            </div>
          </div>
        )}

        {tab === 'room' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div
              className="rounded-2xl p-8 flex flex-col items-center justify-center"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                minHeight: 300,
              }}
            >
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mb-4"
                style={{
                  background: `${presenceColor(state.smoothed_presence)}22`,
                  color: presenceColor(state.smoothed_presence),
                  border: `3px solid ${presenceColor(state.smoothed_presence)}`,
                  boxShadow: `0 0 40px ${presenceColor(state.smoothed_presence)}33`,
                }}
              >
                {state.smoothed_presence === 'EMPTY' ? '0' : state.smoothed_presence === 'MOTION' ? '!' : '1'}
              </div>
              <div className="text-lg font-semibold" style={{ color: presenceColor(state.smoothed_presence) }}>
                {state.smoothed_presence}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Variance: {state.presence_variance.toFixed(2)}
              </div>
            </div>
            <div className="grid gap-4" style={{ alignContent: 'start' }}>
              <StatusCard
                label="Occupancy"
                value={state.smoothed_presence === 'EMPTY' ? 'Unoccupied' : 'Occupied'}
                color={presenceColor(state.smoothed_presence)}
              />
              <StatusCard label="Motion Level" value={state.motion_intensity || 'N/A'} />
              <StatusCard
                label="Activity"
                value={state.smoothed_activity || 'N/A'}
                subValue={state.duration}
                color="#a78bfa"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
