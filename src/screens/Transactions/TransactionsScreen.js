// src/screens/Transactions/TransactionsScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { PremiumHaptics } from '../../utils/haptics';
import { Colors, Shadow, Fonts, Radius, Spacing, Layout, Metrics } from '../../theme';
import { useApp } from '../../context/AppContext';
import AddTransactionModal from '../Home/AddTransactionModal';
import {
  addMonths, addWeeks, endOfMonth, endOfWeek, formatMonthYear, formatWeekRange, startOfMonth, startOfWeek,
} from '../../utils/dateUtils';

export default function TransactionsScreen() {
  const { state, dispatch, addTransaction, deleteTransaction } = useApp();
  const [period, setPeriod] = useState('week');
  const [showAdd, setShowAdd] = useState(false);
  const [anchorDate, setAnchorDate] = useState(new Date());
  const rangeStart = period === 'week' ? startOfWeek(anchorDate) : startOfMonth(anchorDate);
  const rangeEnd = period === 'week' ? endOfWeek(anchorDate) : endOfMonth(anchorDate);

  function confirmDelete(tx) {
    Alert.alert(
      'Supprimer ?',
      `Effacer la transaction "${tx.note || tx.categoryName}" de ${tx.amount} ${state.currency} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteTransaction(tx.id);
            if (ok) {
              PremiumHaptics.impact();
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer du Cloud.');
            }
          },
        },
      ]
    );
  }

  // Filter transactions by period
  const filtered = state.transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= rangeStart && txDate <= rangeEnd;
  });

  // Group by date
  const grouped = {};
  filtered.forEach(tx => {
    const d = tx.date;
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(tx);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  // Chart data
  const bars = [];
  if (period === 'week') {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const total = (grouped[ds] || []).filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      bars.push({ label: days[i], value: total });
    }
  }

  const maxBar = Math.max(...bars.map(b => b.value), 1);
  const periodLabel = period === 'week' ? formatWeekRange(anchorDate) : formatMonthYear(anchorDate);

  function shiftPeriod(direction) {
    PremiumHaptics.selection();
    setAnchorDate(prev => (period === 'week' ? addWeeks(prev, direction) : addMonths(prev, direction)));
  }

  function goToCurrentPeriod() {
    PremiumHaptics.selection();
    setAnchorDate(new Date());
  }

  const [expandedDates, setExpandedDates] = useState({});

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Flux</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Combined Control Bar */}
        <View style={styles.controlBar}>
          {/* Shifter: Prev, This, Next */}
          <View style={styles.shifterRow}>
            <Pressable style={styles.shiftBtn} onPress={() => shiftPeriod(-1)}>
              <Text style={styles.shiftTxt}>←</Text>
            </Pressable>
            <Pressable style={styles.shiftCenter} onPress={goToCurrentPeriod}>
              <Text style={styles.shiftCenterTxt}>{periodLabel}</Text>
            </Pressable>
            <Pressable style={styles.shiftBtn} onPress={() => shiftPeriod(1)}>
              <Text style={styles.shiftTxt}>→</Text>
            </Pressable>
          </View>

          {/* Filter: Week / Month */}
          <View style={styles.filterRow}>
            {['week', 'month'].map(p => (
              <Pressable 
                key={p} 
                onPress={() => {
                  PremiumHaptics.selection();
                  setPeriod(p);
                  setAnchorDate(new Date());
                }} 
                style={[styles.filterBtn, period === p && styles.filterBtnActive]}
              >
                <Text style={[styles.filterTxt, period === p && styles.filterTxtActive]}>
                  {p === 'week' ? 'Sem.' : 'Mois'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Activité Financière</Text>
          <View style={styles.chartBars}>
            {bars.map((b, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View 
                    style={[
                      styles.barFill, 
                      { height: `${(b.value / maxBar) * 100}%`, backgroundColor: b.value > 0 ? Colors.accent : Colors.border }
                    ]} 
                  />
                </View>
                <Text style={styles.barLbl}>{b.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Spending Summary Highlight */}
        {filtered.length > 0 && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryLabelWrap}>
              <View style={styles.summaryDot} />
              <Text style={styles.summaryLabel}>Synthèse des Sorties</Text>
            </View>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryAmt, { ...Fonts.serif }]}>-{totalExpenses.toLocaleString()} {state.currency}</Text>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>HEBDO</Text>
              </View>
            </View>
          </View>
        )}

        {sortedDates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, opacity: 0.8 }}>🏜️</Text>
            <Text style={styles.emptyTxt}>Aucun flux enregistré</Text>
          </View>
        ) : (
          sortedDates.map(date => {
            const dayTxs = grouped[date];
            const isExpanded = expandedDates[date];
            const visibleTxs = isExpanded ? dayTxs : dayTxs.slice(0, 3);
            const hasMore = dayTxs.length > 3;

            return (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateSep}>
                  {new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                </Text>
                <View style={styles.groupCard}>
                  {visibleTxs.map((tx, idx) => (
                    <View key={tx.id}>
                      <Pressable 
                        onLongPress={() => {
                          PremiumHaptics.open();
                          confirmDelete(tx);
                        }}
                        style={({ pressed }) => [
                          styles.txRow,
                          pressed && { backgroundColor: Colors.surface }
                        ]}
                      >
                        <View style={[styles.txIcon, { backgroundColor: Colors.surface }]}>
                          <Text style={{ fontSize: 18 }}>{tx.icon}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                          <Text style={styles.txName}>{tx.note || tx.categoryName}</Text>
                          <Text style={styles.txCat}>{tx.categoryName}</Text>
                        </View>
                        <Text style={[styles.txAmt, { ...Fonts.serif }, tx.type === 'income' && { color: Colors.accent }]}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(0)} {state.currency}
                        </Text>
                      </Pressable>
                      {idx < visibleTxs.length - 1 && <View style={styles.rowLine} />}
                    </View>
                  ))}
                  {hasMore && !isExpanded && (
                    <Pressable 
                      style={styles.moreBtn} 
                      onPress={() => { 
                        PremiumHaptics.selection(); 
                        setExpandedDates(prev => ({ ...prev, [date]: true })); 
                      }}
                    >
                      <Text style={styles.moreBtnTxt}>···</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB - Unified Global Action */}
      <Pressable 
        style={styles.fab} 
        onPress={() => {
          PremiumHaptics.click();
          setShowAdd(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddTransactionModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        categories={state.categories}
        onSave={async (tx) => {
          const ok = await addTransaction(tx);
          if (ok) {
            setShowAdd(false);
            PremiumHaptics.success();
          } else {
            Alert.alert('Erreur', 'Impossible de synchroniser la transaction.');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Metrics.screenPadding, paddingTop: Metrics.headerTop, paddingBottom: Spacing.md },
  title: { ...Fonts.serif, fontSize: 28, color: Colors.text, letterSpacing: -1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Metrics.screenPadding, paddingBottom: 160 },

  controlBar: { flexDirection: 'row', gap: 12, marginBottom: Spacing.lg },
  shifterRow: { 
    flex: 2, flexDirection: 'row', backgroundColor: Colors.surface, 
    borderRadius: Radius.pill, padding: 2, borderWidth: 1, borderColor: Colors.border 
  },
  shiftBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  shiftTxt: { fontSize: 16, color: Colors.textSecondary },
  shiftCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shiftCenterTxt: { ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.text, textTransform: 'uppercase' },

  filterRow: { 
    flex: 1, flexDirection: 'row', backgroundColor: Colors.white, 
    borderRadius: Radius.pill, padding: 2, borderWidth: 1, borderColor: Colors.borderStrong 
  },
  filterBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 18, height: 36 },
  filterBtnActive: { backgroundColor: Colors.accent },
  filterTxt: { ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.textSecondary },
  filterTxtActive: { color: Colors.white },

  chartCard: { padding: 0, marginBottom: Spacing.lg, height: 140, backgroundColor: 'transparent' },
  chartTitle: { ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.text, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  chartBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: 4, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  barFill: { borderRadius: Radius.pill, width: '100%', opacity: 0.8 },
  barLbl: { ...Fonts.sans, fontSize: 9, color: Colors.textMuted, ...Fonts.medium, marginTop: 4 },

  summaryBox: { 
    backgroundColor: Colors.surface, padding: 16, marginBottom: Spacing.lg,
    borderLeftWidth: 4, borderLeftColor: Colors.accent,
    borderRadius: Radius.sm, // Keep it sharp/minimalist
  },
  summaryLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  summaryDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.accent },
  summaryLabel: { ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  summaryContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  summaryAmt: { fontSize: 24, color: Colors.text },
  summaryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  summaryBadgeText: { ...Fonts.sans, fontSize: 9, ...Fonts.bold, color: Colors.textSecondary },

  dateGroup: { marginBottom: Spacing.lg },
  dateSep: { 
    ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.textSecondary, 
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, marginLeft: 6 
  },
  groupCard: { 
    backgroundColor: Colors.white, borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  txRow: { 
    flexDirection: 'row', alignItems: 'center', padding: 14, minHeight: 64,
  },
  rowLine: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: 16 },
  txIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  txName: { ...Fonts.sans, fontSize: 13, ...Fonts.bold, color: Colors.text },
  txCat: { ...Fonts.sans, fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  txAmt: { fontSize: 15, color: Colors.text },

  moreBtn: { 
    paddingVertical: 4, alignItems: 'center', borderTopWidth: 0.5, borderTopColor: Colors.border, backgroundColor: Colors.surface 
  },
  moreBtnTxt: { fontSize: 28, color: Colors.textMuted, letterSpacing: 4, fontWeight: '100', marginTop: -4,fontWeight: 'bold' },

  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTxt: { ...Fonts.sans, fontSize: 16, color: Colors.textSecondary, ...Fonts.semiBold, marginTop: 16 },
  fab: { 
    position: 'absolute', right: Metrics.screenPadding, bottom: Metrics.fabBottomElevated, 
    width: 64, height: 64, borderRadius: 32, 
    backgroundColor: Colors.text, alignItems: 'center', justifyContent: 'center', 
    ...Shadow.premium, borderWidth: 4, borderColor: Colors.white 
  },
  fabText: { color: Colors.white, fontSize: 36, fontWeight: '300', marginTop: -4 },
});
