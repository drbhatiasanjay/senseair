import { View, Text, StyleSheet } from 'react-native'
import { useSensing } from '../stores/useSensing'

function presenceColor(p: string) {
  switch (p) {
    case 'MOTION': return '#f87171'
    case 'PRESENT': return '#34d399'
    case 'EMPTY': return '#64748b'
    default: return '#94a3b8'
  }
}

export default function RoomScreen() {
  const state = useSensing()
  const presence = state.smoothed_presence || state.presence
  const color = presenceColor(presence)

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { borderColor: color, shadowColor: color }]}>
        <Text style={[styles.indicatorText, { color }]}>
          {presence === 'EMPTY' ? '0' : presence === 'MOTION' ? '!' : '1'}
        </Text>
      </View>
      <Text style={[styles.presenceText, { color }]}>{presence}</Text>
      <Text style={styles.subText}>
        {presence === 'EMPTY' ? 'Room is unoccupied' : 'Room is occupied'}
      </Text>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Activity</Text>
          <Text style={styles.detailValue}>{state.smoothed_activity || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Motion</Text>
          <Text style={styles.detailValue}>{state.motion_intensity || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration</Text>
          <Text style={styles.detailValue}>{state.duration || '--'}</Text>
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
    paddingTop: 60,
  },
  indicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  indicatorText: {
    fontSize: 40,
    fontWeight: '700',
  },
  presenceText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  subText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  details: {
    width: '80%',
    marginTop: 40,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 179, 237, 0.1)',
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
  },
})
