import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Guide } from '../../types';
import { useStore, translations } from '../../store/useStore';
import { colors as themeColors, spacing, borderRadius, typography, shadows } from '../../utils/theme';

const GRADIENT_COLORS = ['#4f46e5', '#7c3aed', '#a855f7'];

const GUIDE_CATEGORIES = [
  { id: 'living', label: { en: 'Living', es: 'Vivir', de: 'Leben', ru: 'Жизнь' }, emoji: '🏠' },
  { id: 'travel', label: { en: 'Travel', es: 'Viajes', de: 'Reisen', ru: 'Путешествия' }, emoji: '✈️' },
  { id: 'lifestyle', label: { en: 'Lifestyle', es: 'Estilo de Vida', de: 'Lebensstil', ru: 'Образ жизни' }, emoji: '🌟' },
];

function formatDate(dateStr: string | undefined, lang: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(
    lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' }
  );
}

export default function GuidesScreen() {
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  const fetchGuides = useCallback(async () => {
    try {
      const q = query(collection(db, 'guides'), orderBy('publishedAt', 'desc'));
      const snap = await getDocs(q);
      setGuides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guide)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchGuides(); }, [fetchGuides]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGuides();
  }, [fetchGuides]);

  const filtered = activeCategory
    ? guides.filter(g => g.category === activeCategory)
    : guides;

  const catMeta = (catId: string) => GUIDE_CATEGORIES.find(c => c.id === catId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" colors={['#a855f7']} />
        }
        ListHeaderComponent={
          <View>
            {/* HERO */}
            <View style={styles.hero}>
              <View style={styles.heroBg}>
                {GRADIENT_COLORS.map((c, i) => (
                  <View key={i} style={[styles.heroGradientBand, { backgroundColor: c, opacity: 1 - i * 0.15, height: 200 - i * 15 }]} />
                ))}
              </View>
              <View style={styles.heroContent}>
                <Text style={styles.heroTagline}>MALLORCA GUIDES</Text>
                <Text style={styles.heroTitle}>{t.guides || 'Guides'}</Text>
                <Text style={styles.heroSub}>{t.guidesSub || 'Expert guides to help you live, travel and enjoy Mallorca'}</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{guides.length}</Text>
                    <Text style={styles.heroStatLabel}>{t.guides || 'Guides'}</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{GUIDE_CATEGORIES.length}</Text>
                    <Text style={styles.heroStatLabel}>{t.categories || 'Categories'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CATEGORY FILTER */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !activeCategory && styles.filterChipActive]}
                onPress={() => setActiveCategory('')}
              >
                <Text style={[styles.filterChipText, !activeCategory && styles.filterChipTextActive]}>{t.all || 'All'}</Text>
              </TouchableOpacity>
              {GUIDE_CATEGORIES.map(cat => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setActiveCategory(isActive ? '' : cat.id)}
                  >
                    <Text style={styles.filterChipEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {cat.label[language] || cat.label.en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>{t.noGuides || 'No guides yet'}</Text>
            <Text style={styles.emptySub}>{t.emptyGuidesSub || 'Check back later for new guides'}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cat = catMeta(item.category);
          const title = item.title?.[language] || item.title?.en || '';
          const excerpt = item.excerpt?.[language] || item.excerpt?.en || '';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/guides/${item.slug}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardImageWrap}>
                <Text style={styles.cardEmoji}>{cat?.emoji || '📖'}</Text>
                <View style={styles.cardCategoryBadge}>
                  <Text style={styles.cardCategoryText}>
                    {cat?.label?.[language] || cat?.label?.en || item.category}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
                {excerpt ? (
                  <Text style={styles.cardExcerpt} numberOfLines={2}>{excerpt}</Text>
                ) : null}
                <View style={styles.cardFooter}>
                  {item.readTime ? (
                    <Text style={styles.cardReadTime}>{item.readTime} {t.read || 'read'}</Text>
                  ) : null}
                  <Text style={styles.cardDate}>
                    {formatDate(item.publishedAt, language)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4f46e5' },
  list: { paddingBottom: 24 },
  // Hero
  hero: { height: 230, position: 'relative', overflow: 'hidden' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroGradientBand: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroContent: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 56, zIndex: 5,
  },
  heroTagline: { fontSize: 11, fontWeight: '700', color: '#c4b5fd', letterSpacing: 2, marginBottom: 4 },
  heroTitle: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 13, color: '#e0d7ff', lineHeight: 18, marginBottom: 16, maxWidth: 320 },
  heroStats: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroStat: { alignItems: 'center' },
  heroStatValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 11, color: '#c4b5fd', fontWeight: '500', marginTop: -2 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  // Filter
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 8,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#4f46e5', borderColor: '#4f46e5' },
  filterChipEmoji: { fontSize: 13 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  filterChipTextActive: { color: '#fff' },
  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
    ...shadows.md,
  },
  cardImageWrap: {
    height: 100, backgroundColor: '#f1f5f9',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  cardEmoji: { fontSize: 36, opacity: 0.6 },
  cardCategoryBadge: {
    position: 'absolute', top: 10, left: 12,
    backgroundColor: 'rgba(79,70,229,0.9)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  cardCategoryText: { fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4, lineHeight: 20 },
  cardExcerpt: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardReadTime: { fontSize: 11, fontWeight: '600', color: '#4f46e5', backgroundColor: '#eef2ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardDate: { fontSize: 11, color: '#94a3b8' },
  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
});
