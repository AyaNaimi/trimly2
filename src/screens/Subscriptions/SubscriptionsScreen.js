// src/screens/Subscriptions/SubscriptionsScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { PremiumHaptics } from '../../utils/haptics';
import { Colors, Shadow, Fonts, Radius, Spacing, Metrics } from '../../theme';
import { SubCard } from '../../components';
import { useApp } from '../../context/AppContext';
import { getNextBilling, generate12MonthProjection, monthlyEquivalent } from '../../utils/dateUtils';
import AddSubscriptionModal from './AddSubscriptionModal';
import SubDetailModal from './SubDetailModal';
import EmailScannerModal from './EmailScannerModal';

const emptyIllustrationAsset = require('../../../assets/68749257952.mp4');

export default function SubscriptionsScreen() {
  const { 
    state, 
    dispatch, 
    activeSubscriptions,
    addSubscription,
    cancelSubscription
  } = useApp();

  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const allSubs = state.subscriptions;

  const filtered = (allSubs || []).filter(s => {
    if (!s) return false;
    if (filter === 'active') return s.active && !getNextBilling(s).isTrial;
    if (filter === 'trial') return s.active && getNextBilling(s).isTrial;
    if (filter === 'cancelled') return !s.active;
    return true;
  });

  const projection = generate12MonthProjection(activeSubscriptions);
  const total12 = projection.reduce((a, v) => a + v.total, 0);
  const totalMonthly = activeSubscriptions.reduce((a, s) => a + monthlyEquivalent(s.amount, s.cycle), 0);

  const filters = [
    { key: 'all', label: 'Projets' },
    { key: 'active', label: 'Actifs' },
    { key: 'cancelled', label: 'Archives' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Analyses</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            style={styles.scanBtnHeader}
            onPress={() => { PremiumHaptics.click(); setShowScanner(true); }}
          >
            <Text style={styles.scanBtnTextHeader}>Scan</Text>
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
          >
            <Text style={styles.addBtnText}>Nouveau</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.projectionCard}>
          <Text style={styles.projectionLabel}>Impact 12 Mois</Text>
          <Text style={styles.projectionAmt}>{total12.toLocaleString()} {state.currency}</Text>

          <View style={styles.chartWrap}>
            {projection.map((m, i) => {
              const maxVal = Math.max(...projection.map(p => p.total), 1);
              const h = Math.max((m.total / maxVal) * 60, 4);
              return (
                <View key={i} style={styles.chartCol}>
                  <View style={[styles.bar, { height: h, backgroundColor: m.total > 0 ? Colors.accent : Colors.border }]} />
                  <Text style={styles.barLbl}>{m.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.statsGrid}>
            <View>
              <Text style={styles.statLbl}>Mensuel</Text>
              <Text style={styles.statVal}>{totalMonthly.toFixed(0)} {state.currency}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.statLbl}>Actifs</Text>
              <Text style={styles.statVal}>{activeSubscriptions.length}</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}>
          {filters.map(f => (
            <Pressable
              key={f.key}
              onPress={() => { PremiumHaptics.selection(); setFilter(f.key); }}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            >
              <Text style={[styles.filterTxt, filter === f.key && styles.filterTxtActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ gap: 12 }}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <Video
                  source={emptyIllustrationAsset}
                  style={styles.emptyVideo}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  isMuted
                  useNativeControls={false}
                />
              </View>
              <Text style={styles.emptyTxt}>Pour commencer, ajoutez un abonnement ou scannez vos emails pour trouver vos plans.</Text>
              <Pressable 
                style={styles.emptyScanBtn}
                onPress={() => setShowScanner(true)}
              >
                <Text style={styles.emptyScanBtnTxt}>Scanner mes emails</Text>
              </Pressable>
            </View>
          ) : (
            filtered.map(sub => (
              <SubCard
                key={sub.id}
                sub={sub}
                billing={getNextBilling(sub)}
                onPress={() => {
                  PremiumHaptics.open();
                  setSelectedSub(sub);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => setShowAdd(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddSubscriptionModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async (sub) => {
          const ok = await addSubscription({ ...sub, active: true });
          if (ok) {
            setShowAdd(false);
            PremiumHaptics.success();
          } else {
            Alert.alert('Erreur', 'Impossible de synchroniser l abonnement.');
          }
        }}
      />

      {selectedSub && (
        <SubDetailModal
          sub={selectedSub}
          billing={getNextBilling(selectedSub)}
          onClose={() => setSelectedSub(null)}
          onCancel={() => {
            Alert.alert(
              'Resilier ?',
              `Desactiver ${selectedSub.name} ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Desactiver', style: 'destructive',
                  onPress: async () => {
                    const ok = await cancelSubscription(selectedSub.id);
                    if (ok) {
                      setSelectedSub(null);
                      PremiumHaptics.impact();
                    }
                  },
                },
              ]
            );
          }}
          onGenerateLetter={() => {
            PremiumHaptics.click();
            Alert.alert('Succes', 'Lettre preparee.');
          }}
        />
      )}

      <EmailScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onImport={async (sub) => {
          return await addSubscription(sub);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Metrics.screenPadding,
    paddingBottom: Spacing.md,
    paddingTop: Metrics.headerTop,
  },
  title: { ...Fonts.primary, ...Fonts.black, fontSize: 24, color: Colors.text, textTransform: 'uppercase', letterSpacing: 1 },
  addBtn: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, minHeight: Metrics.minTouch },
  addBtnText: { color: Colors.textSecondary, ...Fonts.primary, ...Fonts.bold, fontSize: 11, textTransform: 'uppercase' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Metrics.screenPadding, paddingBottom: Metrics.fabBottomElevated },

  projectionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.mdLg, marginBottom: Spacing.xl, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  projectionLabel: { ...Fonts.primary, fontSize: 11, ...Fonts.black, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  projectionAmt: { ...Fonts.primary, ...Fonts.black, fontSize: 36, color: Colors.text, marginTop: 4 },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', height: 80, marginVertical: 24, gap: 4 },
  chartCol: { flex: 1, alignItems: 'center' },
  bar: { width: '80%', borderRadius: Radius.pill },
  barLbl: { ...Fonts.primary, fontSize: 8, color: Colors.textMuted, marginTop: 6, textTransform: 'uppercase' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  statLbl: { ...Fonts.primary, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' },
  statVal: { ...Fonts.primary, ...Fonts.bold, fontSize: 16, color: Colors.text, marginTop: 2 },

  filterWrap: { gap: 8, marginBottom: Spacing.lg, paddingBottom: 4 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, minHeight: Metrics.minTouch,
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  filterTxt: { ...Fonts.primary, fontSize: 12, ...Fonts.bold, color: Colors.textSecondary },
  filterTxtActive: { color: Colors.bg },

  emptyState: { alignItems: 'center', paddingTop: 28, paddingBottom: 8 },
  emptyIllustration: {
    width: 178,
    height: 212,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyVideo: { width: 164, height: 200, borderRadius: 42 },
  emptyTxt: { ...Fonts.primary, fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 0, maxWidth: 260, lineHeight: 18 },
  fab: {
    position: 'absolute', right: Metrics.screenPadding, bottom: Metrics.fabBottom,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
    ...Shadow.medium,
  },
  fabText: { color: Colors.white, fontSize: 32, fontWeight: '300', marginTop: -2 },
  
  scanBtnHeader: { 
    backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 10, 
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, minHeight: Metrics.minTouch,
    alignItems: 'center', justifyContent: 'center'
  },
  scanBtnTextHeader: { color: Colors.text, ...Fonts.primary, ...Fonts.bold, fontSize: 11, textTransform: 'uppercase' },

  emptyScanBtn: {
    marginTop: 20, paddingVertical: 12, paddingHorizontal: 24,
    borderRadius: Radius.pill, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  emptyScanBtnTxt: { ...Fonts.primary, fontSize: 12, ...Fonts.bold, color: Colors.text },
});
