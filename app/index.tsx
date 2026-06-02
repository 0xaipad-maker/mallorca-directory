import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations, categoryTranslations } from '../store/useStore';
import { categories } from '../utils/categories';
import { areas } from '../utils/areas';
import MallorcaMap from '../components/MallorcaMap';

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
  const [areaCounts, setAreaCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const snap = await getDocs(collection(db, 'businesses'));
        const counts: Record<string, number> = {};
        snap.forEach(d => {
          const area = d.data().area || 'Other';
          counts[area] = (counts[area] || 0) + 1;
        });
        setAreaCounts(counts);
      } catch (e) { console.error(e); }
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, 'businesses'), where('name', '>=', searchQuery), where('name', '<=', searchQuery + '\uf8ff'));
        const snapshot = await getDocs(q);
        setSearchResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) { console.error('Search error:', e); }
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

        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={t.search}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.slice(0, 5).map((b) => (
                <TouchableOpacity key={b.id} style={styles.searchResultItem} onPress={() => router.push(`/business/${b.id}`)}>
                  <Text style={styles.searchResultName}>{b.name}</Text>
                  <Text style={styles.searchResultAddress}>{b.address}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <Modal visible={langOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangOpen(false)}>
          <View style={styles.langModal}>
            <Text style={styles.langModalTitle}>{t.language}</Text>
            {languages.map(l => (
              <TouchableOpacity key={l.code} style={[styles.langOption, language === l.code && styles.langOptionActive]}
                onPress={() => { setLanguage(l.code as 'es' | 'en' | 'de' | 'ru'); setLangOpen(false); }}>
                <Text style={styles.langOptionText}>{l.flag} {l.label}</Text>
                {language === l.code && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <MallorcaMap height={220} style={styles.map} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.areas}</Text>
          <View style={styles.areaGrid}>
            {areas.map(area => {
              const count = areaCounts[area.name] || 0;
              return (
                <TouchableOpacity key={area.id} style={styles.areaCard} onPress={() => router.push(`/area/${area.id}`)}>
                  <Text style={styles.areaEmoji}>{area.emoji}</Text>
                  <Text style={styles.areaName} numberOfLines={1}>{area.name}</Text>
                  {count > 0 && <Text style={styles.areaCount}>{count} {t.businesses?.toLowerCase() || 'places'}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.categories}</Text>
          <View style={styles.categoriesGrid}>
            {categories.map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.categoryItem, { backgroundColor: cat.color }]}
                onPress={() => router.push(`/list?category=${cat.id}`)}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryName}>{categoryTranslations[language][cat.id] || cat.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#1e40af', padding: 16, paddingTop: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerLink: { color: '#fff', fontWeight: '500' },
  langButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  langButtonText: { color: '#fff', fontSize: 13 },
  subtitle: { color: '#93c5fd', marginBottom: 8 },
  searchWrap: { position: 'relative', zIndex: 10 },
  searchInput: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, color: '#1e293b', elevation: 2 },
  searchResults: { marginTop: 4, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 4 },
  searchResultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchResultName: { fontWeight: '600' },
  searchResultAddress: { color: '#64748b', fontSize: 13 },
  body: { flex: 1 },
  map: { marginHorizontal: 16, marginTop: 16 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  areaCard: { width: '30.5%', backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  areaEmoji: { fontSize: 28, marginBottom: 4 },
  areaName: { fontSize: 12, fontWeight: '600', color: '#1e293b', textAlign: 'center' },
  areaCount: { fontSize: 11, color: '#64748b', marginTop: 2 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryItem: { width: '48%', padding: 16, borderRadius: 14, marginBottom: 12, alignItems: 'center', elevation: 1 },
  categoryEmoji: { fontSize: 28, marginBottom: 6 },
  categoryName: { fontWeight: '600', textAlign: 'center', color: '#1e293b' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  langModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', maxWidth: 320 },
  langModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  langOptionActive: { backgroundColor: '#eff6ff' },
  langOptionText: { fontSize: 16, flex: 1 },
  langCheck: { color: '#3b82f6', fontSize: 18, fontWeight: '700' },
});
