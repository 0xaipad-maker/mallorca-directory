import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors, typography, shadows } from '../../utils/theme';
import { useStore, translations } from '../../store/useStore';

export default function TabLayout() {
  const { language } = useStore();
  const t = translations[language];
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarLabelStyle: styles.tabLabel,
    }}>
      <Tabs.Screen name="index" options={{
        title: t.explore || 'Explore',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🗺️</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="events" options={{
        title: t.events || 'Events',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📅</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="planner" options={{
        title: t.tripPlanner || 'Planner',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📋</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="guides" options={{
        title: t.guides || 'Guides',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📖</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="favorites" options={{
        title: t.favorites || 'Favorites',
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconWrap}>
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>⭐</Text>
            {focused && <View style={styles.tabDot} />}
          </View>
        ),
      }} />
      <Tabs.Screen name="profile" options={{
        title: t.profile || 'Profile',
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
