import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations } from '../../store/useStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { language, setLanguage, user, setUser } = useStore();
  const t = translations[language];
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  ];

  useEffect(() => {
    if (!user) { setMyBusinesses([]); return; }
    const fetchMyBusinesses = async () => {
      try {
        const q = query(collection(db, 'businesses'), where('claimedBy', '==', user.uid));
        const snap = await getDocs(q);
        setMyBusinesses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Business)));
      } catch (e) { console.error(e); }
    };
    fetchMyBusinesses();
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.profile}</Text>

      {user ? (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.displayName || user.email || '?')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.userName}>{user.displayName || 'User'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/login')}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t.language}</Text>
        {languages.map(l => (
          <TouchableOpacity
            key={l.code}
            style={[styles.langItem, language === l.code && styles.langItemActive]}
            onPress={() => setLanguage(l.code as 'es' | 'en' | 'de' | 'ru')}
          >
            <Text style={styles.langFlag}>{l.flag}</Text>
            <Text style={styles.langLabel}>{l.label}</Text>
            {language === l.code && <Text style={styles.langCheck}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {user && myBusinesses.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>My Business</Text>
          {myBusinesses.map(b => (
            <View key={b.id} style={styles.businessItem}>
              <View style={styles.businessInfo}>
                <View style={styles.businessNameRow}>
                  <Text style={styles.businessName}>{b.name}</Text>
                  {b.premium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>Premium Partner</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.businessAddress}>{b.address}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/edit-business/${b.id}`)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {user && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/claim-business')}>
          <Text style={styles.primaryButtonText}>Claim a Business</Text>
        </TouchableOpacity>
      )}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t.settings}</Text>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>{t.about}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingRow}>
          <Text style={styles.settingText}>{t.privacy}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, styles.settingRowLast]}>
          <Text style={styles.settingText}>{t.help}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/add-event')}>
            <Text style={styles.primaryButtonText}>Add Event</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
            <Text style={styles.dangerButtonText}>{t.signOut}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b', marginBottom: 20 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#fff' },
  userName: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#64748b' },

  sectionCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },

  langItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 4,
  },
  langItemActive: { backgroundColor: '#eff6ff' },
  langFlag: { fontSize: 22, marginRight: 12 },
  langLabel: { fontSize: 15, flex: 1, color: '#1e293b' },
  langCheck: { color: '#3b82f6', fontSize: 16, fontWeight: '700' },

  businessItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  businessInfo: { flex: 1, marginRight: 12 },
  businessNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 2 },
  businessName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  premiumBadge: {
    backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  premiumBadgeText: { fontSize: 11, fontWeight: '600', color: '#b45309' },
  businessAddress: { fontSize: 13, color: '#64748b' },
  editButton: {
    backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
  },
  editButtonText: { fontSize: 13, fontWeight: '600', color: '#3b82f6' },

  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingText: { fontSize: 15, color: '#1e293b' },
  settingArrow: { fontSize: 20, color: '#94a3b8' },

  primaryButton: {
    backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  dangerButton: {
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#ef4444', marginBottom: 12,
  },
  dangerButtonText: { color: '#ef4444', fontSize: 16, fontWeight: '600' },
});
