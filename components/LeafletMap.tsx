import { View, StyleSheet, Platform } from 'react-native';
import { useRef, useEffect } from 'react';

const categoryEmojis: Record<string, string> = {
  restaurants: '🍽️', cafes: '☕', hotels: '🏨', beaches: '🏖️', parks: '🌳',
  activities: '🎯', shopping: '🛍️', supermarkets: '🛒', services: '🔧',
  transport: '🚗', health: '🏥', pharmacies: '💊', police: '👮',
  gasstations: '⛽', veterinarians: '🐾', banks: '🏦', postoffice: '📮', industrial: '🏭',
};

export default function LeafletMap({
  mode,
  height = 300,
  businesses,
  lat,
  lng,
  businessName,
  style,
}: {
  mode: 'overview' | 'single';
  height?: number;
  businesses?: Array<{ id: string; name: string; lat: number; lng: number; category?: string }>;
  lat?: number;
  lng?: number;
  businessName?: string;
  style?: any;
}) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;
    const el = containerRef.current;
    if (el.querySelector('iframe')) return;

    const pad = mode === 'single' ? 0.006 : 0;
    let url = '';

    if (mode === 'single' && lat && lng) {
      url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - pad},${lat - pad},${lng + pad},${lat + pad}&layer=mapnik&marker=${lat},${lng}`;
    } else if (mode === 'overview') {
      url = 'https://www.openstreetmap.org/export/embed.html?bbox=2.15%2C39.15%2C3.65%2C40.15&layer=mapnik';
    }

    if (!url) return;

    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px';
    iframe.allowFullscreen = true;
    iframe.title = businessName || 'Mallorca map';
    el.appendChild(iframe);
  }, [mode, lat, lng, businesses?.length]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[{ height, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }, style]}>
        <View style={{ fontSize: 40 }}>📍</View>
      </View>
    );
  }

  return (
    <View ref={containerRef} style={[{ height, borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }, style]} />
  );
}
