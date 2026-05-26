import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations } from '../store/useStore';

export default function ListScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const catName = category ? categoryTranslations[language]?.[category] || category : '';
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'businesses'), where('category', '==', category));
        const snapshot = await getDocs(q);
        setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [category]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: catName || 'Businesses' }} />
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : (
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t.noBusinessesInCategory}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemName: { fontWeight: '600', fontSize: 18 },
  itemAddress: { color: '#4b5563' },
  itemRating: { color: '#ca8a04' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#6b7280' },
});
