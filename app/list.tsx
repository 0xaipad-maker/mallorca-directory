import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations, subcategoryTranslations } from '../store/useStore';
import { categories } from '../utils/categories';
import { areas } from '../utils/areas';
import { colors as themeColors, spacing, borderRadius, typography, shadows } from '../utils/theme';
import LeafletMap from '../components/LeafletMap';
import { SkeletonList } from '../components/Skeleton';

export default function ListScreen() {
  const { category, area } = useLocalSearchParams<{ category?: string; area?: string }>();
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [subcatFilter, setSubcatFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState(areaName);

  const cat = categories.find(c => c.id === category);
  const areaData = areas.find(a => a.id === area || a.name === area);
  const areaName = areaData?.name || area || '';
  const catName = cat ? (categoryTranslations[language]?.[cat.id] || cat.name) : (areaName || 'All');

  useEffect(() => {
    (async () => {
      try {
        let q;
        if (category) {
          q = query(collection(db, 'businesses'), where('category', '==', category));
        } else if (areaName) {
          q = query(collection(db, 'businesses'), where('area', '==', areaName));
        } else {
          q = query(collection(db, 'businesses'));
        }
        const snap = await getDocs(q);
        setAllBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Business));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [category, area]);

  const filtered = useMemo(() => {
    let list = allBusinesses;
    const q = searchQ.toLowerCase().trim();
    if (q) {
      list = list.filter(b =>
        b.name?.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q) ||
        b.area?.toLowerCase().includes(q)
      );
    }
    if (subcatFilter) {
      list = list.filter(b => b.subcategory === subcatFilter);
    }
    if (areaFilter) {
      list = list.filter(b => b.area === areaFilter);
    }
    return list;
  }, [allBusinesses, searchQ, subcatFilter, areaFilter]);

  const renderStars = (n?: number) => {
    if (!n) return '';
    const r = Math.round(n);
    return '★'.repeat(r) + '☆'.repeat(5 - r);
  };

  const renderBusiness = useCallback(({ item }: { item: Business }) => {
    const bCat = categories.find(c => c.id === item.category);
    const bArea = areas.find(a => a.id === item.area);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/business/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <View style={[styles.cardEmojiWrap, { backgroundColor: bCat?.color || '#f1f5f9' }]}>
            <Text style={styles.cardEmoji}>{bCat?.emoji || '📍'}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardArea} numberOfLines={1}>
            {bArea?.name || item.area || item.address}
          </Text>
          {item.rating && (
            <View style={styles.cardRatingRow}>
              <Text style={styles.cardStars}>{renderStars(item.rating)}</Text>
              <Text style={styles.cardRatingValue}>{item.rating.toFixed(1)}</Text>
              {item.reviewCount !== undefined && (
                <Text style={styles.cardReviewCount}>({item.reviewCount})</Text>
              )}
            </View>
          )}
          {item.description?.[language] && (
            <Text style={styles.cardDesc} numberOfLines={2}>{item.description[language]}</Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardArrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }, [language, router]);

  const center = useMemo(() => {
    if (allBusinesses.length === 0) return { lat: 39.6, lng: 2.9 };
    const lat = allBusinesses.reduce((s, b) => s + b.location.lat, 0) / allBusinesses.length;
    const lng = allBusinesses.reduce((s, b) => s + b.location.lng, 0) / allBusinesses.length;
    return { lat, lng };
  }, [allBusinesses]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: catName || t.loading || '...', headerTintColor: '#fff', headerStyle: { backgroundColor: '#4f46e5' } }} />
        <SkeletonList count={6} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: catName,
        headerTintColor: '#fff',
        headerStyle: { backgroundColor: '#4f46e5' },
      }} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Breadcrumbs */}
            <View style={styles.breadcrumbs}>
              <TouchableOpacity onPress={() => router.push('/')}>
                <Text style={styles.breadcrumbLink}>{t.home || 'Home'}</Text>
              </TouchableOpacity>
              {cat && (
                <>
                  <Text style={styles.breadcrumbSep}>›</Text>
                  <TouchableOpacity onPress={() => router.push(`/list?category=${cat.id}`)}>
                    <Text style={styles.breadcrumbLink}>{catName}</Text>
                  </TouchableOpacity>
                </>
              )}
              {areaData && (
                <>
                  <Text style={styles.breadcrumbSep}>›</Text>
                  <Text style={styles.breadcrumbCurrent}>{areaData.name}</Text>
                </>
              )}
              {subcatFilter && (
                <>
                  <Text style={styles.breadcrumbSep}>›</Text>
                  <Text style={styles.breadcrumbCurrent}>{subcategoryTranslations[language]?.[subcatFilter] || subcatFilter}</Text>
                </>
              )}
            </View>

            {/* Header with count, map toggle, and area links */}
            <View style={styles.headerBar}>
              <View>
                <Text style={styles.headerCount}>
                  {filtered.length} {filtered.length === 1 ? 'entry' : t.entries || 'entries'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.mapToggle, showMap && styles.mapToggleActive]}
                onPress={() => setShowMap(!showMap)}
              >
                <Text style={[styles.mapToggleText, showMap && styles.mapToggleTextActive]}>
                  {showMap ? '☰ List' : '🗺️ Map'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder={`${t.search || 'Search'}...`}
                placeholderTextColor="#94a3b8"
                value={searchQ}
                onChangeText={setSearchQ}
              />
            </View>

            {/* Subcategory filter */}
            {category && categories.find(c => c.id === category)?.subcategories && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatRow}>
                <TouchableOpacity style={[styles.subcatChip, !subcatFilter && styles.subcatChipActive]} onPress={() => setSubcatFilter('')}>
                  <Text style={[styles.subcatChipText, !subcatFilter && styles.subcatChipTextActive]}>{t.all || 'All'}</Text>
                </TouchableOpacity>
                {categories.find(c => c.id === category)!.subcategories!.map(sub => (
                  <TouchableOpacity key={sub} style={[styles.subcatChip, subcatFilter === sub && styles.subcatChipActive]} onPress={() => setSubcatFilter(sub)}>
                    <Text style={[styles.subcatChipText, subcatFilter === sub && styles.subcatChipTextActive]}>{subcategoryTranslations[language]?.[sub] || sub}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Area filter */}
            {allBusinesses.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatRow}>
                <TouchableOpacity style={[styles.subcatChip, !areaFilter && styles.subcatChipActive]} onPress={() => setAreaFilter('')}>
                  <Text style={[styles.subcatChipText, !areaFilter && styles.subcatChipTextActive]}>{t.allAreas || 'All areas'}</Text>
                </TouchableOpacity>
                {[...new Set(allBusinesses.map(b => b.area).filter(Boolean))].sort().map(area => (
                  <TouchableOpacity key={area} style={[styles.subcatChip, areaFilter === area && styles.subcatChipActive]} onPress={() => setAreaFilter(area)}>
                    <Text style={[styles.subcatChipText, areaFilter === area && styles.subcatChipTextActive]}>{area}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Map */}
            {showMap && filtered.length > 0 && (
              <View style={styles.mapWrap}>
                <LeafletMap
                  mode="multiple"
                  height={300}
                  businesses={filtered.map(b => ({ ...b, lat: b.location.lat, lng: b.location.lng }))}
                  businessName={catName}
                />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>{cat?.emoji || '📭'}</Text>
            <Text style={styles.emptyTitle}>{t.noBusinessesInCategory || 'No businesses in this category'}</Text>
            {searchQ ? (
              <Text style={styles.emptySub}>Try a different search term</Text>
            ) : null}
          </View>
        }
        renderItem={renderBusiness}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  list: { paddingBottom: 24 },
  // Breadcrumbs
  breadcrumbs: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  breadcrumbLink: { fontSize: 12, color: '#4f46e5', fontWeight: '500' },
  breadcrumbSep: { fontSize: 12, color: '#94a3b8', marginHorizontal: 4 },
  breadcrumbCurrent: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  // Header bar
  headerBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  headerCount: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  mapToggle: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  mapToggleActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  mapToggleText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  mapToggleTextActive: { color: '#fff' },
  // Search
  searchWrap: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchInput: {
    backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  // Map
  mapWrap: { margin: 16, borderRadius: 14, overflow: 'hidden', ...shadows.md },
  // Subcategory filter
  subcatRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  subcatChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  subcatChipActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  subcatChipText: { fontSize: 12, color: '#64748b' },
  subcatChipTextActive: { color: '#4f46e5', fontWeight: '600' },
  // Card
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 16, marginTop: 10, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0', ...shadows.sm,
  },
  cardLeft: { marginRight: 14 },
  cardEmojiWrap: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cardEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  cardArea: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  cardRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  cardStars: { fontSize: 14, color: '#f59e0b', letterSpacing: 1 },
  cardRatingValue: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  cardReviewCount: { fontSize: 11, color: '#94a3b8' },
  cardDesc: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  cardRight: { justifyContent: 'center', paddingLeft: 8 },
  cardArrow: { fontSize: 24, color: '#cbd5e1', fontWeight: '300' },
  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748b', textAlign: 'center', paddingHorizontal: 40, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
});
