// src/screens/Subscriptions/SubscriptionsScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Shadow } from '../../theme';
import { SubCard } from '../../components';
import { useApp } from '../../context/AppContext';
import { getNextBilling, generate12MonthProjection, formatCurrencyShort, annualEquivalent, monthlyEquivalent, formatDateFull, isLeapDaySubscription } from '../../utils/dateUtils';
import AddSubscriptionModal from './AddSubscriptionModal';
import SubDetailModal from './SubDetailModal';

export default function SubscriptionsScreen() {
  const { state, dispatch, activeSubscriptions } = useApp();
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null);

  const allSubs = state.subscriptions;

  const filtered = allSubs.filter(s => {
    if (filter === 'active') return s.active && !getNextBilling(s).isTrial;
    if (filter === 'trial') return s.active && getNextBilling(s).isTrial;
    if (filter === 'cancelled') return !s.active;
    return true;
  });

  const projection = generate12MonthProjection(activeSubscriptions);
  const total12 = projection.reduce((a, v) => a + v.total, 0);
  const totalMonthly = activeSubscriptions.reduce((a, s) => a + monthlyEquivalent(s.amount, s.cycle), 0);

  const filters = [
    { key: 'all', label: 'Tous' },
    { key: 'active', label: 'Actifs' },
    { key: 'trial', label: 'Essais' },
    { key: 'cancelled', label: 'Résiliés' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Abonnements</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Death Chart Card */}
        <View style={styles.deathCard}>
          <Text style={styles.deathLbl}>☠️  Si tu ne changes rien...</Text>
          <Text style={styles.deathTotal}>{total12.toFixed(2)} €</Text>
          <Text style={styles.deathSub}>tu dépenseras sur les 12 prochains mois</Text>

          {/* Simple bar chart */}
          <View style={styles.barChart}>
            {projection.map((m, i) => {
              const maxVal = Math.max(...projection.map(p => p.total), 1);
              const h = Math.max((m.total / maxVal) * 80, m.total > 0 ? 6 : 2);
              return (
                <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={[styles.bar, { height: h, opacity: m.total > 0 ? 1 : 0.2 }]} />
                  <Text style={styles.barLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Monthly total */}
          <View style={styles.deathStats}>
            <View>
              <Text style={styles.deathStatLbl}>Par mois</Text>
              <Text style={styles.deathStatVal}>{totalMonthly.toFixed(2)} €</Text>
            </View>
            <View>
              <Text style={styles.deathStatLbl}>Abonnements</Text>
              <Text style={styles.deathStatVal}>{activeSubscriptions.length}</Text>
            </View>
            <View>
              <Text style={styles.deathStatLbl}>Essais actifs</Text>
              <Text style={styles.deathStatVal}>{activeSubscriptions.filter(s => getNextBilling(s).isTrial).length}</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {filters.map(f => (
            <Pressable
              key={f.key}
              onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            >
              <Text style={[styles.filterTxt, filter === f.key && styles.filterTxtActive]}>{f.label}</Text>
            </Pressable>
          ))}
          <Text style={styles.subCount}>{filtered.length}</Text>
        </View>

        {/* Subscription list */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📭</Text>
            <Text style={{ fontSize: 15, color: Colors.textSecondary, marginTop: 12, fontWeight: '600' }}>
              Aucun abonnement
            </Text>
          </View>
        ) : (
          filtered.map(sub => {
            const billing = getNextBilling(sub);
            return (
              <SubCard
                key={sub.id}
                sub={sub}
                billing={billing}
                onPress={() => setSelectedSub(sub)}
              />
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddSubscriptionModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(sub) => {
          dispatch({ type: 'ADD_SUBSCRIPTION', payload: { ...sub, id: `sub_${Date.now()}`, active: true } });
          setShowAdd(false);
        }}
      />

      {selectedSub && (
        <SubDetailModal
          sub={selectedSub}
          billing={getNextBilling(selectedSub)}
          onClose={() => setSelectedSub(null)}
          onCancel={() => {
            Alert.alert(
              'Résilier ?',
              `Voulez-vous résilier ${selectedSub.name} ?`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Résilier', style: 'destructive',
                  onPress: () => {
                    dispatch({ type: 'CANCEL_SUBSCRIPTION', payload: selectedSub.id });
                    setSelectedSub(null);
                  },
                },
              ]
            );
          }}
          onGenerateLetter={() => {
            Alert.alert(
              '✉️ Lettre générée',
              `Objet: Demande de résiliation – ${selectedSub.name}\n\nBonjour,\nJe souhaite résilier mon abonnement à compter d'aujourd'hui.\nMerci de confirmer la prise en compte.\n\nCordialement`
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  addBtn: { backgroundColor: Colors.purple, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1, paddingHorizontal: 16 },

  // Death chart
  deathCard: { backgroundColor: Colors.dark, borderRadius: 20, padding: 24, marginBottom: 20, marginTop: 12 },
  deathLbl: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  deathTotal: { fontSize: 40, fontWeight: '700', color: Colors.white, letterSpacing: -1.2, lineHeight: 46 },
  deathSub: { fontSize: 14, color: Colors.textTertiary, marginTop: 8, marginBottom: 20 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 100, marginBottom: 20 },
  bar: { width: '80%', backgroundColor: Colors.purple, borderRadius: 6, opacity: 0.8 },
  barLabel: { fontSize: 9, color: Colors.textTertiary, marginTop: 6, textAlign: 'center' },
  deathStats: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  deathStatLbl: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600' },
  deathStatVal: { fontSize: 20, fontWeight: '700', color: Colors.white, marginTop: 4 },

  // Filters
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 12 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  filterBtnActive: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  filterTxt: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTxtActive: { color: Colors.white },
  subCount: { fontSize: 13, color: Colors.textTertiary, fontWeight: '600', marginLeft: 'auto' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  fab: { position: 'absolute', right: 16, bottom: 90, width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10 },
  fabText: { color: Colors.white, fontSize: 28, fontWeight: '600' },
});
