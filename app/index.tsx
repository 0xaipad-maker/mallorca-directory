import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations } from '../store/useStore';
import { categories } from '../utils/categories';

export default function HomeScreen() {
  const router = useRouter();
  const { language, user } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const q = query(
          collection(db, 'businesses'),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff')
        );
        const snapshot = await getDocs(q);
        setSearchResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) {
        console.error('Search error:', e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.title}</Text>
          <TouchableOpacity onPress={() => router.push(user ? '/profile' : '/login')}>
            <Text style={styles.headerLink}>{user ? '👤' : t.signIn}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.search}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.slice(0, 5).map((b) => (
              <TouchableOpacity
                key={b.id}
                style={styles.searchResultItem}
                onPress={() => router.push(`/business/${b.id}`)}
              >
                <Text style={styles.searchResultName}>{b.name}</Text>
                <Text style={styles.searchResultAddress}>{b.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.categoriesContainer}>
        <Text style={styles.categoriesTitle}>{t.categories}</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => router.push(`/list?category=${cat.id}`)}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryName}>{categoryTranslations[language][cat.id] || cat.id}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#3b82f6', padding: 16, paddingTop: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerLink: { color: '#fff', fontWeight: '500' },
  subtitle: { color: '#bfdbfe' },
  searchContainer: { padding: 16 },
  searchInput: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12 },
  searchResults: { marginTop: 8, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  searchResultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  searchResultName: { fontWeight: '500' },
  searchResultAddress: { color: '#6b7280', fontSize: 13 },
  categoriesContainer: { flex: 1, paddingHorizontal: 16 },
  categoriesTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryItem: { width: '48%', backgroundColor: '#f9fafb', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center' },
  categoryEmoji: { fontSize: 32, marginBottom: 8 },
  categoryName: { fontWeight: '500', textAlign: 'center' },
});
