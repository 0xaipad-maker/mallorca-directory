import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useStore, translations } from '../../store/useStore';

const { width: SCREEN_W } = Dimensions.get('window');
const COLS = 3;
const GAP = 4;
const IMG_SIZE = (SCREEN_W - GAP * (COLS + 1)) / COLS;

export default function GalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { language } = useStore();
  const t = translations[language];
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'businesses', id));
        if (snap.exists()) {
          const data = snap.data();
          setPhotos(data.photos || []);
          setBusinessName(data.name || '');
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>📷</Text>
        <Text style={styles.emptyText}>{t.noPhotos || 'No photos yet'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{businessName}</Text>
          <Text style={styles.headerSub}>{photos.length} {t.photos || 'photos'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {photos.map((url, i) => (
          <TouchableOpacity key={i} onPress={() => setSelectedIndex(i)}>
            <Image source={{ uri: url }} style={styles.thumb} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedIndex !== null && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedIndex(null)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalCounter}>{selectedIndex + 1} / {photos.length}</Text>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={selectedIndex}
              style={styles.modalScroll}
              getItemLayout={(_, idx) => ({ length: SCREEN_W, offset: SCREEN_W * idx, index: idx })}
            >
              {photos.map((url, i) => (
                <TouchableOpacity key={i} activeOpacity={1} style={styles.modalImgWrap} onPress={() => setSelectedIndex(null)}>
                  <Image source={{ uri: url }} style={styles.modalImg} resizeMode="contain" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  emptyText: { fontSize: 16, color: '#64748b' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12, backgroundColor: '#0f172a' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  backText: { fontSize: 18, color: '#fff' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: GAP },
  thumb: { width: IMG_SIZE, height: IMG_SIZE, margin: GAP / 2, borderRadius: 4, backgroundColor: '#1e293b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  modalClose: { position: 'absolute', top: 56, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { fontSize: 18, color: '#fff', fontWeight: '700' },
  modalCounter: { position: 'absolute', top: 60, left: 20, zIndex: 10, fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  modalScroll: { flex: 1 },
  modalImgWrap: { width: SCREEN_W, justifyContent: 'center', alignItems: 'center' },
  modalImg: { width: SCREEN_W, height: '100%' },
});
