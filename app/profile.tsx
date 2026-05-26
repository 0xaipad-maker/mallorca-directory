import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { useStore, translations } from '../store/useStore';
import { useState } from 'react';

export default function ProfileScreen() {
  const router = useRouter();
  const { language, setLanguage, user, setUser } = useStore();
  const t = translations[language];
  const [selectedLang, setSelectedLang] = useState(language);

  const handleLanguageChange = (lang: 'es' | 'en' | 'de' | 'ru') => {
    setSelectedLang(lang);
    setLanguage(lang);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    router.replace('/');
  };

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t.profile}</Text>

        {user && (
          <View style={styles.userCard}>
            <Text style={styles.userName}>{user.displayName || user.email}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.langItem, selectedLang === lang.code && styles.langItemSelected]}
              onPress={() => handleLanguageChange(lang.code as any)}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <Text style={styles.langName}>{lang.name}</Text>
              {selectedLang === lang.code && <Text style={styles.langCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {user && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-business')}
          >
            <Text style={styles.addButtonText}>+ {t.addBusiness}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.settings}</Text>
          <View style={styles.settingItem}>
            <Text>{t.about}</Text>
            <Text style={styles.settingValue}>v1.0.0</Text>
          </View>
          <TouchableOpacity style={styles.settingItem}>
            <Text>{t.privacy}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text>{t.help}</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {user ? (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>{t.signOut}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.signInButton} onPress={() => router.push('/login')}>
            <Text style={styles.signInText}>{t.signIn}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  userCard: { backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 16 },
  userName: { fontWeight: '600', fontSize: 16 },
  userEmail: { color: '#6b7280', fontSize: 14 },
  section: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  langItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' },
  langItemSelected: { backgroundColor: '#dbeafe' },
  langFlag: { fontSize: 24, marginRight: 12 },
  langName: { flex: 1, fontSize: 16 },
  langCheck: { color: '#2563eb', fontWeight: 'bold' },
  addButton: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 18 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  settingValue: { color: '#9ca3af' },
  settingArrow: { color: '#9ca3af', fontSize: 20 },
  signOutButton: { backgroundColor: '#ef4444', borderRadius: 12, padding: 16, alignItems: 'center' },
  signOutText: { color: '#fff', fontWeight: '600' },
  signInButton: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 16, alignItems: 'center' },
  signInText: { color: '#fff', fontWeight: '600', fontSize: 18 },
});
