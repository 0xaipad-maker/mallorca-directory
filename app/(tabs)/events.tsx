import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { MallorcaEvent } from '../../types';
import { useStore, translations } from '../../store/useStore';
import { categories } from '../../utils/categories';

interface MonthGroup {
  month: string;
  data: MallorcaEvent[];
}

function groupByMonth(events: MallorcaEvent[]): MonthGroup[] {
  const groups: Record<string, MallorcaEvent[]> = {};
  const sorted = [...events].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  for (const event of sorted) {
    const date = event.date instanceof Date ? event.date : new Date(event.date);
    const key = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(event);
  }
  return Object.entries(groups).map(([month, data]) => ({ month, data }));
}

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useStore();
  const [events, setEvents] = useState<MallorcaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchEvents = useCallback(async (cat: string) => {
    try {
      const constraints: any[] = [orderBy('date', 'asc')];
      if (cat) constraints.unshift(where('category', '==', cat));
      const q = query(collection(db, 'events'), ...constraints);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MallorcaEvent));
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents(category);
  }, [category, fetchEvents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEvents(category);
  }, [category, fetchEvents]);

  const groups = groupByMonth(events);
  const selectedCategory = categories.find(c => c.value === category);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-event')}>
          <Text style={styles.addButtonText}>+ Add Event</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(true)}>
        <Text style={styles.dropdownText}>
          {selectedCategory ? selectedCategory.label : 'All categories'}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity style={styles.dropdownBackdrop} onPress={() => setShowDropdown(false)} />
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={[styles.dropdownItem, !category && styles.dropdownItemActive]}
              onPress={() => { setCategory(''); setShowDropdown(false); }}
            >
              <Text style={[styles.dropdownItemText, !category && styles.dropdownItemTextActive]}>All categories</Text>
            </TouchableOpacity>
            {categories.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.dropdownItem, category === c.value && styles.dropdownItemActive]}
                onPress={() => { setCategory(c.value); setShowDropdown(false); }}
              >
                <Text style={[styles.dropdownItemText, category === c.value && styles.dropdownItemTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <FlatList
        data={groups}
        keyExtractor={item => item.month}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>Check back later for new events and offers</Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.monthHeader}>{group.month}</Text>
            {group.data.map(event => {
              const date = event.date instanceof Date ? event.date : new Date(event.date);
              const day = date.getDate();
              const month = date.toLocaleString('default', { month: 'short' });
              return (
                <TouchableOpacity
                  key={event.id}
                  style={styles.card}
                  onPress={() => router.push(`/events/${event.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateDay}>{day}</Text>
                    <Text style={styles.dateMonth}>{month}</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
                    <Text style={styles.cardBusiness} numberOfLines={1}>{event.businessName || event.location}</Text>
                    {event.time && <Text style={styles.cardTime}>{event.time}</Text>}
                    {event.price && <Text style={styles.cardPrice}>{event.price}</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  addButton: {
    backgroundColor: '#2563eb',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#9ca3af',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemActive: {
    backgroundColor: '#eff6ff',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#374151',
  },
  dropdownItemTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  monthHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  dateBadge: {
    width: 54,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563eb',
    lineHeight: 26,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
    textTransform: 'uppercase',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  cardBusiness: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
