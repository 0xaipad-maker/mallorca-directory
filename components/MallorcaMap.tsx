import { View, StyleSheet, Platform } from 'react-native';
import { useRef, useEffect } from 'react';

export default function MallorcaMap({ height = 300, style }: { height?: number; style?: any }) {
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;
    const el = containerRef.current;
    if (el.querySelector('iframe')) return;

    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=2.2%2C39.2%2C3.6%2C40.1&layer=mapnik';
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px';
    iframe.allowFullscreen = true;
    el.appendChild(iframe);
  }, []);

  return (
    <View ref={containerRef} style={[{ height, borderRadius: 12, overflow: 'hidden' }, style]} />
  );
}
