interface StatusCardProps {
  label: string
  value: string | number
  subValue?: string
  color?: string
}

export function StatusCard({ label, value, subValue, color = '#63b3ed' }: StatusCardProps) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      {subValue && (
        <div className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {subValue}
        </div>
      )}
    </div>
  )
}
