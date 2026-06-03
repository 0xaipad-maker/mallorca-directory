import { View, StyleSheet, Platform } from 'react-native';
import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';

const categoryEmojis: Record<string, string> = {
  restaurants: '🍽️', cafes: '☕', hotels: '🏨', beaches: '🏖️', parks: '🌳',
  activities: '🎯', shopping: '🛍️', supermarkets: '🛒', services: '🔧',
  transport: '🚗', health: '🏥', pharmacies: '💊', police: '👮',
  gasstations: '⛽', veterinarians: '🐾', banks: '🏦', postoffice: '📮', industrial: '🏭',
};

let leafletLoaded = false;

function loadLeaflet(callback: () => void) {
  if (typeof window === 'undefined') return;
  if (leafletLoaded) { callback(); return; }

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  const clusterCss = document.createElement('link');
  clusterCss.rel = 'stylesheet';
  clusterCss.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css';
  document.head.appendChild(clusterCss);

  const clusterCss2 = document.createElement('link');
  clusterCss2.rel = 'stylesheet';
  clusterCss2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css';
  document.head.appendChild(clusterCss2);

  const js = document.createElement('script');
  js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  js.onload = () => {
    const clusterJs = document.createElement('script');
    clusterJs.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js';
    clusterJs.onload = () => { leafletLoaded = true; callback(); };
    document.head.appendChild(clusterJs);
  };
  document.head.appendChild(js);
}

function createMarkerIcon(emoji: string) {
  // @ts-ignore
  const L = window.L;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;display:flex;align-items:center;justify-content:center;
      font-size:18px;background:#fff;border:2px solid #1e40af;border-radius:50%;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);cursor:pointer;
    ">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function createBlueMarkerIcon() {
  // @ts-ignore
  const L = window.L;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;display:flex;align-items:center;justify-content:center;
      font-size:14px;background:#1e40af;border:3px solid #fff;border-radius:50%;
      box-shadow:0 3px 10px rgba(0,0,0,0.35);cursor:pointer;color:#fff;
    ">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
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
  mode: 'overview' | 'single';
  height?: number;
  businesses?: Array<{ id: string; name: string; lat: number; lng: number; category?: string }>;
  lat?: number;
  lng?: number;
  businessName?: string;
  style?: any;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !containerRef.current) return;
    const el = containerRef.current;
    if (mapRef.current) return;

    loadLeaflet(() => {
      // @ts-ignore
      const L = window.L;
      if (!L || !el) return;

      const center: [number, number] = mode === 'single'
        ? [lat || 39.5696, lng || 2.6502]
        : [39.65, 2.85];
      const zoom = mode === 'single' ? 15 : 10;

      const map = L.map(el, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      if (mode === 'overview' && businesses && businesses.length > 0) {
        if (businesses.length > 50) {
          const clusterGroup = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
          });

          for (const b of businesses) {
            if (!b.lat || !b.lng) continue;
            const emoji = categoryEmojis[b.category || ''] || '📍';
            const marker = L.marker([b.lat, b.lng], { icon: createMarkerIcon(emoji) })
              .bindPopup(`<div style="min-width:150px;"><strong>${b.name}</strong></div>`);
            clusterGroup.addLayer(marker);
          }
          map.addLayer(clusterGroup);
        } else {
          for (const b of businesses) {
            if (!b.lat || !b.lng) continue;
            const emoji = categoryEmojis[b.category || ''] || '📍';
            L.marker([b.lat, b.lng], { icon: createMarkerIcon(emoji) })
              .bindPopup(`<div style="min-width:150px;"><strong>${b.name}</strong></div>`)
              .addTo(map);
          }
        }
        map.fitBounds(L.latLngBounds(
          businesses
            .filter(b => b.lat && b.lng)
            .map(b => [b.lat, b.lng] as [number, number])
        ), { padding: [40, 40] });
      }

      if (mode === 'single' && lat && lng) {
        L.marker([lat, lng], { icon: createBlueMarkerIcon() })
          .bindPopup(`<div style="min-width:150px;"><strong>${businessName || ''}</strong></div>`)
          .addTo(map);
        map.setView([lat, lng], 15);
      }

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
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
