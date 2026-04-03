// src/screens/Reports/ReportsScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Colors, Shadow } from '../../theme';
import { useApp } from '../../context/AppContext';
import { monthlyEquivalent } from '../../utils/dateUtils';

const { width: W } = Dimensions.get('window');

export default function ReportsScreen() {
  const { state, activeSubscriptions } = useApp();

  const totalSpent = state.categories.reduce((a, c) => a + c.spent, 0);
  const totalBudget = state.categories.reduce((a, c) => a + c.budget, 0);
  const totalSubs = activeSubscriptions.reduce((a, s) => a + monthlyEquivalent(s.amount, s.cycle), 0);

  // Mock historical data for charts
  const monthNames = ['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
  const spendHistory = [420, 380, 510, 490, 440, 520, totalSpent || 340];
  const maxSpend = Math.max(...spendHistory, 1);

  // Category breakdown
  const topCats = [...state.categories]
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  // Monthly budget progress
  const budgetPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Rapports</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Stats cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLbl}>Dépensé</Text>
            <Text style={styles.statVal}>{totalSpent.toFixed(0)} €</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLbl}>Budget</Text>
            <Text style={styles.statVal}>{totalBudget.toFixed(0)} €</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLbl}>Abonnements</Text>
            <Text style={styles.statVal}>{totalSubs.toFixed(0)} €</Text>
          </View>
        </View>

        {/* Chart 1: Spend vs Budget */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Dépenses vs Budget</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.purple }]} />
              <Text style={styles.legendTxt}>Dépensé</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.border, borderWidth: 1.5, borderStyle: 'dashed' }]} />
              <Text style={styles.legendTxt}>Budgété ({totalBudget.toFixed(2)} €)</Text>
            </View>
          </View>
          {/* Simple line chart approximation */}
          <View style={styles.lineChart}>
            <View style={styles.lineTrack}>
              <View style={[styles.lineFill, { width: `${budgetPct}%`, backgroundColor: budgetPct > 100 ? Colors.red : Colors.purple }]} />
            </View>
            <Text style={[styles.lineLabel, { color: budgetPct > 100 ? Colors.red : Colors.purple }]}>
              {budgetPct.toFixed(0)}% utilisé
            </Text>
          </View>
          <View style={styles.lineLabels}>
            {['1', '8', '15', '22', 'M'].map(l => (
              <Text key={l} style={styles.lineDateLbl}>Mars {l}</Text>
            ))}
          </View>
        </View>

        {/* Chart 2: Category breakdown */}
        {topCats.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Par catégorie</Text>
            <Text style={styles.chartSub}>Ce mois</Text>
            <View style={{ gap: 10, marginTop: 8 }}>
              {topCats.map(cat => {
                const pct = totalSpent > 0 ? (cat.spent / totalSpent) * 100 : 0;
                return (
                  <View key={cat.id}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>
                        {cat.icon}  {cat.name}
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text }}>
                        {cat.spent.toFixed(2)} €
                      </Text>
                    </View>
                    <View style={styles.catBarTrack}>
                      <View style={[styles.catBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Chart 3: 7-month history */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Dépenses mensuelles</Text>
          <Text style={styles.chartSub}>7 derniers mois</Text>
          <View style={styles.barChart}>
            {spendHistory.map((v, i) => (
              <View key={i} style={styles.barCol}>
                <Text style={[styles.barValLbl, { color: i === 6 ? Colors.purple : Colors.textSecondary }]}>
                  {v.toFixed(0)}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[
                    styles.barFill,
                    { height: `${(v / maxSpend) * 100}%`, backgroundColor: i === 6 ? Colors.purple : Colors.border }
                  ]} />
                </View>
                <Text style={styles.barMonthLbl}>{monthNames[i]}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: Colors.border },
  statLbl: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  statVal: { fontSize: 22, fontWeight: '700', color: Colors.text, letterSpacing: -0.5, marginTop: 6 },
  chartCard: { backgroundColor: Colors.white, borderRadius: 18, padding: 20, marginBottom: 14, borderWidth: 1.5, borderColor: Colors.border },
  chartTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, letterSpacing: -0.3, marginBottom: 4 },
  chartSub: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginBottom: 14 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 11, height: 11, borderRadius: 5.5 },
  legendTxt: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  lineChart: { marginBottom: 12 },
  lineTrack: { height: 10, backgroundColor: Colors.border, borderRadius: 100, overflow: 'hidden', marginBottom: 8 },
  lineFill: { height: '100%', borderRadius: 100 },
  lineLabel: { fontSize: 13, fontWeight: '700' },
  lineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  lineDateLbl: { fontSize: 12, color: Colors.textTertiary },
  catBarTrack: { height: 7, backgroundColor: Colors.border, borderRadius: 100, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 100 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 7, marginTop: 14 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barValLbl: { fontSize: 11, fontWeight: '700' },
  barTrack: { flex: 1, width: '85%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barMonthLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
});
