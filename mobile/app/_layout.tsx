import { Tabs } from 'expo-router'

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#060a13', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: '#63b3ed',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#060a13' },
        headerTintColor: '#f1f5f9',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Live', tabBarLabel: 'Live' }}
      />
      <Tabs.Screen
        name="data"
        options={{ title: 'Data', tabBarLabel: 'Data' }}
      />
      <Tabs.Screen
        name="room"
        options={{ title: 'Room', tabBarLabel: 'Room' }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarLabel: 'Settings' }}
      />
    </Tabs>
  )
}
