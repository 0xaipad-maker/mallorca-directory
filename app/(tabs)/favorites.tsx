import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business, TripDay } from '../../types';
import { useStore, translations } from '../../store/useStore';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, user, plannedDays, addToPlanned, language } = useStore();
  const t = translations[language];
  const [tab, setTab] = useState<'favorites' | 'planner'>('favorites');
  const [favBusinesses, setFavBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [tripDays, setTripDays] = useState<TripDay[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [dayBusinesses, setDayBusinesses] = useState<Record<string, Business[]>>({});
  const [loadingDays, setLoadingDays] = useState(false);

  useEffect(() => {
    if (tab !== 'favorites') return;
    const fetch = async () => {
      setLoading(true);
      setFavBusinesses([]);
      try {
        if (favorites.length === 0) { setLoading(false); return; }
        const results: Business[] = [];
        for (const id of favorites) {
          const snap = await getDoc(doc(db, 'businesses', id));
          if (snap.exists()) {
            results.push({ id: snap.id, ...snap.data() } as Business);
          }
        }
        setFavBusinesses(results);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, [tab, favorites]);

  useEffect(() => {
    if (tab !== 'planner' || !user) return;
    const fetch = async () => {
      setLoadingDays(true);
      try {
        const q = query(collection(db, 'tripPlans'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const allDays = snap.docs.map(d => ({ id: d.id, ...d.data() } as TripDay));
        const days = allDays.filter(d => plannedDays.includes(d.id));
        setTripDays(days);
      } catch (e) { console.error(e); }
      setLoadingDays(false);
    };
    fetch();
  }, [tab, user, plannedDays]);

  const handleAddDay = async () => {
    if (!user) return;
    try {
      const date = new Date().toISOString().split('T')[0];
      const docRef = await addDoc(collection(db, 'tripPlans'), {
        userId: user.uid,
        date,
        businessIds: [],
        notes: '',
      });
      addToPlanned(docRef.id);
      setTripDays(prev => [...prev, { id: docRef.id, date, businessIds: [], notes: '' }]);
    } catch (e) { console.error(e); }
  };

  const handleDayPress = async (dayId: string) => {
    if (expandedDay === dayId) {
      setExpandedDay(null);
      return;
    }
    setExpandedDay(dayId);
    const day = tripDays.find(d => d.id === dayId);
    if (!day || day.businessIds.length === 0) return;
    try {
      const businesses: Business[] = [];
      for (const id of day.businessIds) {
        const snap = await getDoc(doc(db, 'businesses', id));
        if (snap.exists()) {
          businesses.push({ id: snap.id, ...snap.data() } as Business);
        }
      }
      setDayBusinesses(prev => ({ ...prev, [dayId]: businesses }));
    } catch (e) { console.error(e); }
  };

  const renderFavItem = ({ item }: { item: Business }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/business/${item.id}`)}>
      <Text style={styles.cardName}>{item.name}</Text>
      <Text style={styles.cardAddress}>{item.address}</Text>
      {item.rating && (
        <View style={styles.cardRating}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFavorites = () => {
    if (loading) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loading} />;
    if (favorites.length === 0 || favBusinesses.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>⭐</Text>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptySub}>Start exploring and save your favorite places</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={favBusinesses}
        keyExtractor={item => item.id}
        renderItem={renderFavItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderPlanner = () => {
    if (!user) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Sign in to plan your trip</Text>
          <Text style={styles.emptySub}>Create day-by-day itineraries for your Mallorca visit</Text>
        </View>
      );
    }
    if (loadingDays) return <ActivityIndicator size="large" color="#3b82f6" style={styles.loading} />;
    return (
      <View style={styles.plannerWrap}>
        <TouchableOpacity style={styles.addDayBtn} onPress={handleAddDay}>
          <Text style={styles.addDayBtnText}>+ Add Day</Text>
        </TouchableOpacity>
        {tripDays.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No trips planned yet</Text>
            <Text style={styles.emptySub}>Tap "Add Day" to start building your itinerary</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.daysScroll}>
            {tripDays.map(day => {
              const isExpanded = expandedDay === day.id;
              const businesses = dayBusinesses[day.id] || [];
              return (
                <TouchableOpacity key={day.id} style={styles.dayCard} onPress={() => handleDayPress(day.id)}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayDate}>{day.date}</Text>
                    <Text style={styles.dayCount}>{day.businessIds.length} places</Text>
                    <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
                  </View>
                  {isExpanded && (
                    <View style={styles.dayBody}>
                      {day.businessIds.length === 0 ? (
                        <Text style={styles.dayEmpty}>No places added yet</Text>
                      ) : businesses.length === 0 ? (
                        <ActivityIndicator size="small" color="#3b82f6" />
                      ) : (
                        businesses.map(b => (
                          <TouchableOpacity key={b.id} style={styles.dayBusinessItem}
                            onPress={() => router.push(`/business/${b.id}`)}>
                            <Text style={styles.dayBusinessName}>{b.name}</Text>
                            <Text style={styles.dayBusinessAddress}>{b.address}</Text>
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmented}>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'favorites' && styles.segmentBtnActive]}
          onPress={() => setTab('favorites')}
        >
          <Text style={[styles.segmentText, tab === 'favorites' && styles.segmentTextActive]}>
            Favorites ⭐
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, tab === 'planner' && styles.segmentBtnActive]}
          onPress={() => setTab('planner')}
        >
          <Text style={[styles.segmentText, tab === 'planner' && styles.segmentTextActive]}>
            Trip Planner 📋
          </Text>
        </TouchableOpacity>
      </View>
      {tab === 'favorites' ? renderFavorites() : renderPlanner()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  segmented: {
    flexDirection: 'row', margin: 16, backgroundColor: '#e2e8f0',
    borderRadius: 12, padding: 3,
  },
  segmentBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  segmentBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  segmentTextActive: { color: '#1e293b' },
  loading: { marginTop: 60 },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#64748b', marginBottom: 6 },
  cardRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingStar: { fontSize: 13 },
  ratingText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20 },
  plannerWrap: { flex: 1 },
  addDayBtn: {
    marginHorizontal: 16, marginTop: 8, marginBottom: 12,
    backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center',
  },
  addDayBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  daysScroll: { flex: 1, paddingHorizontal: 16 },
  dayCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center' },
  dayDate: { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1 },
  dayCount: { fontSize: 13, color: '#64748b', marginRight: 8 },
  expandIcon: { fontSize: 12, color: '#94a3b8' },
  dayBody: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  dayEmpty: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 8 },
  dayBusinessItem: {
    paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f8fafc',
    borderRadius: 10, marginBottom: 8,
  },
  dayBusinessName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  dayBusinessAddress: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
