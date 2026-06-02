import { Tabs } from 'expo-router';
import { Text, StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#1e40af',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarLabelStyle: styles.tabLabel,
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Explore',
        tabBarIcon: ({ focused }) => <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>🗺️</Text>,
      }} />
      <Tabs.Screen name="events" options={{
        title: 'Events',
        tabBarIcon: ({ focused }) => <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>📅</Text>,
      }} />
      <Tabs.Screen name="guides" options={{
        title: 'Guides',
        tabBarIcon: ({ focused }) => <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>📖</Text>,
      }} />
      <Tabs.Screen name="favorites" options={{
        title: 'Favorites',
        tabBarIcon: ({ focused }) => <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>⭐</Text>,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ focused }) => <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>👤</Text>,
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 22,
  },
});
