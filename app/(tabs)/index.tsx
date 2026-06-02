import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform, Dimensions, Modal } from 'react-native';
import { useRef, useEffect, useState } from 'react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations, categoryTranslations } from '../../store/useStore';
import { categories } from '../../utils/categories';
import { areas } from '../../utils/areas';

const { width } = Dimensions.get('window');
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
  const [popularBusinesses, setPopularBusinesses] = useState<Business[]>([]);
  const [areaBusinessCounts, setAreaBusinessCounts] = useState<Record<string, number>>({});
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !mapRef.current) return;
    const el = mapRef.current;
    if (el.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.openstreetmap.org/export/embed.html?bbox=2.2%2C39.2%2C3.6%2C40.1&layer=mapnik';
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.allowFullscreen = true;
    iframe.title = 'Mallorca Map';
    el.appendChild(iframe);
  }, []);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const snap = await getDocs(collection(db, 'businesses'));
        const businesses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
        const sorted = businesses.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setPopularBusinesses(sorted.slice(0, 10));
        const counts: Record<string, number> = {};
        businesses.forEach(b => {
          const area = b.area || 'Other';
          counts[area] = (counts[area] || 0) + 1;
        });
        setAreaBusinessCounts(counts);
      } catch (e) { console.error(e); }
    };
    fetchPopular();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const q = query(collection(db, 'businesses'), where('name', '>=', searchQuery), where('name', '<=', searchQuery + '\uf8ff'));
        const snapshot = await getDocs(q);
        setSearchResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const currentLang = languages.find(l => l.code === language);

  return (
    <View style={styles.container}>
      <View style={styles.mapWrapper}>
        <View ref={mapRef} style={styles.map} />
        <View style={styles.headerOverlay}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Mallorca Directory</Text>
            <TouchableOpacity style={styles.langButton} onPress={() => setLangOpen(true)}>
              <Text style={styles.langButtonText}>{currentLang?.flag} {currentLang?.label}</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.categories}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {categories.slice(0, 6).map(cat => (
              <TouchableOpacity key={cat.id} style={[styles.categoryPill, { backgroundColor: cat.color }]}
                onPress={() => router.push(`/list?category=${cat.id}`)}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryName}>{categoryTranslations[language][cat.id] || cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {popularBusinesses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular places</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularRow}>
              {popularBusinesses.map(b => (
                <TouchableOpacity key={b.id} style={styles.businessCard}
                  onPress={() => router.push(`/business/${b.id}`)}>
                  <View style={styles.businessCardTop}>
                    <Text style={styles.businessCardEmoji}>
                      {categories.find(c => c.id === b.category)?.emoji || '📍'}
                    </Text>
                  </View>
                  <Text style={styles.businessCardName} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.businessCardAddress} numberOfLines={1}>{b.address}</Text>
                  {b.rating && (
                    <View style={styles.businessCardRating}>
                      <Text style={styles.ratingStar}>⭐</Text>
                      <Text style={styles.ratingText}>{b.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby</Text>
          <View style={styles.areaRow}>
            {areas.slice(0, 8).map(area => {
              const count = areaBusinessCounts[area.id] || 0;
              return (
                <TouchableOpacity key={area.id} style={styles.areaPill}
                  onPress={() => router.push(`/area/${area.id}`)}>
                  <Text style={styles.areaPillEmoji}>{area.emoji}</Text>
                  <View style={styles.areaPillTextWrap}>
                    <Text style={styles.areaPillName}>{area.name}</Text>
                    {count > 0 && <Text style={styles.areaPillCount}>{count} places</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  mapWrapper: { height: 280, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject, backgroundColor: '#e2e8f0' },
  headerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'web' ? 16 : 48,
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  langButton: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  langButtonText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  searchWrap: { position: 'relative', zIndex: 10 },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12,
    fontSize: 15, color: '#1e293b',
  },
  searchResults: { marginTop: 4, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 4 },
  searchResultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchResultName: { fontWeight: '600', color: '#1e293b' },
  searchResultAddress: { color: '#64748b', fontSize: 13 },
  body: { flex: 1 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  categoriesRow: { gap: 10, paddingRight: 16 },
  categoryPill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 1,
  },
  categoryEmoji: { fontSize: 20 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  popularRow: { gap: 12, paddingRight: 16 },
  businessCard: {
    width: 160, backgroundColor: '#fff', borderRadius: 14, padding: 12,
    elevation: 2, borderWidth: 1, borderColor: '#e2e8f0',
  },
  businessCardTop: { height: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  businessCardEmoji: { fontSize: 32 },
  businessCardName: { fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 2 },
  businessCardAddress: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  businessCardRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingStar: { fontSize: 12 },
  ratingText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  areaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  areaPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
    borderWidth: 1, borderColor: '#e2e8f0', gap: 8, elevation: 1, width: '48%',
  },
  areaPillEmoji: { fontSize: 20 },
  areaPillTextWrap: { flex: 1 },
  areaPillName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  areaPillCount: { fontSize: 11, color: '#64748b', marginTop: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  langModal: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '80%', maxWidth: 320 },
  langModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  langOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  langOptionActive: { backgroundColor: '#eff6ff' },
  langOptionText: { fontSize: 16, flex: 1 },
  langCheck: { color: '#3b82f6', fontSize: 18, fontWeight: '700' },
});
