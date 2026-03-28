interface SubcarrierChartProps {
  subcarriers: number[]
  presence: string
}

function getBarColor(presence: string) {
  switch (presence) {
    case 'MOTION': return '#f87171'
    case 'PRESENT': return '#34d399'
    default: return '#63b3ed'
  }
}

export function SubcarrierChart({ subcarriers, presence }: SubcarrierChartProps) {
  if (!subcarriers.length) return null

  const max = Math.max(...subcarriers, 1)
  const color = getBarColor(presence)

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Subcarrier Amplitudes
      </div>
      <div className="flex items-end gap-px" style={{ height: 80 }}>
        {subcarriers.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${(val / max) * 100}%`,
              background: color,
              opacity: 0.7,
              minWidth: 1,
              transition: 'height 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  )
}
