import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations } from '../store/useStore';
import { categories } from '../utils/categories';

const languages = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { language, user, setLanguage } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [langOpen, setLangOpen] = useState(false);

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

  const currentLang = languages.find(l => l.code === language);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.langButton} onPress={() => setLangOpen(true)}>
              <Text style={styles.langButtonText}>{currentLang?.flag} {currentLang?.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(user ? '/profile' : '/login')}>
              <Text style={styles.headerLink}>{user ? '👤' : t.signIn}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.subtitle}>{t.subtitle}</Text>
      </View>

      <Modal visible={langOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangOpen(false)}>
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>{t.language}</Text>
            {languages.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langOption, language === l.code && styles.langOptionActive]}
                onPress={() => { setLanguage(l.code as 'es' | 'en' | 'de' | 'ru'); setLangOpen(false); }}
              >
                <Text style={styles.langOptionText}>{l.flag} {l.label}</Text>
                {language === l.code && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerLink: { color: '#fff', fontWeight: '500' },
  langButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  langButtonText: { color: '#fff', fontSize: 13 },
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
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  langModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', maxWidth: 320 },
  langModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  langOptionActive: { backgroundColor: '#eff6ff' },
  langOptionText: { fontSize: 16, flex: 1 },
  langCheck: { color: '#3b82f6', fontSize: 18, fontWeight: '700' },
});
