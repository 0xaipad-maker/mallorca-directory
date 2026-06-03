// Modern Mallorca Directory homepage inspired by mallorca-map.com
import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Platform, Dimensions, Animated, Image } from 'react-native';
import { useRef, useEffect, useState, useCallback } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations, categoryTranslations } from '../../store/useStore';
import { categories } from '../../utils/categories';
import { areas } from '../../utils/areas';
import { colors as themeColors, spacing, borderRadius, typography, shadows as themeShadows } from '../../utils/theme';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const GRADIENT_COLORS = ['#4f46e5', '#7c3aed', '#a855f7'];

export default function HomeScreen() {
  const router = useRouter();
  const { language, user, recentlyViewed, setLanguage } = useStore();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [popularBusinesses, setPopularBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState({ entities: 0, events: 0, reviews: 0 });
  const [langOpen, setLangOpen] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [recentBusinesses, setRecentBusinesses] = useState<Business[]>([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch real data from Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'businesses'));
        const businesses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
        setPopularBusinesses(businesses.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10));
        setStats(prev => ({ ...prev, entities: businesses.length }));
        const counts: Record<string, number> = {};
        businesses.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });
        setCategoryCounts(counts);
        const eventSnap = await getDocs(collection(db, 'events'));
        setStats(prev => ({ ...prev, events: eventSnap.size }));
      } catch (e) { console.error(e); }
    })();
  }, []);

  // Load recently viewed businesses
  useEffect(() => {
    if (recentlyViewed.length === 0) { setRecentBusinesses([]); return; }
    (async () => {
      try {
        const results: Business[] = [];
        for (const id of recentlyViewed.slice(0, 8)) {
          const snap = await getDoc(doc(db, 'businesses', id));
          if (snap.exists()) results.push({ id: snap.id, ...snap.data() } as Business);
        }
        setRecentBusinesses(results);
      } catch {}
    })();
  }, [recentlyViewed.join(',')]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const all = await getDocs(collection(db, 'businesses'));
        const q = searchQuery.toLowerCase();
        setSearchResults(all.docs
          .map(d => ({ id: d.id, ...d.data() } as Business))
          .filter(b => b.name?.toLowerCase().includes(q))
          .slice(0, 8));
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* HERO SECTION */}
        <View style={styles.hero}>
          <View style={styles.heroBg}>
            {GRADIENT_COLORS.map((c, i) => (
              <View key={i} style={[styles.heroGradientBand, { backgroundColor: c, opacity: 1 - i * 0.15, height: 280 - i * 20 }]} />
            ))}
          </View>

          {/* Header row: logo + lang + add */}
          <View style={styles.headerRow}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>🏝️</Text>
              <View>
                <Text style={styles.logoTitle}>Mallorca</Text>
                <Text style={styles.logoSub}>Directory</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-business')}>
                <Text style={styles.addBtnText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langBtn} onPress={() => setLangOpen(true)}>
                <Text style={styles.langBtnText}>{currentLang.flag}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero content */}
          <View style={styles.heroContent}>
            <Text style={styles.heroTagline}>YOUR ISLAND APP</Text>
            <Text style={styles.heroTitle}>{t.discoverMallorca || 'Discover Mallorca'}</Text>
            <Text style={styles.heroSub}>{t.homeSubtitle || 'Find events, restaurants, tours and trusted services in Mallorca in one place.'}</Text>

            {/* Date range selector */}
            <View style={styles.dateRow}>
              <View style={styles.dateInput}>
                <Text style={styles.datePlaceholder}>{t.selectDateRange || 'Select date range'}</Text>
              </View>
              <TouchableOpacity style={styles.searchBtn}>
                <Text style={styles.searchBtnText}>🔍</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
              <TextInput
                style={styles.searchInput}
                placeholder={t.search}
                placeholderTextColor="#a5b4fc"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => router.push('/search')}
              />
              {searchResults.length > 0 && (
                <View style={styles.searchDropdown}>
                  {searchResults.map(b => (
                    <TouchableOpacity key={b.id} style={styles.searchItem} onPress={() => { setSearchQuery(''); router.push(`/business/${b.id}`); }}>
                      <Text style={styles.searchItemName}>{b.name}</Text>
                      <Text style={styles.searchItemAddr}>{b.address}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* STATS BAR */}
        <View style={styles.statsBar}>
          {[
            { value: (stats.entities || 908).toLocaleString(), label: t.entities || 'Entities' },
            { value: (stats.events || 0).toLocaleString(), label: t.events || 'Events' },
            { value: ((stats.entities || 908) + (stats.events || 0)).toLocaleString(), label: t.totalEntries || 'Total entries' },
            { value: '0', label: t.reviews || 'Reviews' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* CATEGORIES SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.popularCategories || 'Popular Categories'}</Text>
          <Text style={styles.sectionSub}>{t.popularCategoriesSub || 'Discover the most popular categories in Mallorca'}</Text>
          <View style={styles.categoriesGrid}>
            {categories.map(cat => {
              const count = categoryCounts[cat.id] || 0;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryCard}
                  onPress={() => router.push(`/list?category=${cat.id}`)}
                >
                  <View style={[styles.categoryEmojiWrap, { backgroundColor: cat.color + '20' }]}>
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  </View>
                  <Text style={styles.categoryName} numberOfLines={1}>{categoryTranslations[language][cat.id] || cat.name}</Text>
                  <Text style={styles.categoryCount}>{count} {t.entries || 'Entries'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PREMIUM PARTNERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.premiumPartners || 'Premium Partners'}</Text>
            <TouchableOpacity onPress={() => router.push('/list?premium=true')}>
              <Text style={styles.viewAll}>{t.viewAll || 'View all'} →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.premiumRow}>
            {popularBusinesses.slice(0, 6).map(b => (
              <TouchableOpacity key={b.id} style={styles.premiumCard} onPress={() => router.push(`/business/${b.id}`)}>
                <View style={styles.premiumCardTop}>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>⭐ {t.premium || 'Premium'}</Text>
                  </View>
                  <View style={styles.premiumEmojiWrap}>
                    <Text style={styles.premiumEmoji}>{categories.find(c => c.id === b.category)?.emoji || '📍'}</Text>
                  </View>
                </View>
                <Text style={styles.premiumName} numberOfLines={1}>{b.name}</Text>
                <View style={styles.premiumRatingRow}>
                  <Text style={styles.premiumRating}>★ {b.rating?.toFixed(1) || '—'}</Text>
                  <Text style={styles.premiumCat}>{categoryTranslations[language][b.category] || b.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* RECENTLY VIEWED */}
        {recentBusinesses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t.recentlyViewed || 'Recently Viewed'}</Text>
              <TouchableOpacity onPress={() => router.push('/search')}>
                <Text style={styles.viewAll}>{t.viewAll || 'View all'} →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.premiumRow}>
              {recentBusinesses.map(b => {
                const bCat = categories.find(c => c.id === b.category);
                return (
                  <TouchableOpacity key={b.id} style={styles.recentCard} onPress={() => router.push(`/business/${b.id}`)}>
                    <View style={[styles.recentEmojiWrap, { backgroundColor: bCat?.color || '#f1f5f9' }]}>
                      <Text style={styles.recentEmoji}>{bCat?.emoji || '📍'}</Text>
                    </View>
                    <Text style={styles.recentName} numberOfLines={1}>{b.name}</Text>
                    {b.rating && <Text style={styles.recentRating}>★ {b.rating.toFixed(1)}</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* TRIP PLANNER CTA */}
        <View style={styles.plannerCta}>
          <View style={styles.plannerCtaBg}>
            <Text style={styles.plannerCtaIcon}>📅</Text>
            <Text style={styles.plannerCtaTitle}>{t.plannerCtaTitle || 'Mallorca Trip & Activity Planner'}</Text>
            <Text style={styles.plannerCtaSub}>{t.plannerCtaSub || 'Plan your Mallorca days like a calendar — add real events & places, create your own slots, and share it as a calendar subscription.'}</Text>
            <TouchableOpacity style={styles.plannerCtaBtn} onPress={() => router.push('/trip-planner')}>
              <Text style={styles.plannerCtaBtnText}>{t.tryItFree || 'Try it free'} →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AREAS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.exploreByArea || 'Explore by Area'}</Text>
          <View style={styles.areasGrid}>
            {areas.slice(0, 8).map(area => (
              <TouchableOpacity key={area.id} style={styles.areaCard} onPress={() => router.push(`/list?area=${area.id}`)}>
                <Text style={styles.areaEmoji}>{area.emoji}</Text>
                <Text style={styles.areaName}>{area.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FOOTER — mallorca-map.com style */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View style={styles.footerBrand}>
              <View style={styles.footerLogo}>
                <Text style={styles.footerLogoIcon}>🏝️</Text>
                <View>
                  <Text style={styles.footerLogoText}>{t.title || 'Mallorca Directory'}</Text>
                  <Text style={styles.footerTagline}>{t.footerTagline || 'Your comprehensive guide to Mallorca'}</Text>
                </View>
              </View>
              <Text style={styles.footerAppText}>{t.footerApp || 'Also as an app'}</Text>
              <View style={styles.footerAppBtns}>
                <View style={styles.footerAppBtn}><Text style={styles.footerAppBtnText}>📱 {t.footerAppStore || 'App Store'}</Text></View>
                <View style={styles.footerAppBtn}><Text style={styles.footerAppBtnText}>📱 {t.footerGooglePlay || 'Google Play'}</Text></View>
              </View>
            </View>

            <View style={styles.footerColumns}>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>{t.categories || 'Categories'}</Text>
                {categories.slice(0, 7).map(cat => (
                  <TouchableOpacity key={cat.id} onPress={() => router.push(`/list?category=${cat.id}`)}>
                    <Text style={styles.footerLink}>{categoryTranslations[language]?.[cat.id] || cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>{t.guides || 'Guides'}</Text>
                <TouchableOpacity onPress={() => router.push('/guides/long-term-rentals-mallorca')}><Text style={styles.footerLink}>{t.footerMoving || 'Moving to Mallorca'}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/guides/formentor-2026')}><Text style={styles.footerLink}>{t.footerFormentor || 'Formentor 2026'}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/guides/mallorca-tourist-tax-2026')}><Text style={styles.footerLink}>{t.footerTax || 'Tourist Tax'}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/guides/traffic-fines-mallorca')}><Text style={styles.footerLink}>{t.footerCar || 'Traffic Fines'}</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/guides/nie-number-mallorca')}><Text style={styles.footerLink}>{t.footerNIE || 'NIE Number'}</Text></TouchableOpacity>
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerColTitle}>{t.premium || 'Premium'}</Text>
                <TouchableOpacity onPress={() => router.push('/add-business')}><Text style={styles.footerLink}>{t.addBusiness || 'Add Business'}</Text></TouchableOpacity>
                <TouchableOpacity><Text style={styles.footerLink}>{t.claim || 'Claim Listing'}</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.footerBottom}>
              <View style={styles.footerLegal}>
                <TouchableOpacity><Text style={styles.footerLegalLink}>{t.privacy || 'Privacy'}</Text></TouchableOpacity>
                <Text style={styles.footerLegalSep}>·</Text>
                <TouchableOpacity><Text style={styles.footerLegalLink}>{t.help || 'Contact'}</Text></TouchableOpacity>
                <Text style={styles.footerLegalSep}>·</Text>
                <TouchableOpacity><Text style={styles.footerLegalLink}>{t.footerImprint || 'Imprint'}</Text></TouchableOpacity>
              </View>
              <Text style={styles.footerCopy}>© 2026 Mallorca Directory. {t.footerCopyright || 'All rights reserved'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Language Modal */}
      {langOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.langModal}>
            <View style={styles.langModalHeader}>
              <Text style={styles.langModalTitle}>{t.language || 'Language'}</Text>
              <TouchableOpacity onPress={() => setLangOpen(false)}>
                <Text style={styles.langModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[styles.langOption, language === l.code && styles.langOptionActive]}
                onPress={() => { setLanguage(l.code as 'es' | 'en' | 'de' | 'ru'); setLangOpen(false); }}
              >
                <Text style={styles.langOptionFlag}>{l.flag}</Text>
                <Text style={styles.langOptionLabel}>{l.label}</Text>
                {language === l.code && <Text style={styles.langCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  hero: { height: 380, position: 'relative', overflow: 'hidden' },
  heroBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroGradientBand: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 16 : 48, zIndex: 10,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon: { fontSize: 28 },
  logoTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  logoSub: { fontSize: 11, fontWeight: '600', color: '#c4b5fd', letterSpacing: 1, marginTop: -2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  addBtnText: { fontSize: 20, color: '#fff', fontWeight: '300', marginTop: -2 },
  langBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  langBtnText: { fontSize: 16 },
  heroContent: { paddingHorizontal: 20, paddingTop: 24, zIndex: 5 },
  heroTagline: { fontSize: 11, fontWeight: '700', color: '#c4b5fd', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 14, fontWeight: '400', color: '#e0d7ff', lineHeight: 20, marginBottom: 20, maxWidth: 340 },
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dateInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  datePlaceholder: { fontSize: 13, color: '#a5b4fc' },
  searchBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  searchBtnText: { fontSize: 20 },
  searchWrap: { position: 'relative', zIndex: 20 },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 14, fontSize: 15, color: '#1e293b' },
  searchDropdown: { marginTop: 4, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 8 },
  searchItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchItemName: { fontWeight: '600', color: '#1e293b', fontSize: 14 },
  searchItemAddr: { color: '#64748b', fontSize: 12, marginTop: 2 },
  statsBar: {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -24, borderRadius: 16,
    paddingVertical: 16, elevation: 4, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 10,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#4f46e5' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  sectionSub: { fontSize: 13, color: '#94a3b8', marginTop: 2, marginBottom: 16 },
  viewAll: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryCard: {
    width: CARD_W, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  categoryEmojiWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  categoryEmoji: { fontSize: 22 },
  categoryName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  categoryCount: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  premiumRow: { gap: 12, paddingRight: 16, paddingTop: 12 },
  premiumCard: {
    width: 180, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#e2e8f0', elevation: 2,
  },
  premiumCardTop: { height: 100, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  premiumBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#f59e0b', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, zIndex: 2 },
  premiumBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  premiumEmojiWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  premiumEmoji: { fontSize: 28 },
  premiumName: { fontSize: 13, fontWeight: '600', color: '#0f172a', paddingHorizontal: 10, marginTop: 8 },
  premiumRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingBottom: 10, marginTop: 4 },
  premiumRating: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },
  premiumCat: { fontSize: 11, color: '#94a3b8' },
  recentCard: { width: 100, backgroundColor: '#fff', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  recentEmojiWrap: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  recentEmoji: { fontSize: 22 },
  recentName: { fontSize: 12, fontWeight: '600', color: '#0f172a', textAlign: 'center', marginBottom: 2 },
  recentRating: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  plannerCta: { paddingHorizontal: 16, marginTop: 28 },
  plannerCtaBg: {
    backgroundColor: '#4f46e5', borderRadius: 16, padding: 24, alignItems: 'center',
  },
  plannerCtaIcon: { fontSize: 40, marginBottom: 8 },
  plannerCtaTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 8 },
  plannerCtaSub: { fontSize: 13, color: '#c4b5fd', textAlign: 'center', lineHeight: 18, marginBottom: 16, maxWidth: 300 },
  plannerCtaBtn: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  plannerCtaBtnText: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  areasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  areaCard: {
    width: CARD_W, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0',
  },
  areaEmoji: { fontSize: 24 },
  areaName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  footer: { backgroundColor: '#0f172a', paddingTop: 32, marginTop: 32 },
  footerInner: { paddingHorizontal: 24, paddingBottom: 48 },
  footerBrand: { marginBottom: 28 },
  footerLogo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  footerLogoIcon: { fontSize: 28 },
  footerLogoText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  footerTagline: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  footerAppText: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  footerAppBtns: { flexDirection: 'row', gap: 8 },
  footerAppBtn: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#334155' },
  footerAppBtnText: { fontSize: 12, fontWeight: '600', color: '#e2e8f0' },
  footerColumns: { flexDirection: 'row', gap: 24, marginBottom: 28 },
  footerCol: { flex: 1 },
  footerColTitle: { fontSize: 11, fontWeight: '700', color: '#fff', marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: 1 },
  footerLink: { fontSize: 12, color: '#94a3b8', marginBottom: 7, lineHeight: 16 },
  footerBottom: { borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 16 },
  footerLegal: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  footerLegalLink: { fontSize: 12, color: '#64748b' },
  footerLegalSep: { fontSize: 12, color: '#334155' },
  footerCopy: { fontSize: 11, color: '#475569' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 },
  langModal: { backgroundColor: '#fff', borderRadius: 16, width: '80%', maxWidth: 320, overflow: 'hidden' },
  langModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  langModalTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  langModalClose: { fontSize: 18, color: '#94a3b8' },
  langOption: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  langOptionActive: { backgroundColor: '#eef2ff' },
  langOptionFlag: { fontSize: 20, marginRight: 10 },
  langOptionLabel: { fontSize: 15, color: '#0f172a', flex: 1 },
  langCheck: { color: '#4f46e5', fontSize: 16, fontWeight: '700' },
});
