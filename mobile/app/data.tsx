import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { useSensing } from '../stores/useSensing'

function Card({ label, value, color = '#f1f5f9' }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
    </View>
  )
}

export default function DataScreen() {
  const state = useSensing()

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.grid}>
        <Card label="Packets" value={String(state.packet_count || 0)} />
        <Card label="Rate" value={`${state.packet_rate} pkt/s`} />
        <Card label="RSSI" value={`${state.rssi} dBm`} color={state.rssi > -50 ? '#34d399' : '#fbbf24'} />
        <Card label="Presence" value={state.presence} color={state.presence === 'PRESENT' ? '#34d399' : '#94a3b8'} />
        <Card label="Activity" value={state.activity} color="#a78bfa" />
        <Card label="Confidence" value={`${state.activity_confidence}%`} />
        <Card label="Breathing" value={state.breathing_bpm > 0 ? `${state.breathing_bpm.toFixed(1)} BPM` : '--'} color="#63b3ed" />
        <Card label="Breath Conf" value={`${state.breathing_confidence}%`} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060a13' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 179, 237, 0.1)',
    padding: 16,
  },
  cardLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginTop: 6,
  },
})
