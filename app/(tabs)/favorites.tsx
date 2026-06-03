import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations } from '../../store/useStore';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, language } = useStore();
  const t = translations[language];
  const [favBusinesses, setFavBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setFavBusinesses([]);
      try {
        if (favorites.length === 0) { setLoading(false); return; }
        const results: Business[] = [];
        for (const id of favorites) {
          const snap = await getDoc(doc(db, 'businesses', id));
          if (snap.exists()) {
            results.push({ id: snap.id, ...snap.data() } as Business);
          }
        }
        setFavBusinesses(results);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, [favorites]);

  const renderFavItem = ({ item }: { item: Business }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/business/${item.id}`)}>
      <View style={styles.cardEmoji}>
        <Text style={styles.cardEmojiText}>📍</Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardAddress}>{item.address}</Text>
        {item.rating && (
          <View style={styles.cardRating}>
            <Text style={styles.ratingStar}>⭐</Text>
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={styles.loading} />;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>⭐</Text>
        <Text style={styles.heroTitle}>{t.favorites || 'Favorites'}</Text>
        <Text style={styles.heroSub}>{favorites.length} {t.savedPlaces || 'saved places'}</Text>
      </View>
      {favBusinesses.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>💫</Text>
          <Text style={styles.emptyTitle}>{t.noFavorites || 'No favorites yet'}</Text>
          <Text style={styles.emptySub}>{t.noFavoritesSub || 'Start exploring and save your favorite places'}</Text>
        </View>
      ) : (
        <FlatList
          data={favBusinesses}
          keyExtractor={item => item.id}
          renderItem={renderFavItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 28 },
  heroIcon: { fontSize: 36, marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 14, color: '#c4b5fd', marginTop: 4 },
  loading: { marginTop: 60 },
  list: { padding: 16, paddingTop: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: '#e2e8f0', elevation: 2,
  },
  cardEmoji: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardEmojiText: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  cardAddress: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStar: { fontSize: 11 },
  ratingText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
});
