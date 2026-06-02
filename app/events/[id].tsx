import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { MallorcaEvent } from '../../types';
import { useStore, translations } from '../../store/useStore';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const language = useStore((s) => s.language);
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
          setError('Event not found');
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const t = translations[language];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: t === translations.en ? 'Event' : t.event || 'Event' }} />
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
      </View>
    );
  }

  const description = event.description?.[language] || event.description?.en || '';

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>{t.date || 'Date'}</Text>
          <Text style={styles.value}>
            {event.date ? formatDate(event.date) : '—'}
            {event.endDate ? ` — ${formatDate(event.endDate)}` : ''}
          </Text>
        </View>

        {event.time ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t.time || 'Time'}</Text>
            <Text style={styles.value}>{event.time}</Text>
          </View>
        ) : null}

        {event.location || event.area ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t.location || 'Location'}</Text>
            <Text style={styles.value}>
              {[event.location, event.area].filter(Boolean).join(', ')}
            </Text>
          </View>
        ) : null}

        {event.price ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t.price || 'Price'}</Text>
            <Text style={styles.value}>{event.price}</Text>
          </View>
        ) : null}

        {description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>{t.description || 'Description'}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        ) : null}

        {event.businessId ? (
          <TouchableOpacity
            style={styles.businessLink}
            onPress={() => router.push(`/business/${event.businessId}`)}
          >
            <Text style={styles.businessLinkText}>
              {t.viewBusiness || 'View Business'}
              {event.businessName ? ` — ${event.businessName}` : ''}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 24,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: '#1e293b',
  },
  descriptionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  businessLink: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  businessLinkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
