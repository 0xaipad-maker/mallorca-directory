import { View, Text, ScrollView, TouchableOpacity, Linking, Alert, StyleSheet, Image, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Business } from '../../types';
import { useStore, translations, categoryTranslations, subcategoryTranslations } from '../../store/useStore';
import { categories } from '../../utils/categories';
import { colors, spacing, borderRadius, typography, shadows } from '../../utils/theme';
import LeafletMap from '../../components/LeafletMap';

interface Review {
  id: string; businessId: string; userId: string; userName: string; rating: number; text: string; createdAt: string;
}

interface MallorcaEvent {
  id: string; title: string; date: string; time?: string; image?: string;
}

const AMENITY_ICONS: Record<string, string> = {
  wifi: '📶', parking: '🅿️', wheelchair: '♿', 'air conditioning': '❄️',
  'outdoor seating': '🌿', 'pets allowed': '🐾', smokefree: '🚭',
  'credit cards': '💳', reservations: '📅', delivery: '🚚', takeaway: '🥡',
  tv: '📺', music: '🎵', 'happy hour': '🍸', glutenfree: '🌾',
  vegan: '🌱', breakfast: '🌅', lunch: '☀️', dinner: '🌙', bar: '🍷',
};

const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function getCurrentDay() {
  const d = new Date().getDay();
  return DAY_NAMES[d === 0 ? 6 : d - 1];
}

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [events, setEvents] = useState<MallorcaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const { language, isFavorite, addToFavorites, removeFromFavorites, addToRecent, user } = useStore();
  const t = translations[language];

  useEffect(() => {
    (async () => {
      if (!id) return;
      addToRecent(id);
      try {
        const docRef = doc(db, 'businesses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setBusiness({ id: docSnap.id, ...docSnap.data() } as Business);
        const q = query(collection(db, 'reviews'), where('businessId', '==', id), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Review));
        const eq = query(collection(db, 'events'), where('businessId', '==', id), orderBy('date', 'desc'));
        const esnap = await getDocs(eq);
        setEvents(esnap.docs.map(d => ({ id: d.id, ...d.data() }) as MallorcaEvent));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [id]);

  const toggleFavorite = () => {
    if (!business) return;
    if (isFavorite(business.id)) { removeFromFavorites(business.id); Alert.alert('', t.removeFromFavorites); }
    else { addToFavorites(business.id); Alert.alert('', t.addToFavorites); }
  };

  const call = (p: string) => Linking.openURL(`tel:${p}`);
  const openWebsite = (u: string) => Linking.openURL(u.startsWith('http') ? u : `https://${u}`);
  const openMap = (lat: number, lng: number) => Linking.openURL(`https://www.google.com/maps?q=${lat},${lng}`);

  const submitReview = async () => {
    if (!user || !business || !reviewText.trim() || reviewRating === 0) return;
    setSubmitting(true);
    try {
      const ref = await addDoc(collection(db, 'reviews'), {
        businessId: business.id, userId: user.uid, userName: user.displayName || 'Anonymous',
        rating: reviewRating, text: reviewText.trim(), createdAt: serverTimestamp(),
      });
      const updatedReviews = [{ id: ref.id, businessId: business.id, userId: user.uid, userName: user.displayName || 'Anonymous', rating: reviewRating, text: reviewText.trim(), createdAt: new Date().toISOString() }, ...reviews];
      setReviews(updatedReviews);
      setReviewText(''); setReviewRating(0);
      const newAvg = updatedReviews.reduce((a, r) => a + r.rating, 0) / updatedReviews.length;
      setBusiness({ ...business, rating: newAvg, reviewCount: updatedReviews.length });
      await updateDoc(doc(db, 'businesses', business.id), { rating: newAvg, reviewCount: updatedReviews.length });
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleShare = async () => {
    if (!business) return;
    const url = typeof window !== 'undefined' ? `${window.location.origin}/mallorca-directory/business/${business.id}` : `https://0xaipad-maker.github.io/mallorca-directory/business/${business.id}`;
    if (navigator?.share) {
      try { await navigator.share({ title: business.name, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); Alert.alert('', t.linkCopied || 'Link copied!'); } catch {}
    }
  };

  const renderStars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  const formatTime = (s?: string) => s || '—';

  if (loading || !business) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  const cat = categories.find(c => c.id === business.category);
  const catName = categoryTranslations[language]?.[business.category] || business.category;
  const subcatName = business.subcategory ? subcategoryTranslations[language]?.[business.subcategory] || business.subcategory : null;
  const today = getCurrentDay();
  const hours = business.hours as Record<string, any>;
  const hasWeekHours = hours && DAY_NAMES.some(d => hours[d]);

  return (
    <ScrollView style={s.container}>
      {business.photos && business.photos.length > 0 ? (
        <View style={s.gallery}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {business.photos.map((url, i) => (
              <View key={i}>
                <Image source={{ uri: url }} style={s.galleryImg} />
                {i === business.photos!.length - 1 && business.photos!.length > 1 && (
                  <TouchableOpacity style={s.showAllOverlay} onPress={() => router.push(`/gallery/${business.id}`)}>
                    <Text style={s.showAllText}>+{business.photos!.length} Show all</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={[s.placeholder, { backgroundColor: cat?.color || colors.bg }]}>
          <Text style={s.placeholderEmoji}>{cat?.emoji || '📌'}</Text>
        </View>
      )}

      <View style={s.content}>
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{business.name}</Text>
            <View style={s.badgeRow}>
              {cat && <View style={s.catBadge}><Text style={s.catBadgeText}>{cat.emoji} {catName}</Text></View>}
              {subcatName && <View style={s.subcatBadge}><Text style={s.subcatBadgeText}>{subcatName}</Text></View>}
            </View>
            <View style={s.badgeRow}>
              {business.premium && <View style={s.premiumBadge}><Text style={s.premiumBadgeText}>⭐ {t.premiumPartner}</Text></View>}
              {business.verified && <View style={s.verifiedBadge}><Text style={s.verifiedBadgeText}>✓ {t.verified}</Text></View>}
            </View>
            {business.rating && (
              <View style={s.ratingRow}>
                <Text style={s.ratingStar}>{renderStars(business.rating)}</Text>
                <Text style={s.ratingValue}>{business.rating.toFixed(1)}</Text>
                {business.reviewCount !== undefined && (
                  <Text style={s.reviewCount}>({business.reviewCount})</Text>
                )}
              </View>
            )}
          </View>
          <View style={s.headerActions}>
            <TouchableOpacity onPress={handleShare} style={s.iconBtn}>
              <Text style={s.iconBtnText}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleFavorite} style={s.iconBtn}>
              <Text style={s.iconBtnText}>{isFavorite(business.id) ? '❤️' : '🤍'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {business.tags && business.tags.length > 0 && (
          <View style={s.tagsRow}>
            {business.tags.map((tag, i) => <View key={i} style={s.tag}><Text style={s.tagText}>{tag}</Text></View>)}
          </View>
        )}

        <View style={s.actionRow}>
          {business.phone && (
            <TouchableOpacity style={s.actionBtn} onPress={() => call(business.phone!)}>
              <Text style={s.actionEmoji}>📞</Text><Text style={s.actionLabel}>{t.callToAction}</Text>
            </TouchableOpacity>
          )}
          {business.website && (
            <TouchableOpacity style={s.actionBtn} onPress={() => openWebsite(business.website!)}>
              <Text style={s.actionEmoji}>🌐</Text><Text style={s.actionLabel}>{t.website}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.actionBtn} onPress={() => openMap(business.location.lat, business.location.lng)}>
            <Text style={s.actionEmoji}>🧭</Text><Text style={s.actionLabel}>{t.getDirections}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          {business.phone && (
            <>
              <Text style={s.label}>📞 {t.phone}</Text>
              <TouchableOpacity onPress={() => call(business.phone!)}>
                <Text style={s.linkText}>{business.phone}</Text>
              </TouchableOpacity>
            </>
          )}
          {business.email && (
            <>
              <Text style={[s.label, { marginTop: spacing.md }]}>✉️ Email</Text>
              <Text style={s.bodyText}>{business.email}</Text>
            </>
          )}
          {business.website && (
            <>
              <Text style={[s.label, { marginTop: spacing.md }]}>🌐 {t.website}</Text>
              <TouchableOpacity onPress={() => openWebsite(business.website!)}>
                <Text style={s.linkText}>{business.website}</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={[s.label, { marginTop: spacing.md }]}>📍 {t.address}</Text>
          <TouchableOpacity onPress={() => openMap(business.location.lat, business.location.lng)}>
            <Text style={s.linkText}>{business.address}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.mapCard}>
          <LeafletMap mode="single" height={300} lat={business.location.lat} lng={business.location.lng} businessName={business.name} />
          <TouchableOpacity style={s.mapOverlay} onPress={() => openMap(business.location.lat, business.location.lng)}>
            <Text style={s.mapOverlayText}>🧭 {t.getDirections} →</Text>
          </TouchableOpacity>
        </View>

        {business.hours && (
          <View style={s.card}>
            <Text style={s.label}>🕐 {t.hours}</Text>
            {hasWeekHours ? DAY_NAMES.map(day => {
              const d = hours[day];
              const isToday = day === today;
              return (
                <View key={day} style={[s.hourRow, isToday && s.hourRowToday]}>
                  <Text style={[s.hourDay, isToday && s.hourDayToday]}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                  <Text style={[s.hourTime, isToday && s.hourTimeToday]}>{d ? `${formatTime(d.open)} – ${formatTime(d.close)}` : 'Closed'}</Text>
                  {isToday && <View style={s.todayDot} />}
                </View>
              );
            }) : (
              <Text style={s.bodyText}>{(business.hours as any).open || '—'} – {(business.hours as any).close || '—'}</Text>
            )}
          </View>
        )}

        {business.description?.[language] && (
          <View style={s.card}>
            <Text style={s.label}>{t.description}</Text>
            <Text style={s.bodyText}>{business.description[language]}</Text>
          </View>
        )}

        {business.amenities && business.amenities.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>Amenities</Text>
            <View style={s.amenitiesGrid}>
              {business.amenities.map((a, i) => (
                <View key={i} style={s.amenityItem}>
                  <Text style={s.amenityIcon}>{AMENITY_ICONS[a.toLowerCase()] || '✔️'}</Text>
                  <Text style={s.amenityLabel}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {events.length > 0 && (
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.label}>{t.events}</Text>
              <TouchableOpacity onPress={() => router.push(`/events?businessId=${business.id}`)}>
                <Text style={s.viewAll}>{t.loadMore}</Text>
              </TouchableOpacity>
            </View>
            {events.slice(0, 3).map(ev => (
              <View key={ev.id} style={s.eventItem}>
                <Text style={s.eventTitle}>{ev.title}</Text>
                <Text style={s.eventDate}>{ev.date}{ev.time ? ` • ${ev.time}` : ''}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={s.label}>{t.reviews || 'Reviews'}</Text>
            {reviews.length > 0 && <Text style={s.reviewCount}>{reviews.length}</Text>}
          </View>
          {reviews.length > 0 && (
            <View style={s.avgRatingRow}>
              <Text style={s.avgStars}>{renderStars(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length)}</Text>
              <Text style={s.avgValue}>{(reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)}</Text>
            </View>
          )}
          {reviews.slice(0, 5).map(r => (
            <View key={r.id} style={s.reviewItem}>
              <View style={s.reviewHeader}>
                <Text style={s.reviewName}>{r.userName}</Text>
                <Text style={s.reviewDate}>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</Text>
              </View>
              <Text style={s.reviewStars}>{renderStars(r.rating)}</Text>
              <Text style={s.reviewText}>{r.text}</Text>
            </View>
          ))}
          {user && (
            <View style={s.addReview}>
              <View style={s.starSelector}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setReviewRating(n)}>
                    <Text style={[s.starOption, n <= reviewRating && s.starActive]}>{n <= reviewRating ? '★' : '☆'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={s.reviewInput} placeholder={t.writeReview || 'Write a review...'} value={reviewText} onChangeText={setReviewText} multiline />
              <TouchableOpacity style={[s.submitBtn, (!reviewText.trim() || reviewRating === 0) && s.submitDisabled]} onPress={submitReview} disabled={submitting || !reviewText.trim() || reviewRating === 0}>
                <Text style={s.submitText}>{submitting ? '...' : t.submit}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!business.claimedBy && user && (
          <TouchableOpacity style={s.claimCard} onPress={() => router.push(`/claim-business?businessId=${business.id}&name=${encodeURIComponent(business.name)}`)}>
            <Text style={s.claimTitle}>✋ {t.claimBusiness}</Text>
            <Text style={s.claimSub}>{t.claimInfo}</Text>
          </TouchableOpacity>
        )}

        {business.claimedBy === user?.uid && (
          <TouchableOpacity style={s.editBtn} onPress={() => router.push(`/edit-business/${business.id}`)}>
            <Text style={s.editText}>✏️ {t.settings}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  loadingText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.md },
  gallery: { height: 260, backgroundColor: colors.text },
  galleryImg: { width: 414, height: 260, resizeMode: 'cover' },
  showAllOverlay: { position: 'absolute', bottom: spacing.lg, right: spacing.lg, backgroundColor: colors.overlay, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  showAllText: { ...typography.caption, color: colors.textInverse, fontWeight: '600' },
  placeholder: { height: 220, justifyContent: 'center', alignItems: 'center' },
  placeholderEmoji: { fontSize: 72, opacity: 0.6 },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.xs },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  catBadge: { backgroundColor: colors.primaryLight + '15', borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  catBadgeText: { ...typography.caption, color: colors.primaryLight, fontWeight: '600' },
  subcatBadge: { backgroundColor: colors.border, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  subcatBadgeText: { ...typography.caption, color: colors.textSecondary, fontWeight: '500' },
  premiumBadge: { backgroundColor: colors.premiumBg, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.premium },
  premiumBadgeText: { ...typography.caption, color: colors.warning, fontWeight: '700' },
  verifiedBadge: { backgroundColor: colors.verifiedBg, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  verifiedBadgeText: { ...typography.caption, color: colors.verified, fontWeight: '600' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  ratingStar: { fontSize: 20, color: colors.secondary, letterSpacing: 2 },
  ratingValue: { ...typography.h4, color: colors.text, marginLeft: spacing.sm },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  iconBtnText: { fontSize: 22 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tag: { backgroundColor: colors.borderLight, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
  tagText: { ...typography.caption, color: colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  actionBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center', ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  actionEmoji: { fontSize: 26, marginBottom: spacing.xs },
  actionLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.sm, borderWidth: 1, borderColor: colors.border },
  label: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  linkText: { ...typography.body, color: colors.primaryLight, textDecorationLine: 'underline' },
  bodyText: { ...typography.body, color: colors.text },
  hourRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  hourRowToday: { backgroundColor: colors.primaryLight + '08', marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, borderRadius: borderRadius.sm },
  hourDay: { ...typography.bodySmall, color: colors.textSecondary, width: 60, fontWeight: '500' },
  hourDayToday: { color: colors.primary, fontWeight: '700' },
  hourTime: { ...typography.bodySmall, color: colors.text, flex: 1 },
  hourTimeToday: { color: colors.primary, fontWeight: '600' },
  todayDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  amenityItem: { width: '25%', alignItems: 'center', paddingVertical: spacing.md },
  amenityIcon: { fontSize: 24, marginBottom: spacing.xs },
  amenityLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  viewAll: { ...typography.bodySmall, color: colors.primaryLight, fontWeight: '600' },
  eventItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  eventTitle: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  eventDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  reviewCount: { ...typography.label, color: colors.textMuted, backgroundColor: colors.bg, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, overflow: 'hidden' },
  avgRatingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  avgStars: { fontSize: 20, color: colors.secondary, letterSpacing: 2, marginRight: spacing.sm },
  avgValue: { ...typography.h4, color: colors.text },
  reviewItem: { paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  reviewName: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  reviewDate: { ...typography.caption, color: colors.textMuted },
  reviewStars: { fontSize: 16, color: colors.secondary, letterSpacing: 1, marginBottom: spacing.xs },
  reviewText: { ...typography.bodySmall, color: colors.textSecondary },
  addReview: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg },
  starSelector: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  starOption: { fontSize: 28, color: colors.border },
  starActive: { color: colors.secondary },
  reviewInput: { ...typography.bodySmall, color: colors.text, backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: spacing.md, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  submitBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md, alignItems: 'center' },
  submitDisabled: { opacity: 0.4 },
  submitText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '700' },
  claimCard: { backgroundColor: colors.info + '10', borderRadius: borderRadius.lg, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.info + '30' },
  claimTitle: { ...typography.h4, color: colors.info, marginBottom: spacing.xs },
  claimSub: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  editBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.xxl },
  editText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '700' },
  mapCard: { backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: 'hidden', marginBottom: spacing.lg, ...shadows.md, borderWidth: 1, borderColor: colors.border },
  mapOverlay: { backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center' },
  mapOverlayText: { ...typography.bodySmall, color: colors.textInverse, fontWeight: '700' },
});
