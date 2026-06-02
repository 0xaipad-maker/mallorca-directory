import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useStore, translations } from '../store/useStore';
import { categories } from '../utils/categories';

export default function AddEvent() {
  const router = useRouter();
  const language = useStore((s) => s.language);
  const user = useStore((s) => s.user);
  const t = translations[language];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(t.error || 'Error', t.loginRequired || 'You must be logged in');
      return;
    }
    if (!title.trim()) {
      Alert.alert(t.error || 'Error', t.titleRequired || 'Title is required');
      return;
    }
    if (!date.trim()) {
      Alert.alert(t.error || 'Error', t.dateRequired || 'Date is required');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        title: title.trim(),
        date: date.trim(),
        endDate: endDate.trim() || null,
        time: time.trim() || null,
        location: location.trim() || null,
        area: area.trim() || null,
        category: category || null,
        price: price.trim() || null,
        description: description.trim() || null,
        businessId: businessId.trim() || null,
        businessName: businessName.trim() || null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });
      Alert.alert(t.success || 'Success', t.eventAdded || 'Event added');
      router.back();
    } catch (err) {
      Alert.alert(t.error || 'Error', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: t.addEvent || 'Add Event' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>{t.title || 'Title'} *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t.eventTitlePlaceholder || 'Event title'} />

        <Text style={styles.label}>{t.date || 'Date'} * (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2026-07-01" />

        <Text style={styles.label}>{t.endDate || 'End Date'} ({t.optional || 'optional'})</Text>
        <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="2026-07-03" />

        <Text style={styles.label}>{t.time || 'Time'} ({t.optional || 'optional'})</Text>
        <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="20:00" />

        <Text style={styles.label}>{t.location || 'Location'} ({t.optional || 'optional'})</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder={t.locationPlaceholder || 'Venue name'} />

        <Text style={styles.label}>{t.area || 'Area'} ({t.optional || 'optional'})</Text>
        <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="Palma" />

        <Text style={styles.label}>{t.category || 'Category'} ({t.optional || 'optional'})</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setShowCategories(!showCategories)}>
          <Text style={category ? styles.dropdownText : styles.dropdownPlaceholder}>
            {category ? categories.find((c) => c.id === category)?.label || category : t.selectCategory || 'Select category'}
          </Text>
        </TouchableOpacity>
        {showCategories && (
          <View style={styles.dropdownList}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.dropdownItem, category === cat.id && styles.dropdownItemActive]}
                onPress={() => { setCategory(cat.id); setShowCategories(false); }}
              >
                <Text style={[styles.dropdownItemText, category === cat.id && styles.dropdownItemTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>{t.price || 'Price'} ({t.optional || 'optional'})</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Free / 10€" />

        <Text style={styles.label}>{t.description || 'Description'} ({t.optional || 'optional'})</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={5} placeholder={t.eventDescriptionPlaceholder || 'Event details...'} />

        <Text style={styles.label}>{t.business || 'Business'} ({t.optional || 'optional'})</Text>
        <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder={t.searchBusinessPlaceholder || 'Search & enter business name'} />
        <Text style={{ fontSize: 12, color: '#999', marginTop: -4 }}>
          {t.businessIdHint || 'Business ID will be matched if available'}
        </Text>

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.disabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t.submit || 'Submit'}</Text>}
        </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: '#aaa',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemActive: {
    backgroundColor: '#f0f8ff',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  dropdownItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
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
});
