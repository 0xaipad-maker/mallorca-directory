import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#3b82f6' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign In' }} />
        <Stack.Screen name="list" options={{ title: 'Businesses' }} />
        <Stack.Screen name="map" options={{ title: 'Map' }} />
        <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="add-business" options={{ title: 'Add Business' }} />
        <Stack.Screen name="business/[id]" options={{ title: 'Details' }} />
      </Stack>
    </>
  );
}
