// src/screens/Reports/ReportsScreen.js
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions, Pressable } from 'react-native';
import { Colors, Fonts, Radius, Spacing, Layout, Metrics } from '../../theme';
import { useApp } from '../../context/AppContext';
import { monthlyEquivalent } from '../../utils/dateUtils';
import { PremiumHaptics } from '../../utils/haptics';

export default function ReportsScreen() {
  const { state, activeSubscriptions } = useApp();
  const [timeRange, setTimeRange] = useState('thisMonth');

  const totalSpent = state.categories.reduce((a, c) => a + c.spent, 0);
  const totalBudget = state.categories.reduce((a, c) => a + c.budget, 0);
  const totalSubs = activeSubscriptions.reduce((a, s) => a + monthlyEquivalent(s.amount, s.cycle), 0);

  // Mock historical data for trends
  const monthNames = ['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar'];
  const spendHistory = [420, 380, 510, 490, 440, 520, totalSpent || 340];
  const maxSpend = Math.max(...spendHistory, 1);

  // Category breakdown
  const topCats = [...state.categories]
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const budgetPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const isOverBudget = totalSpent > totalBudget && totalBudget > 0;

  const timeRanges = [
    { key: 'thisMonth', label: 'Ce Mois' },
    { key: 'last3Months', label: '3 Mois' },
    { key: 'ytd', label: 'YTD' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Analyses</Text>
          <Text style={styles.subtitle}>Votre panorama financier intelligent</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeRangeScroll}
          contentContainerStyle={styles.timeRangeContent}
        >
          {timeRanges.map(range => (
            <Pressable
              key={range.key}
              onPress={() => {
                PremiumHaptics.selection();
                setTimeRange(range.key);
              }}
              style={[styles.timeRangeBtn, timeRange === range.key && styles.timeRangeBtnActive]}
            >
              <Text style={[styles.timeRangeTxt, timeRange === range.key && styles.timeRangeTxtActive]}>
                {range.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Global Summary Dashboard */}
        <View style={styles.statsContainer}>
          <View style={styles.statLine}>
            <View>
              <Text style={styles.statLabel}>Total Dépensé</Text>
              <Text style={[styles.statValue, { ...Fonts.serif }]}>{totalSpent.toLocaleString()} {state.currency}</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: isOverBudget ? Colors.errorSoft : Colors.accentSoft }]}>
              <Text style={[styles.statBadgeText, { color: isOverBudget ? Colors.error : Colors.accent }]}>
                {isOverBudget ? 'Budget Dépassé' : 'Gestion Optimale'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={[styles.miniStat, Layout.interactiveCard]}>
              <Text style={styles.miniLabel}>Budget Prévu</Text>
              <Text style={[styles.miniValue, { ...Fonts.serif }]}>{totalBudget.toLocaleString()} {state.currency}</Text>
            </View>
            <View style={[styles.miniStat, Layout.interactiveCard]}>
              <Text style={styles.miniLabel}>Abonnements</Text>
              <Text style={[styles.miniValue, { ...Fonts.serif }]}>{totalSubs.toLocaleString()} {state.currency}</Text>
            </View>
          </View>
        </View>

        {/* Component: Budget Health Meter */}
        <View style={[Layout.premiumCard, styles.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Santé du Budget</Text>
            <Text style={[styles.cardValue, { color: isOverBudget ? Colors.error : Colors.accent }]}>
              {budgetPct.toFixed(0)}%
            </Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(budgetPct, 100)}%`, 
                    backgroundColor: isOverBudget ? Colors.error : Colors.accent 
                  }
                ]} 
              />
            </View>
            {isOverBudget && <Text style={styles.warningText}>Attention : Seuil limite franchi</Text>}
          </View>
          
          <View style={styles.cardFooter}>
            <Text style={styles.footerLabel}>Capacité restante</Text>
            <Text style={[styles.footerValue, { ...Fonts.serif }]}>
              {Math.max(totalBudget - totalSpent, 0).toLocaleString()} {state.currency}
            </Text>
          </View>
        </View>

        {/* Component: Intelligence by Category */}
        {topCats.length > 0 && (
          <View style={[Layout.premiumCard, styles.card]}>
            <Text style={styles.cardHeaderTitle}>Distribution par Poste</Text>
            <View style={styles.catList}>
              {topCats.map(cat => {
                const pct = totalSpent > 0 ? (cat.spent / totalSpent) * 100 : 0;
                return (
                  <View key={cat.id} style={styles.catItem}>
                    <View style={styles.catHeader}>
                      <View style={styles.catNameContainer}>
                        <View style={styles.circularIconBg}>
                          <Text style={styles.catIcon}>{cat.icon}</Text>
                        </View>
                        <View>
                          <Text style={styles.catName}>{cat.name}</Text>
                          <Text style={styles.catPct}>{pct.toFixed(0)}% du total</Text>
                        </View>
                      </View>
                      <Text style={[styles.catAmount, { ...Fonts.serif }]}>{cat.spent.toLocaleString()} {state.currency}</Text>
                    </View>
                    <View style={styles.miniProgressTrack}>
                      <View style={[styles.miniProgressFill, { width: `${pct}%`, backgroundColor: Colors.accent }]}>
                         {/* Optional Gradient can go here */}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Component: Velocity Trend Chart */}
        <View style={[Layout.premiumCard, styles.card]}>
          <Text style={styles.cardHeaderTitle}>Évolution Temporelle</Text>
          <View style={styles.trendChart}>
            {spendHistory.map((v, i) => {
              const isCurrent = i === 6;
              return (
                <View key={i} style={styles.trendCol}>
                  <View style={styles.trendBarContainer}>
                    <View 
                      style={[
                        styles.trendBar, 
                        { 
                          height: `${(v / maxSpend) * 100}%`,
                          backgroundColor: isCurrent ? Colors.accent : Colors.borderStrong,
                          opacity: isCurrent ? 1 : 0.4
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.trendLabel, isCurrent && styles.trendLabelActive]}>
                    {monthNames[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { 
    paddingHorizontal: Metrics.screenPadding,
    paddingTop: Metrics.headerTop,
    paddingBottom: Spacing.lg,
  },
  title: { 
    ...Fonts.serif, 
    fontSize: 28, 
    color: Colors.text, 
    letterSpacing: -1 
  },
  subtitle: { 
    ...Fonts.sans, 
    fontSize: 13, 
    color: Colors.textSecondary, 
    marginTop: 4,
    letterSpacing: 0.2
  },
  timeRangeScroll: {
    marginTop: Spacing.md,
    marginHorizontal: -Metrics.screenPadding,
    paddingHorizontal: Metrics.screenPadding,
  },
  timeRangeContent: {
    gap: Spacing.sm,
  },
  timeRangeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: Metrics.minTouch - 12,
  },
  timeRangeBtnActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  timeRangeTxt: {
    ...Fonts.sans,
    fontSize: 11,
    color: Colors.textSecondary,
    ...Fonts.bold,
    textTransform: 'uppercase',
  },
  timeRangeTxtActive: {
    color: Colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: { 
    paddingBottom: 160,
  },
  statsContainer: { 
    marginHorizontal: Metrics.screenPadding,
    marginBottom: Spacing.xl,
  },
  statLine: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: Spacing.lg
  },
  statLabel: { 
    ...Fonts.sans, 
    ...Fonts.bold, 
    fontSize: 10, 
    color: Colors.textSecondary, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  statValue: { 
    fontSize: 24, 
    color: Colors.text, 
    marginTop: 2,
    letterSpacing: -0.5
  },
  statBadge: { 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: Radius.pill 
  },
  statBadgeText: { 
    ...Fonts.sans, 
    ...Fonts.black, 
    fontSize: 9, 
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  statsGrid: { 
    flexDirection: 'row', 
    gap: Spacing.md,
  },
  miniStat: { 
    flex: 1, 
    backgroundColor: Colors.white, 
    borderRadius: Radius.lg, 
    padding: Spacing.md,
  },
  miniLabel: { 
    ...Fonts.sans, 
    ...Fonts.bold, 
    fontSize: 10, 
    color: Colors.textSecondary, 
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  miniValue: { 
    fontSize: 15, 
    color: Colors.text 
  },
  card: { 
    marginHorizontal: Metrics.screenPadding,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    marginBottom: Spacing.lg
  },
  cardTitle: { 
    ...Fonts.serif, 
    fontSize: 15, 
    color: Colors.text 
  },
  cardHeaderTitle: {
    ...Fonts.serif, 
    fontSize: 15, 
    color: Colors.text,
    marginBottom: Spacing.sm
  },
  cardValue: { 
    ...Fonts.sans, 
    ...Fonts.black, 
    fontSize: 20, 
    letterSpacing: -0.5
  },
  progressContainer: { 
    marginBottom: Spacing.lg 
  },
  progressTrack: { 
    height: 4, 
    backgroundColor: Colors.surface, 
    borderRadius: Radius.pill, 
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: Colors.border
  },
  progressFill: { 
    height: '100%', 
    borderRadius: Radius.pill 
  },
  warningText: { 
    ...Fonts.sans, 
    ...Fonts.bold, 
    fontSize: 12, 
    color: Colors.error, 
    marginTop: 10 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingTop: Spacing.lg,
    borderTopWidth: 1.5,
    borderTopColor: Colors.borderSoft
  },
  footerLabel: { 
    ...Fonts.sans, 
    ...Fonts.semiBold,
    fontSize: 12, 
    color: Colors.textSecondary 
  },
  footerValue: { 
    fontSize: 14, 
    color: Colors.text 
  },
  catList: { 
    marginTop: Spacing.sm 
  },
  catItem: { 
    marginBottom: Spacing.lg,
  },
  catHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 12 
  },
  catNameContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14 
  },
  circularIconBg: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderSoft
  },
  catIcon: { 
    fontSize: 14 
  },
  catName: { 
    ...Fonts.sans, 
    ...Fonts.bold, 
    fontSize: 14, 
    color: Colors.text 
  },
  catPct: {
    ...Fonts.sans,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1
  },
  catAmount: { 
    fontSize: 14, 
    color: Colors.text 
  },
  miniProgressTrack: { 
    height: 6, 
    backgroundColor: Colors.surface, 
    borderRadius: Radius.pill 
  },
  miniProgressFill: { 
    height: '100%', 
    borderRadius: Radius.pill 
  },
  trendChart: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    height: 120, 
    gap: 12, 
    marginTop: Spacing.sm 
  },
  trendCol: { 
    flex: 1, 
    alignItems: 'center' 
  },
  trendBarContainer: { 
    flex: 1, 
    width: '100%', 
    justifyContent: 'flex-end', 
    alignItems: 'center' 
  },
  trendBar: { 
    width: 10, 
    borderRadius: Radius.pill 
  },
  trendLabel: { 
    ...Fonts.sans, 
    ...Fonts.semiBold, 
    fontSize: 11, 
    color: Colors.textSecondary, 
    marginTop: 12 
  },
  trendLabelActive: { 
    color: Colors.accent, 
    ...Fonts.bold 
  },
});
