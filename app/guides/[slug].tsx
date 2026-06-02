import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Guide } from '../../types';
import { useStore, translations } from '../../store/useStore';

export default function GuideDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!guide) {
    return (
      <View style={styles.centered}>
        <Text>{t.guideNotFound || 'Guide not found'}</Text>
      </View>
    );
  }

  const title = language === 'de' ? guide.titleDe : guide.title;
  const content = language === 'de' ? guide.contentDe : guide.content;

  return (
    <>
      <Stack.Screen options={{ title: title || guide.title }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title || guide.title}</Text>
        {guide.author && <Text style={styles.author}>{t.by} {guide.author}</Text>}
        {guide.createdAt && (
          <Text style={styles.date}>
            {guide.createdAt?.toDate?.().toLocaleDateString() || guide.createdAt}
          </Text>
        )}
        <View style={styles.divider} />
        <Text style={styles.body}>{content || guide.content}</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});
