import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Guide } from '../../types';
import { useStore, translations } from '../../store/useStore';
import { shadows } from '../../utils/theme';

const GRADIENT_COLORS = ['#4f46e5', '#7c3aed', '#a855f7'];

const GUIDE_CATEGORIES: Record<string, { label: Record<string, string>; emoji: string }> = {
  living: { label: { en: 'Living', es: 'Vivir', de: 'Leben', ru: 'Жизнь' }, emoji: '🏠' },
  travel: { label: { en: 'Travel', es: 'Viajes', de: 'Reisen', ru: 'Путешествия' }, emoji: '✈️' },
  lifestyle: { label: { en: 'Lifestyle', es: 'Estilo de Vida', de: 'Lebensstil', ru: 'Образ жизни' }, emoji: '🌟' },
};

function formatDate(dateStr: string | undefined, lang: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(
    lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : lang === 'ru' ? 'ru-RU' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
}

export default function GuideDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const language = useStore((s) => s.language);
  const t = translations[language];
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const q = query(collection(db, 'guides'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setGuide({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Guide);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuide();
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!guide) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>{t.guideNotFound || 'Guide not found'}</Text>
      </View>
    );
  }

  const cat = GUIDE_CATEGORIES[guide.category];
  const title = guide.title?.[language] || guide.title?.en || '';
  const content = guide.content?.[language] || guide.content?.en || '';

  return (
    <>
      <Stack.Screen options={{ title: title.substring(0, 40), headerTintColor: '#fff', headerStyle: { backgroundColor: '#4f46e5' } }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.heroSmall}>
          <View style={styles.heroSmallBg}>
            {GRADIENT_COLORS.map((c, i) => (
              <View key={i} style={[styles.heroSmallBand, { backgroundColor: c, opacity: 1 - i * 0.15 }]} />
            ))}
          </View>
          <View style={styles.heroSmallContent}>
            <View style={styles.heroSmallBadge}>
              <Text style={styles.heroSmallBadgeText}>
                {cat?.emoji} {cat?.label?.[language] || cat?.label?.en || guide.category}
              </Text>
            </View>
            <Text style={styles.heroSmallTitle}>{title}</Text>
            <View style={styles.heroSmallMeta}>
              {guide.readTime ? (
                <Text style={styles.heroSmallMetaItem}>{guide.readTime} {t.read || 'read'}</Text>
              ) : null}
              <Text style={styles.heroSmallMetaItem}>
                {formatDate(guide.publishedAt, language)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyCard}>
          <Text style={styles.bodyText}>{content}</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
  notFound: { fontSize: 16, color: '#64748b' },
  // Hero
  heroSmall: { height: 200, position: 'relative', overflow: 'hidden' },
  heroSmallBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroSmallBand: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroSmallContent: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 56, zIndex: 5,
  },
  heroSmallBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  heroSmallBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  heroSmallTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, lineHeight: 30 },
  heroSmallMeta: { flexDirection: 'row', gap: 12 },
  heroSmallMetaItem: { fontSize: 12, color: '#c4b5fd', fontWeight: '500' },
  // Body
  bodyCard: {
    backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 16, marginTop: -20, padding: 20,
    borderWidth: 1, borderColor: '#e2e8f0', ...shadows.md,
  },
  bodyText: {
    fontSize: 15, color: '#334155', lineHeight: 24,
  },
});
