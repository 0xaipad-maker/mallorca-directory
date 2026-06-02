import { View, StyleSheet, Platform } from 'react-native';
import { useRef, useEffect } from 'react';

export default function BusinessMap({ lat, lng, height = 480 }: { lat: number; lng: number; height?: number }) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;
    const el = containerRef.current;
    if (el.querySelector('iframe')) return;

    const pad = 0.008;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - pad},${lat - pad},${lng + pad},${lat + pad}&layer=mapnik&marker=${lat},${lng}`;
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px';
    iframe.allowFullscreen = true;
    iframe.title = 'Business location';
    el.appendChild(iframe);
  }, [lat, lng]);

  if (Platform.OS !== 'web') {
    return (
      <View style={{ height, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ fontSize: 40 }}>📍 {lat.toFixed(4)}, {lng.toFixed(4)}</View>
      </View>
    );
  }

  return <View ref={containerRef} style={{ height, borderRadius: 12, overflow: 'hidden' }} />;
}
