import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Guide } from '../../types';
import { useStore, translations } from '../../store/useStore';

export default function GuidesScreen() {
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const q = query(collection(db, 'guides'), orderBy('publishedAt', 'desc'));
        const snap = await getDocs(q);
        setGuides(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guide)));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchGuides();
  }, []);

  const categories = Array.from(new Set(guides.map(g => g.category)));

  const filtered = activeCategory
    ? guides.filter(g => g.category === activeCategory)
    : guides;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const renderGuide = ({ item }: { item: Guide }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/guides/${item.slug}`)}>
      <View style={styles.cardImageWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.placeholderEmoji}>📖</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title[language] || item.title.en}
        </Text>
        {item.excerpt?.[language] && (
          <Text style={styles.cardExcerpt} numberOfLines={2}>
            {item.excerpt[language]}
          </Text>
        )}
        <Text style={styles.cardDate}>{formatDate(item.publishedAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.guides}</Text>
      </View>

      {categories.length > 1 && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, !activeCategory && styles.filterChipActive]}
            onPress={() => setActiveCategory('')}
          >
            <Text style={[styles.filterChipText, !activeCategory && styles.filterChipTextActive]}>
              {t.allCategories}
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderGuide}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyTitle}>{t.noGuides}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#1e40af', borderColor: '#1e40af' },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  filterChipTextActive: { color: '#fff' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  cardImageWrap: { height: 160, backgroundColor: '#f1f5f9' },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardImagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 40, opacity: 0.4 },
  cardBody: { padding: 14 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  categoryBadgeText: { fontSize: 11, fontWeight: '600', color: '#1e40af', textTransform: 'capitalize' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  cardExcerpt: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 8 },
  cardDate: { fontSize: 12, color: '#94a3b8' },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#94a3b8' },
});
