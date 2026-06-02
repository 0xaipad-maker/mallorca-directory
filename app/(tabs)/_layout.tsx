import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors, typography, shadows } from '../../utils/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: styles.tabLabel,
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Explore',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🗺️</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="events" options={{
        title: 'Events',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📅</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="guides" options={{
        title: 'Guides',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📖</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="favorites" options={{
        title: 'Favorites',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>⭐</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>👤</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    height: 65,
    paddingBottom: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadows.lg,
  },
  tabLabel: {
    ...typography.caption,
    marginTop: 2,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconActive: {},
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
