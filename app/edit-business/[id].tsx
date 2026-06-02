import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations } from '../../store/useStore';
import { categories } from '../../utils/categories';

export default function EditBusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language, user } = useStore();
  const t = translations[language];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    email: '',
    description: '',
    category: '',
    subcategory: '',
    hoursOpen: '',
    hoursClose: '',
    premium: false,
    premiumType: 'starter' as 'starter' | 'pro',
  });

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const docRef = doc(db, 'businesses', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          Alert.alert('Error', 'Business not found');
          router.back();
          return;
        }
        const data = { id: docSnap.id, ...docSnap.data() } as Business;
        if (!user || data.claimedBy !== user.uid) {
          setAuthorized(false);
          setLoading(false);
          return;
        }
        setAuthorized(true);
        setBusiness(data);
        setForm({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          website: data.website || '',
          email: data.email || '',
          description: data.description?.[language] || '',
          category: data.category || '',
          subcategory: data.subcategory || '',
          hoursOpen: data.hours?.open || '',
          hoursClose: data.hours?.close || '',
          premium: data.premium || false,
          premiumType: data.premiumType || 'starter',
        });
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, user]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        name: form.name,
        address: form.address,
        phone: form.phone,
        website: form.website,
        email: form.email,
        category: form.category,
        subcategory: form.subcategory,
        hours: { open: form.hoursOpen, close: form.hoursClose },
        premium: form.premium,
        premiumType: form.premiumType,
        updatedAt: new Date().toISOString(),
      };
      updateData[`description.${language}`] = form.description;
      await updateDoc(doc(db, 'businesses', id), updateData);
      Alert.alert('Success', 'Business updated');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  const currentCategory = categories.find((c) => c.id === form.category);
  const availableSubcategories = currentCategory?.subcategories || [];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!authorized) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Not authorized</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: t.editBusiness || 'Edit Business' }} />

      <Text style={styles.label}>{t.businessName}</Text>
      <TextInput
        style={styles.input}
        placeholder={t.businessName}
        value={form.name}
        onChangeText={(v) => setForm({ ...form, name: v })}
      />

      <Text style={styles.label}>{t.address}</Text>
      <TextInput
        style={styles.input}
        placeholder={t.address}
        value={form.address}
        onChangeText={(v) => setForm({ ...form, address: v })}
      />

      <Text style={styles.label}>{t.phone}</Text>
      <TextInput
        style={styles.input}
        placeholder={t.phone}
        value={form.phone}
        onChangeText={(v) => setForm({ ...form, phone: v })}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>{t.website}</Text>
      <TextInput
        style={styles.input}
        placeholder={t.website}
        value={form.website}
        onChangeText={(v) => setForm({ ...form, website: v })}
        autoCapitalize="none"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={form.email}
        onChangeText={(v) => setForm({ ...form, email: v })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>{t.description}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={t.description}
        value={form.description}
        onChangeText={(v) => setForm({ ...form, description: v })}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Open</Text>
      <TextInput
        style={styles.input}
        placeholder="09:00"
        value={form.hoursOpen}
        onChangeText={(v) => setForm({ ...form, hoursOpen: v })}
      />

      <Text style={styles.label}>Close</Text>
      <TextInput
        style={styles.input}
        placeholder="18:00"
        value={form.hoursClose}
        onChangeText={(v) => setForm({ ...form, hoursClose: v })}
      />

      <Text style={styles.label}>{t.categories}</Text>
      <View style={styles.categoryGrid}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, form.category === cat.id && styles.categoryChipSelected]}
            onPress={() => setForm({ ...form, category: cat.id, subcategory: '' })}
          >
            <Text style={form.category === cat.id ? styles.chipTextSelected : styles.chipText}>
              {cat.emoji} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {availableSubcategories.length > 0 && (
        <>
          <Text style={styles.label}>Subcategory</Text>
          <View style={styles.categoryGrid}>
            {availableSubcategories.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[styles.categoryChip, form.subcategory === sub && styles.categoryChipSelected]}
                onPress={() => setForm({ ...form, subcategory: sub })}
              >
                <Text style={form.subcategory === sub ? styles.chipTextSelected : styles.chipText}>
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {form.premium && (
        <>
          <Text style={styles.sectionTitle}>Premium Settings</Text>

          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setForm({ ...form, premium: !form.premium })}
          >
            <Text style={styles.toggleLabel}>Premium Badge</Text>
            <Text style={styles.toggleValue}>{form.premium ? 'ON' : 'OFF'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Premium Type</Text>
          <View style={styles.categoryGrid}>
            {(['starter', 'pro'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.categoryChip, form.premiumType === type && styles.categoryChipSelected]}
                onPress={() => setForm({ ...form, premiumType: type })}
              >
                <Text style={form.premiumType === type ? styles.chipTextSelected : styles.chipText}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {!form.premium && (
        <TouchableOpacity
          style={styles.premiumToggle}
          onPress={() => setForm({ ...form, premium: true })}
        >
          <Text style={styles.premiumToggleText}>Enable Premium Settings</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: '#f3f4f6', borderRadius: 8, padding: 16, marginBottom: 12 },
  textArea: { minHeight: 80 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  categoryChip: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e5e7eb', marginRight: 8, marginBottom: 8 },
  categoryChipSelected: { backgroundColor: '#3b82f6' },
  chipText: { color: '#374151' },
  chipTextSelected: { color: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, padding: 16, marginBottom: 12 },
  toggleLabel: { fontSize: 16, color: '#374151' },
  toggleValue: { fontSize: 16, fontWeight: '600', color: '#3b82f6' },
  premiumToggle: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 16, alignItems: 'center', marginBottom: 12 },
  premiumToggleText: { color: '#92400e', fontWeight: '600', fontSize: 16 },
  submitButton: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 32 },
  submitText: { color: '#fff', fontWeight: '600', fontSize: 18 },
});
