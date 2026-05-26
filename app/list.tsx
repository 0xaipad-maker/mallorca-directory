import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations } from '../store/useStore';

const areaEmojis: Record<string, string> = {
  Palma: '🏛️',
  Calvià: '🌊',
  Alcúdia: '🏰',
  Pollença: '⛵',
  Sóller: '🚂',
  Deià: '🏔️',
  Valldemossa: '🎵',
  Andratx: '⛵',
  Inca: '🏘️',
  Manacor: '🏭',
  Marratxí: '🏗️',
  Santanyí: '🏖️',
  Campos: '🌾',
  Muro: '🌿',
  Bunyola: '🌄',
  Alaró: '🏘️',
  Capdepera: '🏖️',
  Artà: '🏛️',
  Felanitx: '🏘️',
  Llucmajor: '🏘️',
  'Sa Pobla': '🌾',
  'Santa Maria del Camí': '🍷',
  Binissalem: '🍷',
  Consell: '🏗️',
  'Ses Salines': '🧂',
};

export default function ListScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const catName = category ? categoryTranslations[language]?.[category] || category : '';
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'businesses'), where('category', '==', category));
        const snapshot = await getDocs(q);
        setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category]);

  const sections = useMemo(() => {
    const grouped: Record<string, Business[]> = {};
    for (const b of businesses) {
      const area = b.area || 'Other';
      if (!grouped[area]) grouped[area] = [];
      grouped[area].push(b);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([area, data]) => ({ area, data }));
  }, [businesses]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: catName || 'Businesses' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { area } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>{areaEmojis[area] || '📍'}</Text>
            <Text style={styles.sectionTitle}>{area}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/business/${item.id}`)}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemAddress}>{item.address}</Text>
            {item.rating && <Text style={styles.itemRating}>★ {item.rating}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t.noBusinessesInCategory}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sectionEmoji: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#374151' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingLeft: 52 },
  itemName: { fontWeight: '600', fontSize: 18 },
  itemAddress: { color: '#4b5563' },
  itemRating: { color: '#ca8a04' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#6b7280' },
});
