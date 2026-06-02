import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Business } from '../types';
import { useStore, translations } from '../store/useStore';

export default function ClaimBusiness() {
  const router = useRouter();
  const language = useStore((s) => s.language);
  const user = useStore((s) => s.user);
  const t = translations[language];

  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<Business[]>([]);
  const [selected, setSelected] = useState<Business | null>(null);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchBusinesses = async () => {
    if (!searchText.trim()) return;
    setSearching(true);
    try {
      const q = query(
        collection(db, 'businesses'),
        where('name', '>=', searchText),
        where('name', '<=', searchText + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const list: Business[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() } as Business));
      setResults(list);
    } catch (err) {
      Alert.alert(t.error || 'Error', (err as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(t.error || 'Error', t.loginRequired || 'You must be logged in');
      return;
    }
    if (!selected) {
      Alert.alert(t.error || 'Error', t.selectBusiness || 'Please select a business');
      return;
    }
    if (!phone.trim()) {
      Alert.alert(t.error || 'Error', t.phoneRequired || 'Phone is required');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'claimRequests'), {
        businessId: selected.id,
        businessName: selected.name,
        userId: user.uid,
        userEmail: user.email,
        phone: phone.trim(),
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      Alert.alert(t.success || 'Success', t.claimSubmitted || 'Claim request submitted');
      router.back();
    } catch (err) {
      Alert.alert(t.error || 'Error', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderBusiness = ({ item }: { item: Business }) => (
    <TouchableOpacity
      style={[styles.resultItem, selected?.id === item.id && styles.selected]}
      onPress={() => setSelected(item)}
    >
      <Text style={styles.businessName}>{item.name}</Text>
      {item.city && <Text style={styles.businessCity}>{item.city}</Text>}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ title: t.claimBusiness || 'Claim Business' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {!selected ? (
          <>
            <Text style={styles.label}>{t.searchBusiness || 'Search for your business'}</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                placeholder={t.searchPlaceholder || 'Business name...'}
                onSubmitEditing={searchBusinesses}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={searchBusinesses}>
                <Text style={styles.searchBtnText}>
                  {searching ? t.searching || '...' : t.search || 'Search'}
                </Text>
              </TouchableOpacity>
            </View>

            {searching && <ActivityIndicator style={{ marginTop: 16 }} />}

            <FlatList
              data={results}
              keyExtractor={(item) => item.id!}
              renderItem={renderBusiness}
              style={styles.resultsList}
              scrollEnabled={false}
              ListEmptyComponent={
                !searching && searchText ? (
                  <Text style={styles.empty}>{t.noResults || 'No businesses found'}</Text>
                ) : null
              }
            />
          </>
        ) : (
          <>
            <Text style={styles.selectedLabel}>{t.selected || 'Selected'}:</Text>
            <Text style={styles.selectedName}>{selected.name}</Text>

            <Text style={styles.label}>{t.phone || 'Phone'} *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+34 600 000 000"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>{t.message || 'Message'} ({t.optional || 'optional'})</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder={t.claimMessagePlaceholder || 'Add a note...'}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>{t.submit || 'Submit'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSelected(null)}>
              <Text style={styles.backLink}>{t.changeBusiness || 'Change business'}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
    color: '#333',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  resultsList: {
    marginTop: 12,
  },
  resultItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  selected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
  },
  businessCity: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  disabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  backLink: {
    textAlign: 'center',
    color: '#007AFF',
    marginTop: 16,
    fontSize: 15,
  },
});
