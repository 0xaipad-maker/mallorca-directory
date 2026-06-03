import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations } from '../../store/useStore';

interface ReviewData {
  id: string; businessId: string; rating: number; text: string; createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { language, setLanguage, user, setUser, favorites, tripPlans } = useStore();
  const t = translations[language];
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [myReviews, setMyReviews] = useState<ReviewData[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  useEffect(() => {
    if (!user) { setMyBusinesses([]); setMyReviews([]); return; }
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [bizSnap, revSnap] = await Promise.all([
          getDocs(query(collection(db, 'businesses'), where('claimedBy', '==', user.uid))),
          getDocs(query(collection(db, 'reviews'), where('userId', '==', user.uid))),
        ]);
        setMyBusinesses(bizSnap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
        setMyReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() }) as ReviewData));
      } catch (e) { console.error(e); }
      setLoadingData(false);
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    router.replace('/');
  };

  const planCount = tripPlans.reduce((sum, p) => sum + p.days.length, 0);

  const renderStars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        {user ? (
          <View style={styles.heroContent}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user.displayName || user.email || '?')[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.userName}>{user.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        ) : (
          <View style={styles.heroContent}>
            <Text style={styles.heroIcon}>👤</Text>
            <Text style={styles.heroTitle}>{t.profile || 'Profile'}</Text>
            <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/login')}>
              <Text style={styles.signInBtnText}>{t.signIn || 'Sign In'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {user && (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { value: favorites.length, label: t.favorites || 'Favorites', icon: '⭐' },
              { value: myReviews.length, label: t.reviews || 'Reviews', icon: '💬' },
              { value: planCount, label: t.plannedDays2 || 'Planned', icon: '📅' },
              { value: myBusinesses.length, label: t.myBusinesses || 'My Places', icon: '🏪' },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <Text style={styles.statIcon}>{s.icon}</Text>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* My Reviews */}
          {myReviews.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t.myReviews || 'My Reviews'}</Text>
              {myReviews.slice(0, 5).map(r => (
                <View key={r.id} style={styles.reviewItem}>
                  <TouchableOpacity onPress={() => router.push(`/business/${r.businessId}`)}>
                    <Text style={styles.reviewBiz}>{r.businessId.slice(0, 8)}...</Text>
                  </TouchableOpacity>
                  <Text style={styles.reviewStars}>{renderStars(r.rating)}</Text>
                  <Text style={styles.reviewText} numberOfLines={2}>{r.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* My Businesses */}
          {myBusinesses.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t.myBusinesses || 'My Businesses'}</Text>
              {myBusinesses.map(b => (
                <View key={b.id} style={styles.bizItem}>
                  <View style={styles.bizInfo}>
                    <View style={styles.bizNameRow}>
                      <Text style={styles.bizName}>{b.name}</Text>
                      {b.premium && <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>⭐</Text></View>}
                    </View>
                    <Text style={styles.bizAddress}>{b.address}</Text>
                  </View>
                  <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/edit-business/${b.id}`)}>
                    <Text style={styles.editBtnText}>{t.settings || 'Edit'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Language */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t.language || 'Language'}</Text>
        <View style={styles.langGrid}>
          {languages.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langCard, language === l.code && styles.langCardActive]}
              onPress={() => setLanguage(l.code as 'es' | 'en' | 'de' | 'ru')}
            >
              <Text style={styles.langFlag}>{l.flag}</Text>
              <Text style={styles.langLabel}>{l.label}</Text>
              {language === l.code && <Text style={styles.langCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t.settings || 'Settings'}</Text>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>{t.about || 'About'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>{t.privacy || 'Privacy'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, styles.settingRowLast]}>
          <Text style={styles.settingText}>{t.help || 'Help'}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <View style={styles.actionsWrap}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/claim-business')}>
            <Text style={styles.primaryBtnText}>{t.claimBusiness || 'Claim a Business'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/add-event')}>
            <Text style={styles.primaryBtnText}>{t.addEvent || 'Add Event'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleSignOut}>
            <Text style={styles.dangerBtnText}>{t.signOut || 'Sign Out'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {!user && (
        <View style={styles.actionsWrap}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/signup')}>
            <Text style={styles.primaryBtnText}>{t.signUp || 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { backgroundColor: '#4f46e5', paddingTop: 60, paddingBottom: 28 },
  heroContent: { alignItems: 'center', paddingHorizontal: 24 },
  heroIcon: { fontSize: 48, marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  userEmail: { fontSize: 13, color: '#c4b5fd', marginBottom: 4 },
  signInBtn: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  signInBtnText: { fontSize: 15, fontWeight: '700', color: '#4f46e5' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: -20, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  reviewItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  reviewBiz: { fontSize: 12, color: '#4f46e5', fontWeight: '600', marginBottom: 2 },
  reviewStars: { fontSize: 14, color: '#f59e0b', letterSpacing: 1, marginBottom: 2 },
  reviewText: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  bizItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  bizInfo: { flex: 1, marginRight: 8 },
  bizNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  bizName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  premiumBadge: { backgroundColor: '#fef3c7', borderRadius: 4, paddingHorizontal: 4 },
  premiumBadgeText: { fontSize: 10 },
  bizAddress: { fontSize: 12, color: '#64748b' },
  editBtn: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langCard: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  langCardActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: 13, color: '#0f172a', fontWeight: '500' },
  langCheck: { fontSize: 12, color: '#4f46e5', fontWeight: '700' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settingRowLast: { borderBottomWidth: 0 },
  settingText: { fontSize: 14, color: '#0f172a' },
  settingArrow: { fontSize: 18, color: '#94a3b8' },
  actionsWrap: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  primaryBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  dangerBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  dangerBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
});
