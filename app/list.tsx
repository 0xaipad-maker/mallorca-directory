import { View, Text, SectionList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations } from '../store/useStore';
import { areas } from '../utils/areas';

const areaEmojis: Record<string, string> = {};
for (const a of areas) areaEmojis[a.name] = a.emoji;

export default function ListScreen() {
  const { category, area } = useLocalSearchParams<{ category: string; area: string }>();
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
        const constraints: any[] = [];
        if (category) constraints.push(where('category', '==', category));
        if (area) constraints.push(where('area', '==', area));
        const q = constraints.length > 0 ? query(collection(db, 'businesses'), ...constraints) : collection(db, 'businesses');
        const snapshot = await getDocs(q);
        setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, [category, area]);

  const sections = useMemo(() => {
    const grouped: Record<string, Business[]> = {};
    for (const b of businesses) {
      const key = b.area || 'Other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(b);
    }
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([key, data]) => ({ area: key, data }));
  }, [businesses]);

  const pageTitle = area ? `${area} · ${catName}` : (catName || 'All');

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: pageTitle }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { area: a } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEmoji}>{areaEmojis[a] || '📍'}</Text>
            <Text style={styles.sectionTitle}>{a}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => router.push(`/business/${item.id}`)}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemAddress}>{item.address}</Text>
            {item.description?.[language] && <Text style={styles.itemDesc} numberOfLines={1}>{item.description[language]}</Text>}
            {item.rating ? <Text style={styles.itemRating}>★ {item.rating}</Text> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}><Text style={styles.emptyText}>{t.noBusinessesInCategory}</Text></View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  sectionEmoji: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#334155' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingLeft: 52 },
  itemName: { fontWeight: '600', fontSize: 18, color: '#1e293b' },
  itemAddress: { color: '#475569' },
  itemDesc: { color: '#64748b', fontSize: 13, marginTop: 2 },
  itemRating: { color: '#ca8a04', marginTop: 2 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#64748b' },
});
