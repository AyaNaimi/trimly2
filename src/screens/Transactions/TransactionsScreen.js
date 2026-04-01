// src/screens/Transactions/TransactionsScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Shadow } from '../../theme';
import { useApp } from '../../context/AppContext';
import AddTransactionModal from '../Home/AddTransactionModal';

export default function TransactionsScreen() {
  const { state, dispatch } = useApp();
  const [period, setPeriod] = useState('week');
  const [showAdd, setShowAdd] = useState(false);

  const now = new Date();

  // Filter transactions by period
  const filtered = state.transactions.filter(tx => {
    const txDate = new Date(tx.date);
    if (period === 'week') {
      const day = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      mon.setHours(0, 0, 0, 0);
      return txDate >= mon;
    } else {
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }
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

  // Bar chart data (daily for week, weekly for month)
  const bars = [];
  if (period === 'week') {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      const dayOfWeek = now.getDay();
      d.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + i);
      const ds = d.toISOString().split('T')[0];
      const total = (grouped[ds] || []).filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
      bars.push({ label: days[i], value: total });
    }
  }

  const maxBar = Math.max(...bars.map(b => b.value), 1);

  const periodLabel = period === 'week'
    ? `${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} (semaine)`
    : now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Period selector */}
        <View style={styles.periodRow}>
          <View style={styles.periodNav}>
            <Pressable><Text style={{ color: Colors.purple, fontSize: 18 }}>‹</Text></Pressable>
            <Text style={styles.periodLabel}>{periodLabel}</Text>
            <Pressable><Text style={{ color: Colors.purple, fontSize: 18 }}>›</Text></Pressable>
          </View>
          <View style={styles.pillToggle}>
            {['week', 'month'].map(p => (
              <Pressable key={p} onPress={() => { Haptics.selectionAsync(); setPeriod(p); }} style={[styles.pillBtn, period === p && styles.pillBtnActive]}>
                <Text style={[styles.pillTxt, period === p && styles.pillTxtActive]}>
                  {p === 'week' ? 'Semaine' : 'Mois'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Bar chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {bars.map((b, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${(b.value / maxBar) * 100}%`, opacity: b.value > 0 ? 1 : 0.15 }]} />
                </View>
                <Text style={styles.barLbl}>{b.label}</Text>
              </View>
            ))}
          </View>
          {/* Y axis labels */}
          <View style={styles.yAxis}>
            {[100, 75, 50, 25, 0].map(v => (
              <Text key={v} style={styles.yLbl}>{Math.round((maxBar * v) / 100)} €</Text>
            ))}
          </View>
        </View>

        {/* Total */}
        {filtered.length > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLbl}>Total dépensé</Text>
            <Text style={styles.totalAmt}>-{totalExpenses.toFixed(2)} €</Text>
          </View>
        )}

        {/* Grouped transactions */}
        {sortedDates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🏜️</Text>
            <Text style={styles.emptyTxt}>Aucune transaction</Text>
          </View>
        ) : (
          sortedDates.map(date => (
            <View key={date}>
              <Text style={styles.dateSep}>
                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              {grouped[date].map(tx => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: tx.color + '22' }]}>
                    <Text style={{ fontSize: 17 }}>{tx.icon}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.txName}>{tx.note}</Text>
                    <Text style={styles.txCat}>{tx.categoryName}</Text>
                  </View>
                  <Text style={[styles.txAmt, tx.type === 'income' && { color: Colors.green }]}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)} €
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <AddTransactionModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        categories={state.categories}
        onSave={(tx) => {
          dispatch({ type: 'ADD_TRANSACTION', payload: { ...tx, id: `tx_${Date.now()}` } });
          setShowAdd(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  periodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  periodNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  periodLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  pillToggle: { flexDirection: 'row', backgroundColor: Colors.white, borderRadius: 100, padding: 3, borderWidth: 1.5, borderColor: Colors.border },
  pillBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  pillBtnActive: { backgroundColor: Colors.purple },
  pillTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  pillTxtActive: { color: '#fff' },
  chartCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row' },
  chartBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 4 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { flex: 1, width: '80%', justifyContent: 'flex-end' },
  barFill: { backgroundColor: Colors.purple, borderRadius: 4, width: '100%' },
  barLbl: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  yAxis: { justifyContent: 'space-between', height: 120, marginLeft: 8 },
  yLbl: { fontSize: 10, color: Colors.textSecondary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: Colors.border },
  totalLbl: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  totalAmt: { fontSize: 16, fontWeight: '800', color: Colors.red },
  dateSep: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'capitalize', marginTop: 12, marginBottom: 8, marginLeft: 2 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, padding: 12, marginBottom: 7, borderWidth: 1.5, borderColor: Colors.border },
  txIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  txName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  txCat: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginTop: 1 },
  txAmt: { fontSize: 15, fontWeight: '800', color: Colors.red },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTxt: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600', marginTop: 12 },
  fab: { position: 'absolute', right: 16, bottom: 90, width: 54, height: 54, borderRadius: 27, backgroundColor: '#0F0F1A', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
