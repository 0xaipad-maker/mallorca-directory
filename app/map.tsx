import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';

export default function MapScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const ref = category
          ? query(collection(db, 'businesses'), where('category', '==', category))
          : collection(db, 'businesses');
        const snapshot = await getDocs(ref);
        setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  if (businesses.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No businesses found</Text>
      </View>
    );
  }

  const center = businesses.reduce(
    (acc, b) => ({
      lat: acc.lat + b.location.lat / businesses.length,
      lng: acc.lng + b.location.lng / businesses.length,
    }),
    { lat: 39.6953, lng: 3.0176 }
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.countText}>{businesses.length} businesses</Text>
        <Text style={styles.coordText}>
          Map center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
        </Text>
        <Text style={styles.noteText}>Open in Expo Go on a device for native map</Text>
        {businesses.slice(0, 10).map((b) => (
          <Text key={b.id} style={styles.businessItem}>
            📍 {b.name}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#6b7280' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  countText: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  coordText: { color: '#4b5563', marginBottom: 4 },
  noteText: { color: '#9ca3af', fontSize: 13, marginBottom: 16 },
  businessItem: { fontSize: 14, color: '#374151', marginTop: 4 },
});
