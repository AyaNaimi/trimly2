import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  CategoryRow,
  CategorySection,
  PeriodPill,
  TrialBanner,
  QuickStatsRow,
} from '../../components';
import { useApp } from '../../context/AppContext';
import { Colors, Fonts, Metrics, Radius, Shadow, Spacing } from '../../theme';
import { getPeriodLabel, daysLeftInPeriod } from '../../utils/dateUtils';
import { PremiumHaptics } from '../../utils/haptics';
import AddTransactionModal from './AddTransactionModal';
import CategoryDetailModal from './CategoryDetailModal';
import CategoryManagerModal from './CategoryManagerModal';

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 26,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
}

export default function HomeScreen({ navigation }) {
  const { 
    state, 
    trialDaysLeft, 
    dispatch, 
    addTransaction,
    addCategory,
    updateCategory,
    deleteCategory 
  } = useApp();

  const [period, setPeriod] = useState('monthly');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [showCategoryDetail, setShowCategoryDetail] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showTrial, setShowTrial] = useState(true);
  const [showInsight, setShowInsight] = useState(true);
  const addPress = usePressScale();
  const fabPress = usePressScale();
  const insightTranslate = useRef(new Animated.Value(0)).current;
  const insightOpacity = useRef(new Animated.Value(1)).current;

  const weeklyCats = state.categories.filter(c => c.cycle === 'weekly');
  const monthlyCats = state.categories.filter(c => c.cycle === 'monthly');
  const selectedCategory = state.categories.find(cat => cat.id === selectedCategoryId) || null;

  const weeklyBudget = weeklyCats.reduce((a, c) => a + c.budget, 0);
  const weeklySpent = weeklyCats.reduce((a, c) => a + c.spent, 0);
  const monthlyBudget = monthlyCats.reduce((a, c) => a + c.budget, 0);
  const monthlySpent = monthlyCats.reduce((a, c) => a + c.spent, 0);

  const togglePeriod = () => {
    PremiumHaptics.selection();
    setPeriod(current => (current === 'monthly' ? 'weekly' : 'monthly'));
  };

  const openCategoryPanel = () => {
    PremiumHaptics.selection();
    setShowCategoryPanel(true);
  };

  const openCategoryDetail = (categoryId) => {
    PremiumHaptics.selection();
    setSelectedCategoryId(categoryId);
    setShowCategoryDetail(true);
  };

  const insightPanResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        insightTranslate.setValue(gesture.dx);
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -80) {
        PremiumHaptics.selection();
        Animated.parallel([
          Animated.timing(insightTranslate, { toValue: -220, duration: 180, useNativeDriver: true }),
          Animated.timing(insightOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => setShowInsight(false));
      } else {
        Animated.spring(insightTranslate, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 4,
        }).start();
      }
    },
  })).current;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logoTitle}>TRIMLY</Text>
        <PeriodPill label={getPeriodLabel(period)} onPress={togglePeriod} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {state.trial?.active && trialDaysLeft > 0 && showTrial && (
          <TrialBanner
            daysLeft={trialDaysLeft}
            onSubscribe={() => navigation.navigate('Settings')}
            onClose={() => setShowTrial(false)}
          />
        )}

        {showInsight ? (
          <Animated.View
            style={[
              styles.insightBox,
              { transform: [{ translateX: insightTranslate }], opacity: insightOpacity },
            ]}
            {...insightPanResponder.panHandlers}
          >
            <View style={styles.insightTopRow}>
              <View style={styles.insightChip}>
                <Text style={styles.insightChipText}>Analyse</Text>
              </View>
              <Text style={styles.insightHint}>Glissez pour masquer</Text>
            </View>
            <Text style={styles.insightText}>
              Depenses en baisse de <Text style={styles.insightStrong}>18%</Text> ce mois-ci.
            </Text>
          </Animated.View>
        ) : null}

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Balance Totale</Text>
          <Text style={styles.balanceAmt}>
            {state.income > 0 ? `${state.income.toLocaleString()} ${state.currency || '€'}` : `0 ${state.currency || '€'}`}
          </Text>
          <View style={styles.balanceMeta}>
            <View style={styles.dot} />
            <Text style={styles.balanceStatus}>Comptes synchronises</Text>
          </View>
        </View>

        <QuickStatsRow categories={state.categories} state={state} />

        {weeklyCats.length > 0 && (
          <CategorySection
            label="Hebdo"
            daysLeft={daysLeftInPeriod('weekly')}
            budgeted={weeklyBudget}
            left={weeklyBudget - weeklySpent}
          >
            {weeklyCats.map(cat => (
              <CategoryRow key={cat.id} category={cat} simple onPress={() => openCategoryDetail(cat.id)} />
            ))}
          </CategorySection>
        )}

        {monthlyCats.length > 0 && (
          <CategorySection
            label="Mensuel"
            daysLeft={daysLeftInPeriod('monthly')}
            budgeted={monthlyBudget}
            left={monthlyBudget - monthlySpent}
          >
            {monthlyCats.map(cat => (
              <CategoryRow key={cat.id} category={cat} simple onPress={() => openCategoryDetail(cat.id)} />
            ))}
          </CategorySection>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => setShowAddTx(true)}
        onPressIn={fabPress.onPressIn}
        onPressOut={fabPress.onPressOut}
      >
        <Animated.View style={[styles.fab, { transform: [{ scale: fabPress.scale }] }]}>
          <Text style={styles.fabText}>+</Text>
        </Animated.View>
      </Pressable>

      <AddTransactionModal
        visible={showAddTx}
        onClose={() => setShowAddTx(false)}
        categories={state.categories}
        onSave={async (tx) => {
          const ok = await addTransaction(tx);
          if (ok) {
            setShowAddTx(false);
            PremiumHaptics.success();
          } else {
            Alert.alert('Erreur', 'Impossible de synchroniser la transaction.');
          }
        }}
      />

      <CategoryManagerModal
        visible={showCategoryPanel}
        onClose={() => setShowCategoryPanel(false)}
        categories={state.categories}
        onDeleteCategory={async (categoryId) => {
          const ok = await deleteCategory(categoryId);
          if (ok) PremiumHaptics.success();
        }}
        onOpenCategory={(categoryId) => {
          setShowCategoryPanel(false);
          openCategoryDetail(categoryId);
        }}
        onCreateCategory={async (cat) => {
          const ok = await addCategory({ ...cat, spent: 0 });
          if (ok) PremiumHaptics.success();
        }}
        onUpdateCategory={async (cat) => {
          const ok = await updateCategory(cat.id, cat);
          if (ok) PremiumHaptics.success();
        }}
      />

      <CategoryDetailModal
        visible={showCategoryDetail}
        category={selectedCategory}
        transactions={state.transactions}
        categories={state.categories}
        currency={state.currency || '€'}
        onClose={() => setShowCategoryDetail(false)}
        onUpdateCategory={async (cat) => {
          const ok = await updateCategory(cat.id, cat);
          if (ok) {
            setSelectedCategoryId(cat.id);
            PremiumHaptics.success();
          }
        }}
        onDeleteCategory={async (categoryId) => {
          const ok = await deleteCategory(categoryId);
          if (ok) {
            setShowCategoryDetail(false);
            PremiumHaptics.success();
          }
        }}
        onAddTransaction={async (tx) => {
          const ok = await addTransaction(tx);
          if (ok) PremiumHaptics.success();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Metrics.screenPadding,
    paddingBottom: Spacing.md,
    paddingTop: Metrics.headerTop,
  },
  logoTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 22, color: Colors.text, letterSpacing: 1.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Metrics.screenPadding, paddingBottom: Metrics.fabBottomElevated },
  insightBox: {
    padding: 14,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
    ...Shadow.soft,
  },
  insightTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  insightChip: {
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  insightChipText: { ...Fonts.primary, ...Fonts.bold, fontSize: 10, color: Colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  insightHint: { ...Fonts.primary, fontSize: 10, color: Colors.textMuted },
  insightText: { ...Fonts.primary, fontSize: 13, color: Colors.text, lineHeight: 18 },
  insightStrong: { ...Fonts.bold },
  balanceSection: { marginBottom: Spacing.xl, alignItems: 'center' },
  balanceLabel: { ...Fonts.primary, fontSize: 11, ...Fonts.black, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmt: { ...Fonts.primary, ...Fonts.black, fontSize: 44, color: Colors.text, marginTop: 8 },
  balanceMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  balanceStatus: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary },
  fab: {
    position: 'absolute',
    right: Metrics.screenPadding,
    bottom: Metrics.fabBottom,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },
  fabText: { color: Colors.white, fontSize: 30, fontWeight: '300', marginTop: -2 },
});
