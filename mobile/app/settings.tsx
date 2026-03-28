import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native'
import { useState } from 'react'

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    Alert.alert('Settings', `API URL set to: ${apiUrl}\n\nRestart the app to apply.`)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SenseAir Settings</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Cloud API URL</Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholder="https://senseair-api.onrender.com"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <Pressable style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>{saved ? 'Saved!' : 'Save'}</Text>
      </Pressable>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>About</Text>
        <Text style={styles.infoText}>SenseAir v1.0.0</Text>
        <Text style={styles.infoText}>WiFi CSI Sensing Dashboard</Text>
        <Text style={styles.infoText}>ESP32-S3 + ML-based presence detection</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a13',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 179, 237, 0.15)',
    padding: 14,
    color: '#f1f5f9',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#63b3ed',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#060a13',
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    marginTop: 40,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 179, 237, 0.1)',
    padding: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
})
