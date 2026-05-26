import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations } from '../../store/useStore';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const { language, isFavorite, addToFavorites, removeFromFavorites } = useStore();
  const t = translations[language];

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'businesses', id as string);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{business.name}</Text>
          <TouchableOpacity onPress={toggleFavorite} style={styles.favButton}>
            <Text style={styles.favIcon}>{isFavorite(business.id) ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {business.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ {t.verified}</Text>
          </View>
        )}

        {business.rating && (
          <Text style={styles.rating}>★ {business.rating}</Text>
        )}

        <TouchableOpacity style={styles.infoRow} onPress={() => openMap(business.location.lat, business.location.lng)}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoLink}>{business.address}</Text>
        </TouchableOpacity>

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
  title: { fontSize: 24, fontWeight: 'bold', flex: 1, marginRight: 16 },
  favButton: { padding: 8 },
  favIcon: { fontSize: 24 },
  verifiedBadge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  verifiedText: { color: '#16a34a', fontWeight: '500' },
  rating: { color: '#ca8a04', fontSize: 18, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoIcon: { fontSize: 18, marginRight: 8 },
  infoLink: { color: '#3b82f6', textDecorationLine: 'underline', flex: 1 },
  hoursCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 16, marginBottom: 16 },
  hoursTitle: { fontWeight: '600', marginBottom: 8 },
  description: { color: '#374151', lineHeight: 22 },
});
