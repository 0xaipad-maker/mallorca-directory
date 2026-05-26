import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations } from '../store/useStore';

export default function FavoritesScreen() {
  const { favorites, language } = useStore();
  const t = translations[language];
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (favorites.length === 0) {
        setBusinesses([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const results: Business[] = [];
        for (const id of favorites) {
          const q = query(collection(db, 'businesses'), where('__name__', '==', id));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            results.push({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Business);
          }
        }
        setBusinesses(results);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [favorites]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{t.noBusinesses}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={businesses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/business/${item.id}`)}
          >
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemAddress}>{item.address}</Text>
            {item.rating && <Text style={styles.itemRating}>★ {item.rating}</Text>}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  emptyText: { color: '#6b7280', textAlign: 'center' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemName: { fontWeight: '600', fontSize: 18 },
  itemAddress: { color: '#4b5563' },
  itemRating: { color: '#ca8a04' },
});
