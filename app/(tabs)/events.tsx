import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { MallorcaEvent } from '../../types';
import { useStore, translations } from '../../store/useStore';
import { colors as themeColors, spacing, borderRadius, typography, shadows } from '../../utils/theme';

const { width } = Dimensions.get('window');

const GRADIENT_COLORS = ['#4f46e5', '#7c3aed', '#a855f7'];

const EVENT_CATEGORIES = [
  { id: 'food-drink', label: { en: 'Food & Drink', es: 'Comida y Bebida', de: 'Essen & Trinken', ru: 'Еда и напитки' }, emoji: '🍽️' },
  { id: 'events-parties', label: { en: 'Events & Parties', es: 'Eventos y Fiestas', de: 'Veranstaltungen & Partys', ru: 'Мероприятия и вечеринки' }, emoji: '🎉' },
  { id: 'sports-fitness', label: { en: 'Sports & Fitness', es: 'Deportes y Fitness', de: 'Sport & Fitness', ru: 'Спорт и фитнес' }, emoji: '🏃' },
  { id: 'tours-experiences', label: { en: 'Tours & Experiences', es: 'Tours y Experiencias', de: 'Touren & Erlebnisse', ru: 'Туры и впечатления' }, emoji: '🧭' },
];

interface MonthGroup {
  month: string;
  data: MallorcaEvent[];
}

function groupByMonth(events: MallorcaEvent[], lang: string): MonthGroup[] {
  const locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : lang === 'ru' ? 'ru-RU' : 'en-US';
  const groups: Record<string, MallorcaEvent[]> = {};
  const sorted = [...events].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  for (const event of sorted) {
    const date = event.date instanceof Date ? event.date : new Date(event.date);
    const key = `${date.toLocaleString(locale, { month: 'long' })} ${date.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return Object.entries(groups).map(([month, data]) => ({ month, data }));
}

function formatTime(dateStr: string, lang: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const t = translations[lang];
  if (diff < 0) return t.past || 'Past';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return t.today || 'Today';
  if (days === 1) return t.tomorrow || 'Tomorrow';
  if (days <= 7) return `${days} ${t.days || 'days'}`;
  return d.toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : lang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
}

export default function EventsScreen() {
  const router = useRouter();
  const { language, user } = useStore();
  const t = translations[language];
  const [events, setEvents] = useState<MallorcaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('');

  const fetchEvents = useCallback(async (cat: string) => {
    try {
      const constraints: any[] = [orderBy('date', 'asc')];
      if (cat) constraints.unshift(where('category', '==', cat));
      const q = query(collection(db, 'events'), ...constraints);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MallorcaEvent));
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents(category);
  }, [category, fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents(category);
  }, [category, fetchEvents]);

  const groups = groupByMonth(events, language);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const renderEvent = (event: MallorcaEvent) => {
    const locale = language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : 'en-US';
    const date = event.date instanceof Date ? event.date : new Date(event.date);
    const day = date.getDate();
    const month = date.toLocaleString(locale, { month: 'short' });
    const rel = formatTime(event.date, language);
    const title = typeof event.title === 'string' ? event.title : (event.title as any)?.[language] || (event.title as any)?.en || '';
    return (
      <TouchableOpacity
        key={event.id}
        style={styles.card}
        onPress={() => router.push(`/events/${event.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
          {event.location && <Text style={styles.cardLocation}>{event.location}</Text>}
          <View style={styles.cardMeta}>
            {event.time && <Text style={styles.cardTime}>{event.time}</Text>}
            {event.price && <Text style={styles.cardPrice}>{event.price}</Text>}
            <View style={styles.cardRelWrap}>
              <Text style={[styles.cardRel, rel === 'Today' && styles.cardRelToday]}>{rel}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={item => item.month}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" colors={['#a855f7']} />}
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
                <Text style={styles.heroTagline}>MALLORCA EVENTS</Text>
                <Text style={styles.heroTitle}>{t.events || 'Events'}</Text>
                <Text style={styles.heroSub}>{t.eventsSub || 'Discover events, festivals and activities across Mallorca'}</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{events.length}</Text>
                    <Text style={styles.heroStatLabel}>{t.events || 'Events'}</Text>
                  </View>
                  <View style={styles.heroStatDivider} />
                  <View style={styles.heroStat}>
                    <Text style={styles.heroStatValue}>{groups.length}</Text>
                    <Text style={styles.heroStatLabel}>{t.months || 'Months'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* CATEGORY FILTER */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, !category && styles.filterChipActive]}
                onPress={() => setCategory('')}
              >
                <Text style={[styles.filterChipText, !category && styles.filterChipTextActive]}>{t.all || 'All'}</Text>
              </TouchableOpacity>
              {EVENT_CATEGORIES.map(cat => {
                const catLabel = cat.label[language] || cat.label.en;
                const isActive = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setCategory(isActive ? '' : cat.id)}
                  >
                    <Text style={styles.filterChipEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{catLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>{t.noEvents || 'No events found'}</Text>
            <Text style={styles.emptySub}>{t.emptyEventsSub || 'Check back later for new events and offers'}</Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.monthHeader}>{group.month}</Text>
            {group.data.map(renderEvent)}
          </View>
        )}
      />

      {/* FAB */}
      {user && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-event')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
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
  // Month header
  monthHeader: {
    fontSize: 18, fontWeight: '700', color: '#0f172a',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 8,
  },
  // Card
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 16, marginBottom: 10, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
    ...shadows.md,
  },
  dateBadge: {
    width: 52, height: 58, borderRadius: 10,
    backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  dateDay: { fontSize: 22, fontWeight: '700', color: '#4f46e5', lineHeight: 26 },
  dateMonth: { fontSize: 11, fontWeight: '600', color: '#4f46e5', textTransform: 'uppercase' as const },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  cardLocation: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const },
  cardTime: { fontSize: 12, color: '#94a3b8' },
  cardPrice: { fontSize: 12, color: '#059669', fontWeight: '600' },
  cardRelWrap: { marginLeft: 'auto' as const },
  cardRel: { fontSize: 11, fontWeight: '600', color: '#94a3b8', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardRelToday: { color: '#dc2626', backgroundColor: '#fef2f2' },
  // Empty
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center',
    elevation: 8, ...shadows.lg,
  },
  fabText: { fontSize: 28, color: '#fff', fontWeight: '300', marginTop: -2 },
});
