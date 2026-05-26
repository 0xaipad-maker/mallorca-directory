import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useStore, translations } from '../store/useStore';
import { categories } from '../utils/categories';

export default function AddBusinessScreen() {
  const router = useRouter();
  const { language, user } = useStore();
  const t = translations[language];
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    description: '',
    category: '',
  });

  const handleSubmit = async () => {
    if (!user) return Alert.alert('Error', 'Sign in first');
    if (!form.name || !form.address || !form.category) {
      return Alert.alert('Error', 'Fill required fields');
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'businesses'), {
        ...form,
        rating: 0,
        verified: false,
        location: { lat: 0, lng: 0 },
        source: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Success', 'Business submitted for review');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={t.businessName}
        value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
      />
      <TextInput
        style={styles.input}
        placeholder={t.address}
        value={form.address}
        onChangeText={(v) => setForm({ ...form, address: v })}
      />
      <TextInput
        style={styles.input}
        placeholder={t.phone}
        value={form.phone}
        onChangeText={(v) => setForm({ ...form, phone: v })}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder={t.website}
        value={form.website}
        onChangeText={(v) => setForm({ ...form, website: v })}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={t.description}
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        multiline
        numberOfLines={3}
      />
      <Text style={styles.label}>{t.categories}</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, form.category === cat.id && styles.categoryChipSelected]}
            onPress={() => setForm({ ...form, category: cat.id })}
          >
            <Text style={form.category === cat.id ? styles.chipTextSelected : styles.chipText}>
              {cat.emoji} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>{t.submit}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 16, marginBottom: 12 },
  textArea: { minHeight: 80 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 24 },
  categoryChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e5e7eb', marginRight: 8, marginBottom: 8 },
  categoryChipSelected: { backgroundColor: '#3b82f6' },
  chipText: { color: '#374151' },
  chipTextSelected: { color: '#fff' },
  submitButton: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 18 },
});
