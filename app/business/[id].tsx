import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations } from '../../store/useStore';
import { categoryTranslations, subcategoryTranslations } from '../../store/useStore';
import { categories } from '../../utils/categories';
import BusinessMap from '../../components/BusinessMap';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const { language, isFavorite, addToFavorites, removeFromFavorites, user } = useStore();
  const t = translations[language];

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'businesses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setBusiness({ id: docSnap.id, ...docSnap.data() } as Business);
        }
      } catch (e) { console.error(e); }
    };
    fetch();
  }, [id]);

  const toggleFavorite = () => {
    if (!business) return;
    if (isFavorite(business.id)) {
      removeFromFavorites(business.id);
      Alert.alert('Info', t.removeFromFavorites);
    } else {
      addToFavorites(business.id);
      Alert.alert('Info', t.addToFavorites);
    }
  };

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);
  const openWebsite = (url: string) => Linking.openURL(url.startsWith('http') ? url : `https://${url}`);
  const openMap = (lat: number, lng: number) => Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);

  if (!business) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  const cat = categories.find(c => c.id === business.category);
  const subcatName = business.subcategory ? subcategoryTranslations[language]?.[business.subcategory] || business.subcategory : null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={styles.title}>{business.name}</Text>
            {cat && <Text style={styles.categoryLabel}>{cat.emoji} {categoryTranslations[language][business.category] || business.category}{subcatName ? ` · ${subcatName}` : ''}</Text>}
          </View>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favButton}>
            <Text style={styles.favIcon}>{isFavorite(business.id) ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {business.premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>⭐ {t.premiumPartner}</Text>
          </View>
        )}

        {business.verified && !business.premium && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ {t.verified}</Text>
          </View>
        )}

        {business.rating && (
          <Text style={styles.rating}>★ {business.rating}</Text>
        )}

        <TouchableOpacity style={styles.actionRow} onPress={() => openMap(business.location.lat, business.location.lng)}>
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionText}>{business.address}</Text>
        </TouchableOpacity>

        <BusinessMap lat={business.location.lat} lng={business.location.lng} />

        <View style={styles.actionButtons}>
          {business.phone && (
            <TouchableOpacity style={styles.actionButton} onPress={() => call(business.phone!)}>
              <Text style={styles.actionButtonEmoji}>📞</Text>
              <Text style={styles.actionButtonLabel}>{t.callToAction}</Text>
            </TouchableOpacity>
          )}
          {business.website && (
            <TouchableOpacity style={styles.actionButton} onPress={() => openWebsite(business.website!)}>
              <Text style={styles.actionButtonEmoji}>🌐</Text>
              <Text style={styles.actionButtonLabel}>{t.website}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionButton} onPress={() => openMap(business.location.lat, business.location.lng)}>
            <Text style={styles.actionButtonEmoji}>🧭</Text>
            <Text style={styles.actionButtonLabel}>{t.getDirections}</Text>
          </TouchableOpacity>
        </View>

        {business.phone && (
          <TouchableOpacity style={styles.infoRow} onPress={() => call(business.phone!)}>
            <Text style={styles.infoIcon}>📞</Text>
            <Text style={styles.infoLink}>{business.phone}</Text>
          </TouchableOpacity>
        )}

        {business.website && (
          <TouchableOpacity style={styles.infoRow} onPress={() => openWebsite(business.website!)}>
            <Text style={styles.infoIcon}>🌐</Text>
            <Text style={styles.infoLink}>{business.website}</Text>
          </TouchableOpacity>
        )}

        {business.email && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>✉️</Text>
            <Text>{business.email}</Text>
          </View>
        )}

        {business.hours && (
          <View style={styles.hoursCard}>
            <Text style={styles.hoursTitle}>{t.hours}</Text>
            <Text>{business.hours.open} – {business.hours.close}</Text>
          </View>
        )}

        {business.description?.[language] && (
          <Text style={styles.description}>{business.description[language]}</Text>
        )}

        {!business.claimedBy && user && (
          <TouchableOpacity style={styles.claimButton} onPress={() => router.push(`/claim-business?businessId=${business.id}&name=${business.name}`)}>
            <Text style={styles.claimButtonText}>✋ {t.claimBusiness}</Text>
            <Text style={styles.claimButtonSub}>{t.claimInfo}</Text>
          </TouchableOpacity>
        )}

        {business.claimedBy === user?.uid && (
          <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/edit-business/${business.id}`)}>
            <Text style={styles.editButtonText}>✏️ {t.settings}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold' },
  categoryLabel: { color: '#64748b', fontSize: 14, marginTop: 4 },
  favButton: { padding: 8 },
  favIcon: { fontSize: 24 },
  premiumBadge: { backgroundColor: '#fef3c7', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 12, borderWidth: 1, borderColor: '#f59e0b' },
  premiumText: { color: '#b45309', fontWeight: '600', fontSize: 13 },
  verifiedBadge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  verifiedText: { color: '#16a34a', fontWeight: '500' },
  rating: { color: '#ca8a04', fontSize: 18, marginBottom: 16 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  actionIcon: { fontSize: 18, marginRight: 8 },
  actionText: { color: '#3b82f6', textDecorationLine: 'underline', flex: 1 },
  actionButtons: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  actionButton: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  actionButtonEmoji: { fontSize: 24, marginBottom: 4 },
  actionButtonLabel: { fontSize: 12, fontWeight: '500', color: '#475569' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoIcon: { fontSize: 18, marginRight: 8 },
  infoLink: { color: '#3b82f6', textDecorationLine: 'underline', flex: 1 },
  hoursCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 },
  hoursTitle: { fontWeight: '600', marginBottom: 8 },
  description: { color: '#374151', lineHeight: 22 },
  claimButton: { backgroundColor: '#f0f9ff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: '#bae6fd' },
  claimButtonText: { color: '#0369a1', fontWeight: '600', fontSize: 16 },
  claimButtonSub: { color: '#64748b', fontSize: 12, marginTop: 4 },
  editButton: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  editButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
