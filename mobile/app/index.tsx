import { View, Text, StyleSheet } from 'react-native'
import { useSensing } from '../stores/useSensing'
import { useWebSocket } from '../hooks/useWebSocket'
import Svg, { Circle, Line } from 'react-native-svg'

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

function presenceColor(p: string) {
  switch (p) {
    case 'MOTION': return '#f87171'
    case 'PRESENT': return '#34d399'
    case 'EMPTY': return '#64748b'
    case 'CALIBRATING': return '#fbbf24'
    default: return '#94a3b8'
  }
}

export default function LiveScreen() {
  useWebSocket()
  const state = useSensing()
  const presence = state.smoothed_presence || state.presence
  const activity = state.smoothed_activity || state.activity
  const color = presenceColor(presence)
  const pose = POSES[activity] || POSES.STANDING

  return (
    <View style={styles.container}>
      {/* Connection badge */}
      <View style={[styles.badge, { backgroundColor: state.connected ? '#34d39922' : '#f8717122' }]}>
        <Text style={{ color: state.connected ? '#34d399' : '#f87171', fontSize: 12, fontWeight: '600' }}>
          {state.connected ? 'LIVE' : 'OFFLINE'}
        </Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Svg width={180} height={280} viewBox="0 0 200 300">
          {BONES.map(([a, b]) => {
            const pa = pose[a]
            const pb = pose[b]
            return (
              <Line
                key={`${a}-${b}`}
                x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]}
                stroke={color} strokeWidth={2.5} strokeLinecap="round"
              />
            )
          })}
          {Object.entries(pose).map(([name, [cx, cy]]) => (
            <Circle
              key={name}
              cx={cx} cy={cy}
              r={name === 'head' ? 16 : 4}
              fill={name === 'head' ? 'none' : color}
              stroke={color}
              strokeWidth={name === 'head' ? 2.5 : 0}
            />
          ))}
        </Svg>
      </View>

      {/* Status */}
      <Text style={[styles.presenceLabel, { color }]}>{presence}</Text>
      <Text style={styles.activityLabel}>
        {activity} {state.activity_confidence > 0 && `(${state.activity_confidence}%)`}
      </Text>

      {/* Cards */}
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Breathing</Text>
          <Text style={[styles.cardValue, { color: '#63b3ed' }]}>
            {state.breathing_bpm > 0 ? `${state.breathing_bpm.toFixed(1)} BPM` : '--'}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Signal</Text>
          <Text style={[styles.cardValue, { color: state.rssi > -50 ? '#34d399' : '#fbbf24' }]}>
            {state.rssi} dBm
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Rate</Text>
          <Text style={styles.cardValue}>{state.packet_rate} pkt/s</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a13',
    alignItems: 'center',
    paddingTop: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },
  presenceLabel: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  activityLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 179, 237, 0.1)',
    padding: 16,
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 4,
  },
})
