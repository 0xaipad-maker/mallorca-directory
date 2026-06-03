import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useStore, translations } from '../../store/useStore';
import { shadows } from '../../utils/theme';
import { Business } from '../../types';

export default function PlannerScreen() {
  const { language, tripPlans, activePlanId, createPlan, deletePlan, setActivePlan, addBusinessToDay, removeBusinessFromDay, updateDayNotes, renamePlan } = useStore();
  const t = translations[language];
  const router = useRouter();

  const activePlan = tripPlans.find(p => p.id === activePlanId);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [addingToDayId, setAddingToDayId] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [editingPlanName, setEditingPlanName] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');
  const [bizCache, setBizCache] = useState<Record<string, { name: string; category: string; area: string }>>({});

  useEffect(() => {
    if (!activePlan) return;
    const ids = new Set(activePlan.days.flatMap(d => d.businessIds));
    const missing = [...ids].filter(id => !bizCache[id]);
    if (missing.length === 0) return;
    (async () => {
      try {
        const { collection, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../utils/firebase');
        const snap = await getDocs(collection(db, 'businesses'));
        const map: Record<string, any> = {};
        snap.docs.forEach(d => { map[d.id] = d.data(); });
        const newCache = { ...bizCache };
        missing.forEach(id => {
          if (map[id]) {
            newCache[id] = { name: map[id].name || id, category: map[id].category || '', area: map[id].area || '' };
          } else {
            newCache[id] = { name: id, category: '', area: '' };
          }
        });
        setBizCache(newCache);
      } catch {}
    })();
  }, [activePlan?.id]);

  const selectedDay = activePlan?.days.find(d => d.id === selectedDayId) || activePlan?.days[0];

  const monthNames = useMemo(() => {
    try { return ['January','February','March','April','May','June','July','August','September','October','November','December']; }
    catch { return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; }
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    if (!newStart || !newEnd) return;
    if (newStart > newEnd) { Alert.alert('', t.plannerDateError || 'Start date must be before end date'); return; }
    createPlan(newName.trim(), newStart, newEnd);
    setShowCreate(false);
    setNewName('');
    setNewStart('');
    setNewEnd('');
    setSelectedDayId(null);
  };

  const handleDelete = (planId: string) => {
    Alert.alert(t.deletePlan || 'Delete Plan', t.deletePlanConfirm || 'Are you sure?', [
      { text: t.cancel || 'Cancel', style: 'cancel' },
      { text: t.delete || 'Delete', style: 'destructive', onPress: () => { deletePlan(planId); setSelectedDayId(null); } },
    ]);
  };

  const handleAddBusiness = () => {
    setShowBusinessModal(true);
  };

  const handleSelectBusiness = (business: Business) => {
    if (!activePlan || !addingToDayId) return;
    addBusinessToDay(activePlan.id, addingToDayId, business.id);
    setShowBusinessModal(false);
    setAddingToDayId(null);
  };

  const handleSaveNotes = () => {
    if (!activePlan || !showNotes) return;
    updateDayNotes(activePlan.id, showNotes, notesText);
    setShowNotes(null);
    setNotesText('');
  };

  const handleRename = (planId: string) => {
    if (!editNameText.trim()) return;
    renamePlan(planId, editNameText.trim());
    setEditingPlanName(null);
    setEditNameText('');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return `${monthNames[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const dayLabel = d.toLocaleDateString(language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : 'es-ES', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthAbbr = monthNames[d.getMonth()].slice(0, 3);
    return { dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1), dayNum, monthAbbr, month: monthNames[d.getMonth()], full: monthNames[d.getMonth()] + ' ' + dayNum };
  };

  const today = new Date().toISOString().split('T')[0];

  if (!activePlan) {
    return (
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>📅</Text>
          <Text style={styles.heroTitle}>{t.planner || 'Trip Planner'}</Text>
          <Text style={styles.heroSub}>{t.plannerSub || 'Plan your days on Mallorca'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.planListContent}>
          {tripPlans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyTitle}>{t.noPlans || 'No plans yet'}</Text>
              <Text style={styles.emptySub}>{t.noPlansSub || 'Create your first trip plan to get started'}</Text>
            </View>
          ) : (
            tripPlans.map(plan => {
              const startD = formatDate(plan.startDate);
              const endD = formatDate(plan.endDate);
              const isActive = plan.id === activePlanId;
              return (
                <TouchableOpacity key={plan.id} style={[styles.planCard, isActive && styles.planCardActive]} onPress={() => { setActivePlan(plan.id); setSelectedDayId(null); }}>
                  <View style={styles.planCardTop}>
                    {editingPlanName === plan.id ? (
                      <TextInput style={styles.planNameInput} value={editNameText} onChangeText={setEditNameText} onBlur={() => handleRename(plan.id)} onSubmitEditing={() => handleRename(plan.id)} autoFocus />
                    ) : (
                      <Text style={styles.planCardName} onLongPress={() => { setEditingPlanName(plan.id); setEditNameText(plan.name); }}>{plan.name}</Text>
                    )}
                    <Text style={styles.planCardDates}>{startD} — {endD}</Text>
                  </View>
                  <View style={styles.planCardMeta}>
                    <Text style={styles.planCardDays}>{plan.days.length} {t.days || 'days'} · {plan.days.reduce((sum, d) => sum + d.businessIds.length, 0)} {t.places || 'places'}</Text>
                  </View>
                  <View style={styles.planCardActions}>
                    <TouchableOpacity style={styles.planCardBtn} onPress={() => { setActivePlan(plan.id); setSelectedDayId(null); }}>
                      <Text style={styles.planCardBtnText}>{t.open || 'Open'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.planCardDel} onPress={() => handleDelete(plan.id)}>
                      <Text style={styles.planCardDelText}>{t.delete || 'Delete'}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {showCreate && (
          <Modal transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t.newPlan || 'New Trip Plan'}</Text>
                <TextInput style={styles.modalInput} placeholder={t.planName || 'Trip name...'} placeholderTextColor="#94a3b8" value={newName} onChangeText={setNewName} />
                <Text style={styles.modalLabel}>{t.startDate || 'Start Date'}</Text>
                <TextInput style={styles.modalInput} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={newStart} onChangeText={setNewStart} />
                <Text style={styles.modalLabel}>{t.endDate || 'End Date'}</Text>
                <TextInput style={styles.modalInput} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={newEnd} onChangeText={setNewEnd} />
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCreate(false)}><Text style={styles.modalCancelText}>{t.cancel || 'Cancel'}</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.modalConfirm} onPress={handleCreate}><Text style={styles.modalConfirmText}>{t.create || 'Create'}</Text></TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  const plan = activePlan;
  const day = selectedDay || plan.days[0];

  return (
    <View style={styles.container}>
      <View style={styles.planHero}>
        <View style={styles.planHeroTop}>
          <TouchableOpacity onPress={() => setActivePlan(null)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← {t.back || 'Back'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(plan.id)}>
            <Text style={styles.deleteText}>{t.delete || 'Delete'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.planHeroName}>{plan.name}</Text>
        <Text style={styles.planHeroDates}>{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</Text>
        <Text style={styles.planHeroDays}>{plan.days.length} {t.days || 'days'} · {plan.days.reduce((s, d) => s + d.businessIds.length, 0)} {t.places || 'places'}</Text>
      </View>

      <View style={styles.dayStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStripInner}>
          {plan.days.map(d => {
            const f = formatDay(d.date);
            const isActive = d.id === day.id;
            const isToday = d.date === today;
            const itemCount = d.businessIds.length;
            return (
              <TouchableOpacity key={d.id} style={[styles.dayChip, isActive && styles.dayChipActive]} onPress={() => { setSelectedDayId(d.id); }}>
                <Text style={[styles.dayChipLabel, isActive && styles.dayChipLabelActive]}>{f.dayLabel}</Text>
                <Text style={[styles.dayChipNum, isActive && styles.dayChipNumActive]}>{f.dayNum}</Text>
                <Text style={[styles.dayChipMonth, isActive && styles.dayChipMonthActive]}>{f.monthAbbr}</Text>
                {itemCount > 0 && <View style={styles.dayChipBadge}><Text style={styles.dayChipBadgeText}>{itemCount}</Text></View>}
                {isToday && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.dayContent} showsVerticalScrollIndicator={false}>
        {day.businessIds.length === 0 ? (
          <View style={styles.dayEmpty}>
            <Text style={styles.dayEmptyIcon}>📌</Text>
            <Text style={styles.dayEmptyTitle}>{t.dayEmpty || 'Nothing planned yet'}</Text>
            <Text style={styles.dayEmptySub}>{t.dayEmptySub || 'Tap + to add businesses and events to this day'}</Text>
          </View>
        ) : (
          day.businessIds.map((bizId, index) => {
            const b = bizCache[bizId];
            return (
              <TouchableOpacity key={bizId} style={styles.bizCard} onPress={() => router.push(`/business/${bizId}`)}>
                <View style={styles.bizCardLeft}>
                  <View style={styles.bizCardIndex}>
                    <Text style={styles.bizCardIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.bizCardInfo}>
                    <Text style={styles.bizCardName}>{b?.name || bizId}</Text>
                    {b?.category && <Text style={styles.bizCardMeta}>{b.category}{b.area ? ` · ${b.area}` : ''}</Text>}
                  </View>
                </View>
                <TouchableOpacity style={styles.bizCardRemove} onPress={(e) => { e.stopPropagation(); removeBusinessFromDay(plan.id, day.id, bizId); }}>
                  <Text style={styles.bizCardRemoveText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {day.notes ? (
          <TouchableOpacity style={styles.notesCard} onPress={() => { setShowNotes(day.id); setNotesText(day.notes || ''); }}>
            <Text style={styles.notesCardLabel}>{t.notes || 'Notes'}</Text>
            <Text style={styles.notesCardText}>{day.notes}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.addNoteBtn} onPress={() => { setShowNotes(day.id); setNotesText(day.notes || ''); }}>
          <Text style={styles.addNoteBtnText}>{day.notes ? t.editNotes || 'Edit notes' : t.addNotes || 'Add notes'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.dayActions}>
        <TouchableOpacity style={styles.addBizBtn} onPress={() => { setAddingToDayId(day.id); setShowBusinessModal(true); }}>
          <Text style={styles.addBizBtnText}>+ {t.addPlace || 'Add Place'}</Text>
        </TouchableOpacity>
      </View>

      {showNotes && (
        <Modal transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.notes || 'Notes'}</Text>
              <TextInput style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]} multiline placeholder={t.notesPlaceholder || 'Write your notes here...'} placeholderTextColor="#94a3b8" value={notesText} onChangeText={setNotesText} />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowNotes(null)}><Text style={styles.modalCancelText}>{t.cancel || 'Cancel'}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirm} onPress={handleSaveNotes}><Text style={styles.modalConfirmText}>{t.save || 'Save'}</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {showBusinessModal && (
        <BusinessSearchModal
          onSelect={handleSelectBusiness}
          onClose={() => { setShowBusinessModal(false); setAddingToDayId(null); }}
          language={language}
          translations={t}
          dayId={addingToDayId}
        />
      )}
    </View>
  );
}

function BusinessSearchModal({ onSelect, onClose, language, translations: t, dayId }: {
  onSelect: (b: Business) => void;
  onClose: () => void;
  language: string;
  translations: any;
  dayId: string | null;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const mod = await import('firebase/firestore');
      const { collection, getDocs, orderBy, limit } = mod;
      const fq = mod.query;
      const { db } = await import('../../utils/firebase');
      const snap = await getDocs(fq(collection(db, 'businesses'), orderBy('name'), limit(20)));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const ql = q.toLowerCase();
      const filtered = all.filter(b => b.name?.toLowerCase().includes(ql) || b.category?.toLowerCase().includes(ql) || b.area?.toLowerCase().includes(ql));
      setResults(filtered);
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <Modal transparent animationType="slide">
      <View style={styles.bizModalOverlay}>
        <View style={styles.bizModalContent}>
          <View style={styles.bizModalHeader}>
            <Text style={styles.bizModalTitle}>{t.addPlace || 'Add Place'}</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.bizModalClose}>✕</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.bizModalSearch} placeholder={t.search || 'Search...'} placeholderTextColor="#94a3b8" value={query} onChangeText={handleSearch} autoFocus />
          {loading && <Text style={styles.bizLoading}>{t.loading || 'Loading...'}</Text>}
          <ScrollView style={styles.bizModalList}>
            {results.length === 0 && query.length >= 2 && !loading && (
              <Text style={styles.bizNoResults}>{t.noResults || 'No results found'}</Text>
            )}
            {results.map(b => (
              <TouchableOpacity key={b.id} style={styles.bizResultItem} onPress={() => onSelect(b as Business)}>
                <View style={styles.bizResultEmoji}>
                  <Text style={styles.bizResultEmojiText}>📍</Text>
                </View>
                <View style={styles.bizResultInfo}>
                  <Text style={styles.bizResultName}>{b.name}</Text>
                  <Text style={styles.bizResultMeta}>{b.category} · {b.area}</Text>
                </View>
                <Text style={styles.bizResultAdd}>+</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Container
  container: { flex: 1, backgroundColor: '#f8fafc' },
  // Hero (list view)
  hero: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 36, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  heroIcon: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 28, fontWeight: '700', color: '#fff' },
  heroSub: { fontSize: 14, color: '#c4b5fd', marginTop: 4, lineHeight: 20 },
  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptySub: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', maxWidth: 240 },
  // Plan cards
  planListContent: { padding: 16, paddingBottom: 100 },
  planCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', ...shadows.sm },
  planCardActive: { borderColor: '#4f46e5', borderWidth: 2 },
  planCardTop: { marginBottom: 8 },
  planCardName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  planCardDates: { fontSize: 13, color: '#64748b' },
  planCardMeta: { marginBottom: 10 },
  planCardDays: { fontSize: 12, color: '#94a3b8' },
  planCardActions: { flexDirection: 'row', gap: 8 },
  planCardBtn: { backgroundColor: '#4f46e5', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  planCardBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  planCardDel: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  planCardDelText: { fontSize: 13, color: '#ef4444' },
  planNameInput: { fontSize: 16, fontWeight: '600', color: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#4f46e5', paddingVertical: 2 },
  // FAB
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', elevation: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  fabText: { fontSize: 28, color: '#fff', marginTop: -2 },
  // Create modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', maxWidth: 360 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, marginTop: 8 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0f172a', marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16, justifyContent: 'flex-end' },
  modalCancel: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  modalCancelText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  modalConfirm: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: '#4f46e5' },
  modalConfirmText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  // Plan hero (detail view)
  planHero: { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 },
  planHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backBtn: {},
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#c4b5fd' },
  deleteText: { fontSize: 14, fontWeight: '600', color: '#fca5a5' },
  planHeroName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  planHeroDates: { fontSize: 13, color: '#c4b5fd', marginBottom: 4 },
  planHeroDays: { fontSize: 13, color: '#a78bfa' },
  // Day strip
  dayStrip: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', ...shadows.sm },
  dayStripInner: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  dayChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9', minWidth: 60, position: 'relative' },
  dayChipActive: { backgroundColor: '#4f46e5' },
  dayChipLabel: { fontSize: 10, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' as const },
  dayChipLabelActive: { color: '#c4b5fd' },
  dayChipNum: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginVertical: 2 },
  dayChipNumActive: { color: '#fff' },
  dayChipMonth: { fontSize: 10, color: '#94a3b8' },
  dayChipMonthActive: { color: '#a78bfa' },
  dayChipBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#f59e0b', borderRadius: 8, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  dayChipBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#22c55e', marginTop: 2 },
  // Day content
  dayContent: { padding: 16, paddingBottom: 100 },
  dayEmpty: { alignItems: 'center', paddingTop: 40 },
  dayEmptyIcon: { fontSize: 48, marginBottom: 12 },
  dayEmptyTitle: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  dayEmptySub: { fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center', maxWidth: 260 },
  // Business cards in day
  bizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0', ...shadows.sm },
  bizCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  bizCardIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eef2ff', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  bizCardIndexText: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  bizCardInfo: { flex: 1 },
  bizCardName: { fontSize: 14, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  bizCardMeta: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  bizCardDetails: { fontSize: 12, color: '#4f46e5' },
  bizCardRemove: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
  bizCardRemoveText: { fontSize: 12, color: '#ef4444', fontWeight: '700' },
  // Notes
  notesCard: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: '#fde68a' },
  notesCardLabel: { fontSize: 11, fontWeight: '700', color: '#b45309', textTransform: 'uppercase' as const, marginBottom: 4 },
  notesCardText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  addNoteBtn: { marginTop: 8, alignItems: 'center', paddingVertical: 10 },
  addNoteBtnText: { fontSize: 13, color: '#4f46e5', fontWeight: '600' },
  // Day actions bar
  dayActions: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  addBizBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  addBizBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  // Business search modal
  bizModalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  bizModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '80%' },
  bizModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  bizModalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  bizModalClose: { fontSize: 20, color: '#94a3b8' },
  bizModalSearch: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15, color: '#0f172a', marginBottom: 12 },
  bizLoading: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontSize: 13 },
  bizModalList: { maxHeight: 400 },
  bizNoResults: { textAlign: 'center', color: '#94a3b8', paddingVertical: 20, fontSize: 13 },
  bizResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  bizResultEmoji: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bizResultEmojiText: { fontSize: 18 },
  bizResultInfo: { flex: 1 },
  bizResultName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  bizResultMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  bizResultAdd: { fontSize: 20, color: '#4f46e5', fontWeight: '700' },
});
