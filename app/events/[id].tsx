import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { MallorcaEvent } from '../../types';
import { useStore, translations } from '../../store/useStore';
import { shadows } from '../../utils/theme';

const GRADIENT_COLORS = ['#4f46e5', '#7c3aed', '#a855f7'];

const EVENT_CATEGORIES: Record<string, Record<string, string>> = {
  'food-drink': { en: 'Food & Drink', es: 'Comida y Bebida', de: 'Essen & Trinken', ru: 'Еда и напитки' },
  'events-parties': { en: 'Events & Parties', es: 'Eventos y Fiestas', de: 'Veranstaltungen & Partys', ru: 'Мероприятия и вечеринки' },
  'sports-fitness': { en: 'Sports & Fitness', es: 'Deportes y Fitness', de: 'Sport & Fitness', ru: 'Спорт и фитнес' },
  'tours-experiences': { en: 'Tours & Experiences', es: 'Tours y Experiencias', de: 'Touren & Erlebnisse', ru: 'Туры и впечатления' },
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const language = useStore((s) => s.language);
  const t = translations[language];
  const [event, setEvent] = useState<MallorcaEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getDoc(doc(collection(db, 'events'), id))
      .then((snap) => {
        if (snap.exists()) {
          setEvent({ id: snap.id, ...snap.data() } as MallorcaEvent);
        } else {
          setError(t.eventNotFound || 'Event not found');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : 'en-GB',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || t.eventNotFound || 'Event not found'}</Text>
      </View>
    );
  }

  const title = typeof event.title === 'string' ? event.title : (event.title as any)?.[language] || (event.title as any)?.en || '';
  const description = typeof event.description === 'string' ? event.description : (event.description as any)?.[language] || (event.description as any)?.en || '';

  const infoRows = [
    { label: t.startDate || 'Date', value: event.date ? formatDate(event.date) : null },
    { label: t.endDate || 'End Date', value: event.endDate ? formatDate(event.endDate) : null },
    { label: t.time || 'Time', value: event.time || null },
    { label: t.location || 'Location', value: event.location || event.area || null },
    { label: t.price || 'Price', value: event.price || null },
  ].filter(r => r.value);

  return (
    <>
      <Stack.Screen options={{ title: title.substring(0, 40), headerTintColor: '#fff', headerStyle: { backgroundColor: '#4f46e5' } }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* HERO */}
        <View style={styles.heroSmall}>
          <View style={styles.heroSmallBg}>
            {GRADIENT_COLORS.map((c, i) => (
              <View key={i} style={[styles.heroSmallBand, { backgroundColor: c, opacity: 1 - i * 0.15 }]} />
            ))}
          </View>
          <View style={styles.heroSmallContent}>
            <Text style={styles.heroSmallTagline}>
              {(event.category ? EVENT_CATEGORIES[event.category]?.[language] : null) || event.category?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || t.events || 'Event'}
            </Text>
            <Text style={styles.heroSmallTitle}>{title}</Text>
            <View style={styles.heroSmallDateRow}>
              <Text style={styles.heroSmallDate}>{event.date ? formatDate(event.date) : ''}</Text>
            </View>
          </View>
        </View>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoGrid}>
            {infoRows.map((row, i) => (
              <View key={i} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* DESCRIPTION */}
        {description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionSectionTitle}>{t.description || 'Description'}</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>
        ) : null}

        {/* BACK TO BUSINESS */}
        {event.businessId ? (
          <TouchableOpacity
            style={styles.businessLink}
            onPress={() => router.push(`/business/${event.businessId}`)}
          >
            <Text style={styles.businessLinkText}>
              {event.businessName ? `${t.view || 'View'} ${event.businessName}` : t.viewBusiness || 'View Business'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center', paddingHorizontal: 20 },
  // Hero
  heroSmall: { height: 200, position: 'relative', overflow: 'hidden' },
  heroSmallBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroSmallBand: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroSmallContent: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 56, zIndex: 5,
  },
  heroSmallTagline: {
    fontSize: 11, fontWeight: '700', color: '#c4b5fd', letterSpacing: 2,
    textTransform: 'uppercase' as const, marginBottom: 6,
  },
  heroSmallTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, lineHeight: 30 },
  heroSmallDateRow: { flexDirection: 'row', gap: 8 },
  heroSmallDate: { fontSize: 13, color: '#e0d7ff', fontWeight: '500' },
  // Info card
  infoCard: {
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: -20,
    borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', ...shadows.md,
  },
  infoGrid: {},
  infoRow: { padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontWeight: '500', color: '#0f172a', textAlign: 'right' as const, maxWidth: '60%' as any },
  // Description
  descriptionCard: {
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0', ...shadows.md,
  },
  descriptionSectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#4f46e5',
    textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10,
  },
  descriptionText: { fontSize: 15, color: '#334155', lineHeight: 24 },
  // Business link
  businessLink: {
    backgroundColor: '#4f46e5', marginHorizontal: 16, marginTop: 12,
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  businessLinkText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
