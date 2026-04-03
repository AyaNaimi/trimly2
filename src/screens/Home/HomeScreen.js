// src/screens/Home/HomeScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PremiumHaptics } from '../../utils/haptics';
import { Colors, Shadow, Spacing } from '../../theme';
import {
  CategoryRow, TrialBanner, AlertBanner, PeriodPill,
  CategorySection,
} from '../../components';
import { useApp } from '../../context/AppContext';
import { getNextBilling, getPeriodLabel, daysLeftInPeriod } from '../../utils/dateUtils';
import AddTransactionModal from './AddTransactionModal';
import AddCategoryModal from './AddCategoryModal';

export default function HomeScreen({ navigation }) {
  const { state, trialDaysLeft, dispatch, activeSubscriptions } = useApp();
  const [period, setPeriod] = useState('monthly');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [showTrial, setShowTrial] = useState(true);
  const [incomeExpanded, setIncomeExpanded] = useState(false);

  // Filter cats by period
  const weeklyCats = state.categories.filter(c => c.cycle === 'weekly');
  const monthlyCats = state.categories.filter(c => c.cycle === 'monthly');

  // Subscription alerts (≤ 2 days before charge)
  const urgentAlerts = activeSubscriptions
    .map(sub => ({ sub, billing: getNextBilling(sub) }))
    .filter(({ billing }) => !billing.isTrial && billing.daysUntilCharge <= 2)
    .sort((a, b) => a.billing.daysUntilCharge - b.billing.daysUntilCharge);

  const weeklyBudget = weeklyCats.reduce((a, c) => a + c.budget, 0);
  const weeklySpent = weeklyCats.reduce((a, c) => a + c.spent, 0);
  const monthlyBudget = monthlyCats.reduce((a, c) => a + c.budget, 0);
  const monthlySpent = monthlyCats.reduce((a, c) => a + c.spent, 0);

  const togglePeriod = () => {
    PremiumHaptics.selection(); // Smoother than selectionAsync
    setPeriod(p => p === 'monthly' ? 'weekly' : 'monthly');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>🐾</Text>
          <Text style={styles.logoTitle}>Trimly</Text>
        </View>
        <PeriodPill label={getPeriodLabel(period)} onPress={togglePeriod} />
        <Pressable style={styles.editBtn} onPress={() => {}}>
          <Text style={{ color: Colors.purple, fontSize: 18 }}>⊘</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Trial banner */}
        {state.trial?.active && trialDaysLeft > 0 && showTrial && (
          <TrialBanner
            daysLeft={trialDaysLeft}
            onSubscribe={() => navigation.navigate('Settings')}
            onClose={() => setShowTrial(false)}
          />
        )}

        {/* Subscription alerts */}
        <AlertBanner alerts={urgentAlerts} />

        {/* Income row */}
        <Pressable style={styles.incomeCard} onPress={() => setIncomeExpanded(!incomeExpanded)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 22 }}>💸</Text>
            <Text style={styles.incomeTitle}>Revenus</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={styles.incomeAmt}>
              {state.income > 0 ? `+${state.income.toFixed(2)} €` : '$0.00'}
            </Text>
            <Text style={{ color: Colors.green, fontSize: 14 }}>▾</Text>
          </View>
        </Pressable>

        {/* Weekly categories */}
        {weeklyCats.length > 0 && (
          <CategorySection
            label="Hebdomadaire"
            daysLeft={daysLeftInPeriod('weekly')}
            budgeted={weeklyBudget}
            left={weeklyBudget - weeklySpent}
          >
            {weeklyCats.map(cat => (
              <CategoryRow
                key={cat.id}
                category={cat}
                onPress={() => {}}
                simple
              />
            ))}
          </CategorySection>
        )}

        {/* Monthly categories */}
        {monthlyCats.length > 0 && (
          <CategorySection
            label="Mensuel"
            daysLeft={daysLeftInPeriod('monthly')}
            budgeted={monthlyBudget}
            left={monthlyBudget - monthlySpent}
          >
            {monthlyCats.map(cat => (
              <CategoryRow
                key={cat.id}
                category={cat}
                onPress={() => {}}
                simple
              />
            ))}
          </CategorySection>
        )}

        {/* Add category button */}
        <Pressable 
          style={styles.addCatBtn} 
          onPress={() => {
            PremiumHaptics.click();
            setShowAddCat(true);
          }}
        >
          <Text style={styles.addCatText}>+ Ajouter une catégorie</Text>
        </Pressable>

        {/* Quick subs summary */}
        {activeSubscriptions.length > 0 && (
          <Pressable
            style={styles.subsCard}
            onPress={() => {
              PremiumHaptics.open(); // Fancy compound feel
              navigation.navigate('Subscriptions');
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: Colors.textSecondary }}>Abonnements</Text>
              <Text style={{ fontSize: 13, color: Colors.purple, fontWeight: '500' }}>Voir tout →</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', letterSpacing: -1 }}>
                  {state.totalMonthlySubscriptions
                    ? `${(activeSubscriptions.reduce((a, s) => {
                        const mo = { weekly: s.amount * 52 / 12, monthly: s.amount, quarterly: s.amount / 3, annual: s.amount / 12 };
                        return a + (mo[s.cycle] || s.amount);
                      }, 0)).toFixed(2)} €`
                    : '0,00 €'}
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
                  {activeSubscriptions.length} abonnements actifs
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.textSecondary }}>
                  {(activeSubscriptions.reduce((a, s) => {
                    const mo = { weekly: s.amount * 52 / 12, monthly: s.amount, quarterly: s.amount / 3, annual: s.amount / 12 };
                    return a + (mo[s.cycle] || s.amount);
                  }, 0) * 12).toFixed(0)} €
                </Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>par an</Text>
              </View>
            </View>
          </Pressable>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={styles.fab} onPress={() => setShowAddTx(true)}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      {/* Modals */}
      <AddTransactionModal
        visible={showAddTx}
        onClose={() => setShowAddTx(false)}
        categories={state.categories}
        onSave={(tx) => {
          dispatch({ type: 'ADD_TRANSACTION', payload: { ...tx, id: `tx_${Date.now()}` } });
          setShowAddTx(false);
        }}
      />
      <AddCategoryModal
        visible={showAddCat}
        onClose={() => setShowAddCat(false)}
        onSave={(cat) => {
          dispatch({ type: 'ADD_CATEGORY', payload: { ...cat, id: `cat_${Date.now()}`, spent: 0 } });
          setShowAddCat(false);
        }}
      />
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
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoText: { fontSize: 24 },
  logoTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  editBtn: {
    width: 40, height: 40, borderRadius: 12, 
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 130 }, 
  incomeCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: 16, padding: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  incomeTitle: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  incomeAmt: { fontSize: 22, fontWeight: '700', color: Colors.green, letterSpacing: -0.5 },
  addCatBtn: {
    backgroundColor: Colors.white,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border,
    borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 8, marginBottom: 20,
  },
  addCatText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  subsCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  fab: {
    position: 'absolute', right: 20, bottom: 120, 
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.purple,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.fab,
  },
  fabText: { color: Colors.white, fontSize: 28, fontWeight: '600' },
});
