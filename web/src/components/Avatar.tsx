/**
 * Animated stick figure avatar — ported from visual.html SVG.
 * Shows presence state via opacity/glow, activity via pose.
 */

interface AvatarProps {
  presence: string
  activity: string
  breathingBpm: number
}

const POSES: Record<string, Record<string, [number, number]>> = {
  STANDING: {
    head: [100, 30], neck: [100, 55],
    lShoulder: [70, 70], rShoulder: [130, 70],
    lElbow: [55, 110], rElbow: [145, 110],
    lWrist: [50, 150], rWrist: [150, 150],
    hip: [100, 150],
    lHip: [80, 155], rHip: [120, 155],
    lKnee: [75, 210], rKnee: [125, 210],
    lAnkle: [70, 270], rAnkle: [130, 270],
  },
  SITTING: {
    head: [100, 30], neck: [100, 55],
    lShoulder: [70, 70], rShoulder: [130, 70],
    lElbow: [55, 110], rElbow: [145, 110],
    lWrist: [45, 140], rWrist: [155, 140],
    hip: [100, 150],
    lHip: [80, 155], rHip: [120, 155],
    lKnee: [60, 180], rKnee: [140, 180],
    lAnkle: [55, 220], rAnkle: [145, 220],
  },
  WALKING: {
    head: [100, 30], neck: [100, 55],
    lShoulder: [70, 70], rShoulder: [130, 70],
    lElbow: [50, 105], rElbow: [150, 100],
    lWrist: [40, 135], rWrist: [155, 130],
    hip: [100, 150],
    lHip: [85, 155], rHip: [115, 155],
    lKnee: [65, 210], rKnee: [135, 200],
    lAnkle: [55, 270], rAnkle: [140, 260],
  },
  WAVING: {
    head: [100, 30], neck: [100, 55],
    lShoulder: [70, 70], rShoulder: [130, 70],
    lElbow: [55, 110], rElbow: [155, 40],
    lWrist: [50, 150], rWrist: [170, 15],
    hip: [100, 150],
    lHip: [80, 155], rHip: [120, 155],
    lKnee: [75, 210], rKnee: [125, 210],
    lAnkle: [70, 270], rAnkle: [130, 270],
  },
}

const BONES: [string, string][] = [
  ['head', 'neck'],
  ['neck', 'lShoulder'], ['neck', 'rShoulder'],
  ['lShoulder', 'lElbow'], ['rShoulder', 'rElbow'],
  ['lElbow', 'lWrist'], ['rElbow', 'rWrist'],
  ['neck', 'hip'],
  ['hip', 'lHip'], ['hip', 'rHip'],
  ['lHip', 'lKnee'], ['rHip', 'rKnee'],
  ['lKnee', 'lAnkle'], ['rKnee', 'rAnkle'],
]

function getPresenceColor(presence: string) {
  switch (presence) {
    case 'MOTION': return '#f87171'
    case 'PRESENT': return '#34d399'
    case 'EMPTY': return '#64748b'
    case 'CALIBRATING': return '#fbbf24'
    default: return '#94a3b8'
  }
}

export function Avatar({ presence, activity, breathingBpm }: AvatarProps) {
  const pose = POSES[activity] || POSES.STANDING
  const color = getPresenceColor(presence)
  const isEmpty = presence === 'EMPTY' || presence === 'UNKNOWN'
  const isMotion = presence === 'MOTION'

  const breathScale = breathingBpm > 0
    ? 1 + Math.sin(Date.now() / (60000 / breathingBpm) * Math.PI * 2) * 0.02
    : 1

  return (
    <div className="relative flex items-center justify-center" style={{ minHeight: 340 }}>
      {/* Glow behind avatar */}
      <div
        className="absolute rounded-full"
        style={{
          width: 200, height: 280,
          background: `radial-gradient(ellipse, ${color}22 0%, transparent 70%)`,
          top: '50%', left: '50%',
          transform: 'translate(-50%, -55%)',
          transition: 'all 0.6s ease',
        }}
      />
      <svg
        viewBox="0 0 200 300"
        width={180}
        height={300}
        style={{
          opacity: isEmpty ? 0.25 : 1,
          filter: isMotion ? `drop-shadow(0 0 16px ${color}88)` : 'none',
          transform: `scale(${breathScale})`,
          transition: 'opacity 0.6s ease, filter 0.3s ease',
        }}
      >
        {/* Bones */}
        {BONES.map(([a, b]) => {
          const pa = pose[a]
          const pb = pose[b]
          return (
            <line
              key={`${a}-${b}`}
              x1={pa[0]} y1={pa[1]}
              x2={pb[0]} y2={pb[1]}
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{ transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          )
        })}

        {/* Joints */}
        {Object.entries(pose).map(([name, [cx, cy]]) => (
          <circle
            key={name}
            cx={cx}
            cy={cy}
            r={name === 'head' ? 16 : 4}
            fill={name === 'head' ? 'none' : color}
            stroke={color}
            strokeWidth={name === 'head' ? 2.5 : 0}
            style={{ transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        ))}
      </svg>
    </div>
  )
}
