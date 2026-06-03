import { View, Text, StyleSheet, Platform } from 'react-native';
import { useRef, useEffect } from 'react';
import L from 'leaflet';

const categoryEmojis: Record<string, string> = {
  restaurants: '🍽️', cafes: '☕', hotels: '🏨', beaches: '🏖️', parks: '🌳',
  activities: '🎯', shopping: '🛍️', supermarkets: '🛒', services: '🔧',
  transport: '🚗', health: '🏥', pharmacies: '💊', police: '👮',
  gasstations: '⛽', veterinarians: '🐾', banks: '🏦', postoffice: '📮', industrial: '🏭',
};

function emojiToDataUri(emoji: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.arc(20, 20, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 20, 22);
  return canvas.toDataURL();
}

export default function LeafletMap({
  mode,
  height = 300,
  businesses,
  lat,
  lng,
  businessName,
  style,
}: {
  mode: 'overview' | 'single' | 'multiple';
  height?: number;
  businesses?: Array<{ id: string; name: string; lat: number; lng: number; category?: string } & Record<string, any>>;
  lat?: number;
  lng?: number;
  businessName?: string;
  style?: any;
}) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;
    if (mapRef.current) return;

    const el = containerRef.current;
    const map = L.map(el, { zoomControl: false }).setView([39.6, 2.9], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (mode === 'single' && lat && lng) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#4f46e5;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">📍</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([lat, lng], { icon }).addTo(map);
      if (businessName) marker.bindPopup(businessName);
      markersRef.current.push(marker);
      const pad = 0.006;
      map.fitBounds([[lat - pad, lng - pad], [lat + pad, lng + pad]]);
    } else if (mode === 'multiple' && businesses && businesses.length > 0) {
      const lats: number[] = [];
      const lngs: number[] = [];
      businesses.forEach(b => {
        if (!b.lat || !b.lng) return;
        lats.push(b.lat);
        lngs.push(b.lng);
        const emoji = categoryEmojis[b.category || ''] || '📍';
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#4f46e5;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer">${emoji}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        const marker = L.marker([b.lat, b.lng], { icon }).addTo(map);
        marker.bindPopup(`<b>${b.name}</b>`);
        markersRef.current.push(marker);
      });
      if (lats.length > 0) {
        const pad2 = 0.02;
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        if (minLat === maxLat && minLng === maxLng) {
          map.setView([minLat, minLng], 13);
        } else {
          map.fitBounds([[minLat - pad2, minLng - pad2], [maxLat + pad2, maxLng + pad2]]);
        }
      }
    } else if (mode === 'overview') {
      map.setView([39.6, 2.9], 10);
    }
  }, [mode, lat, lng, businesses, businessName]);

  if (Platform.OS !== 'web') {
    return (
      <View style={[{ height, borderRadius: 12, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={{ fontSize: 40 }}>📍</Text>
      </View>
    );
  }

  return (
    <View ref={containerRef} style={[{ height, borderRadius: 12, overflow: 'hidden', zIndex: 1 }, style]} />
  );
}
