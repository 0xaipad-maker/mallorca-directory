import { View, Text, TextInput, FlatList, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations } from '../store/useStore';
import { categories } from '../utils/categories';
import { areas } from '../utils/areas';
import Skeleton, { SkeletonList } from '../components/Skeleton';

export default function SearchScreen() {
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const [query, setQuery] = useState('');
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState<string>('');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'businesses'));
        setAllBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Business));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  const results = useMemo(() => {
    let list = allBusinesses;
    const q = query.toLowerCase().trim();
    if (q) {
      list = list.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.area?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
      );
    }
    if (catFilter) list = list.filter(b => b.category === catFilter);
    if (areaFilter) list = list.filter(b => b.area === areaFilter);
    if (minRating > 0) list = list.filter(b => (b.rating || 0) >= minRating);
    return list;
  }, [allBusinesses, query, catFilter, areaFilter, minRating]);

  const renderStars = (n?: number) => {
    if (!n) return '';
    const r = Math.round(n);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };

  const renderBusiness = ({ item }: { item: Business }) => {
    const bCat = categories.find(c => c.id === item.category);
    const bArea = areas.find(a => a.id === item.area);
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/business/${item.id}`)} activeOpacity={0.7}>
        <View style={[styles.cardEmoji, { backgroundColor: bCat?.color || '#f1f5f9' }]}>
          <Text style={styles.cardEmojiText}>{bCat?.emoji || '📍'}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardArea} numberOfLines={1}>{bArea?.name || item.area || item.address}</Text>
          {item.rating && (
            <View style={styles.cardRatingRow}>
              <Text style={styles.cardStars}>{renderStars(item.rating)}</Text>
              <Text style={styles.cardRatingValue}>{item.rating.toFixed(1)}</Text>
              {item.reviewCount !== undefined && <Text style={styles.cardReviewCount}>({item.reviewCount})</Text>}
            </View>
          )}
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  const uniqueAreas = useMemo(() => {
    const set = new Set(allBusinesses.map(b => b.area).filter(Boolean));
    return [...set].sort();
  }, [allBusinesses]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <Skeleton width="80%" height={44} borderRadius={12} style={{ marginLeft: 8 }} />
          </View>
        </View>
        <SkeletonList count={6} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t.search || 'Search', headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder={t.search || 'Search...'}
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderBusiness}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.filterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                <TouchableOpacity style={[styles.filterChip, !catFilter && styles.filterChipActive]} onPress={() => setCatFilter('')}>
                  <Text style={[styles.filterChipText, !catFilter && styles.filterChipTextActive]}>{t.all || 'All'}</Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity key={cat.id} style={[styles.filterChip, catFilter === cat.id && styles.filterChipActive]} onPress={() => setCatFilter(cat.id)}>
                    <Text style={[styles.filterChipText, catFilter === cat.id && styles.filterChipTextActive]}>{cat.emoji} {categoryTranslations[language]?.[cat.id] || cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.filterBar2}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                <TouchableOpacity style={[styles.filterChip, !areaFilter && styles.filterChipActive]} onPress={() => setAreaFilter('')}>
                  <Text style={[styles.filterChipText, !areaFilter && styles.filterChipTextActive]}>{t.allAreas || 'All areas'}</Text>
                </TouchableOpacity>
                {uniqueAreas.map(area => (
                  <TouchableOpacity key={area} style={[styles.filterChip, areaFilter === area && styles.filterChipActive]} onPress={() => setAreaFilter(area)}>
                    <Text style={[styles.filterChipText, areaFilter === area && styles.filterChipTextActive]}>{area}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.ratingFilterRow}>
              <Text style={styles.ratingFilterLabel}>{t.minRating || 'Min rating'}:</Text>
              {[0, 3, 3.5, 4, 4.5].map(r => (
                <TouchableOpacity key={r} style={[styles.ratingChip, minRating === r && styles.ratingChipActive]} onPress={() => setMinRating(r)}>
                  <Text style={[styles.ratingChipText, minRating === r && styles.ratingChipTextActive]}>{r === 0 ? t.any || 'Any' : `${r}+`}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.resultCount}>{results.length} {t.results || 'results'}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>{t.noResults || 'No results found'}</Text>
            <Text style={styles.emptySub}>{t.tryAdjusting || 'Try adjusting your search or filters'}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#4f46e5', paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12 },
  backBtn: { paddingRight: 8 },
  backBtnText: { fontSize: 20, color: '#4f46e5' },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 12, color: '#0f172a' },
  clearBtn: { paddingLeft: 8 },
  clearBtnText: { fontSize: 16, color: '#94a3b8' },
  filterBar: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  filterBar2: { paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fff' },
  filterRow: { paddingHorizontal: 12, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  filterChipText: { fontSize: 13, color: '#64748b' },
  filterChipTextActive: { color: '#4f46e5', fontWeight: '600' },
  ratingFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  ratingFilterLabel: { fontSize: 13, fontWeight: '600', color: '#0f172a', marginRight: 4 },
  ratingChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  ratingChipActive: { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
  ratingChipText: { fontSize: 12, color: '#64748b' },
  ratingChipTextActive: { color: '#b45309', fontWeight: '600' },
  resultCount: { fontSize: 13, color: '#94a3b8', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  list: { paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardEmoji: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardEmojiText: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  cardArea: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStars: { fontSize: 13, color: '#f59e0b', letterSpacing: 1 },
  cardRatingValue: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  cardReviewCount: { fontSize: 11, color: '#94a3b8' },
  cardArrow: { fontSize: 22, color: '#cbd5e1', paddingLeft: 8 },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center', maxWidth: 240 },
});
