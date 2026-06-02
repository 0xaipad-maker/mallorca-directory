import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations, categoryTranslations } from '../../store/useStore';
import { categories } from '../../utils/categories';
import { areaMap, areas } from '../../utils/areas';

export default function AreaScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const areaData = areaMap[name || ''] || areas.find(a => a.name.toLowerCase() === (name || '').toLowerCase());

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const areaName = areaData?.name || name || '';
        const q = query(collection(db, 'businesses'), where('area', '==', areaName));
        const snapshot = await getDocs(q);
        setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, [name]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of businesses) {
      counts[b.category] = (counts[b.category] || 0) + 1;
    }
    return counts;
  }, [businesses]);

  const areaCategories = categories.filter(c => categoryCounts[c.id] > 0);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: areaData?.name || name || '' }} />

      {areaData && (
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{areaData.emoji}</Text>
          <Text style={styles.heroName}>{areaData.name}</Text>
          <Text style={styles.heroDesc}>{areaData.description[language]}</Text>
          <Text style={styles.heroCount}>{businesses.length} {t.businesses || 'businesses'}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t.categories}</Text>
        {areaCategories.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t.noBusinessesInArea}</Text>
          </View>
        )}
        <View style={styles.grid}>
          {areaCategories.map(cat => (
            <TouchableOpacity key={cat.id} style={[styles.card, { backgroundColor: cat.color }]}
              onPress={() => router.push(`/list?category=${cat.id}&area=${areaData?.name || name}`)}>
              <Text style={styles.cardEmoji}>{cat.emoji}</Text>
              <Text style={styles.cardName}>{categoryTranslations[language][cat.id] || cat.id}</Text>
              <Text style={styles.cardCount}>{categoryCounts[cat.id]} {t.places?.toLowerCase() || 'places'}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: '#1e40af', padding: 24, alignItems: 'center' },
  heroEmoji: { fontSize: 48, marginBottom: 8 },
  heroName: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  heroDesc: { color: '#93c5fd', textAlign: 'center', marginBottom: 8 },
  heroCount: { color: '#bfdbfe', fontWeight: '500' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center', elevation: 1 },
  cardEmoji: { fontSize: 28, marginBottom: 6 },
  cardName: { fontWeight: '600', color: '#1e293b', textAlign: 'center' },
  cardCount: { fontSize: 12, color: '#64748b', marginTop: 2 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#64748b' },
});
