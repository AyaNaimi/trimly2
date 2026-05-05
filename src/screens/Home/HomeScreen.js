import React, { useEffect, useRef, useState } from 'react';
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
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';
import {
  CategoryRow,
  CategorySection,
  PeriodPill,
} from '../../components';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Fonts, Metrics, Radius, Shadow, Spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { getPeriodLabel, daysLeftInPeriod } from '../../utils/dateUtils';
import { PremiumHaptics } from '../../utils/haptics';
import AddTransactionModal from './AddTransactionModal';
import CategoryDetailModal from './CategoryDetailModal';
import CategoryManagerModal from './CategoryManagerModal';

const addAlpha = (hex, opacity) => {
  if (!hex) return 'transparent';
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const op = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${op}`;
};

const INSIGHT_AUTO_DISMISS_MS = 35000;
const TRIAL_AUTO_DISMISS_MS = 35000;

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
  const { Colors } = useTheme();
  const { t } = useLanguage();

  const [period, setPeriod] = useState('monthly');
  const [showAddTx, setShowAddTx] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [showCategoryDetail, setShowCategoryDetail] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [showTrial, setShowTrial] = useState(true);
  const [showInsight, setShowInsight] = useState(true);
  const settingsPress = usePressScale();
  const addPress = usePressScale();
  const fabPress = usePressScale();
  const insightTranslate = useRef(new Animated.Value(0)).current;
  const insightOpacity = useRef(new Animated.Value(1)).current;
  const trialTranslate = useRef(new Animated.Value(0)).current;
  const trialOpacity = useRef(new Animated.Value(1)).current;
  const insightTimerRef = useRef(null);
  const trialTimerRef = useRef(null);
  const lottieRef = useRef(null);

  // ── Lottie Animation Setup ──
  useEffect(() => {
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, []);

  const weeklyCats = state.categories.filter(c => c.cycle === 'weekly');
  const monthlyCats = state.categories.filter(c => c.cycle === 'monthly');
  const selectedCategory = state.categories.find(cat => cat.id === selectedCategoryId) || null;

  const weeklyBudget = weeklyCats.reduce((a, c) => a + c.budget, 0);
  const weeklySpent = weeklyCats.reduce((a, c) => a + c.spent, 0);
  const monthlyBudget = monthlyCats.reduce((a, c) => a + c.budget, 0);
  const monthlySpent = monthlyCats.reduce((a, c) => a + c.spent, 0);
  const activeBudget = period === 'monthly' ? monthlyBudget : weeklyBudget;
  const activeSpent = period === 'monthly' ? monthlySpent : weeklySpent;
  const activeRemaining = activeBudget - activeSpent;
  const activeUsage = activeBudget > 0 ? Math.round((activeSpent / activeBudget) * 100) : 0;
  const currencyLabel = state.currency || 'EUR';
  const periodLabel = period === 'monthly' ? t('home.thisMonth') : t('home.thisWeek');
  const formatAmount = (value) => `${Math.abs(Math.round(value)).toLocaleString()} ${currencyLabel}`;

  let insightLabel = t('home.insight.overview');
  let insightMessage = t('home.insight.spentMessage', { 
    spent: formatAmount(activeSpent), 
    budget: formatAmount(activeBudget), 
    period: periodLabel 
  });

  if (activeBudget <= 0) {
    insightLabel = t('home.insight.start');
    insightMessage = t('home.insight.noBudgetMessage');
  } else if (activeSpent <= 0) {
    insightLabel = t('home.insight.tracking');
    insightMessage = t('home.insight.noSpendingMessage', { 
      period: periodLabel, 
      budget: formatAmount(activeBudget) 
    });
  } else if (activeRemaining < 0) {
    insightLabel = t('home.insight.alert');
    insightMessage = t('home.insight.overBudgetMessage', { 
      amount: formatAmount(activeRemaining) 
    });
  } else if (activeUsage >= 85) {
    insightLabel = t('home.insight.warning');
    insightMessage = t('home.insight.highUsageMessage', { 
      remaining: formatAmount(activeRemaining), 
      usage: activeUsage 
    });
  } else if (activeUsage <= 45) {
    insightLabel = t('home.insight.goodPace');
    insightMessage = t('home.insight.lowUsageMessage', { 
      remaining: formatAmount(activeRemaining), 
      budget: formatAmount(activeBudget) 
    });
  }

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

  const closeInsight = ({ withHaptic = false } = {}) => {
    if (insightTimerRef.current) {
      clearTimeout(insightTimerRef.current);
      insightTimerRef.current = null;
    }
    if (withHaptic) PremiumHaptics.selection();

    Animated.parallel([
      Animated.timing(insightTranslate, { toValue: -220, duration: 180, useNativeDriver: true }),
      Animated.timing(insightOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setShowInsight(false));
  };

  const closeTrial = ({ withHaptic = false } = {}) => {
    if (trialTimerRef.current) {
      clearTimeout(trialTimerRef.current);
      trialTimerRef.current = null;
    }
    if (withHaptic) PremiumHaptics.selection();

    Animated.parallel([
      Animated.timing(trialTranslate, { toValue: -12, duration: 180, useNativeDriver: true }),
      Animated.timing(trialOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setShowTrial(false));
  };

  useEffect(() => {
    if (!showInsight) return undefined;

    insightTranslate.setValue(0);
    insightOpacity.setValue(1);
    insightTimerRef.current = setTimeout(() => closeInsight(), INSIGHT_AUTO_DISMISS_MS);

    return () => {
      if (insightTimerRef.current) {
        clearTimeout(insightTimerRef.current);
        insightTimerRef.current = null;
      }
    };
  }, [showInsight, insightLabel, insightMessage]);

  useEffect(() => {
    if (!showTrial || !(state.trial?.active && trialDaysLeft > 0)) return undefined;

    trialTranslate.setValue(0);
    trialOpacity.setValue(1);
    trialTimerRef.current = setTimeout(() => closeTrial(), TRIAL_AUTO_DISMISS_MS);

    return () => {
      if (trialTimerRef.current) {
        clearTimeout(trialTimerRef.current);
        trialTimerRef.current = null;
      }
    };
  }, [showTrial, state.trial?.active, trialDaysLeft]);

  const insightPanResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      if (gesture.dx < 0) {
        insightTranslate.setValue(Math.max(gesture.dx, -120));
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx < -70) {
        closeInsight({ withHaptic: true });
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

  const styles = makeStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          {/* Animated Lottie Cat Playing - remplace le logo */}
          <View style={styles.headerMascotContainer}>
            <LottieView
              ref={lottieRef}
              source={require('../../../assets/cat-playing.json')}
              autoPlay
              loop
              style={styles.headerLottieAnimation}
            />
          </View>
          <Text style={styles.logoTitle}>TRIMLY</Text>
        </View>
        <View style={styles.headerActions}>
          <PeriodPill label={getPeriodLabel(period)} onPress={togglePeriod} />
          <Pressable
            onPress={openCategoryPanel}
            onPressIn={settingsPress.onPressIn}
            onPressOut={settingsPress.onPressOut}
          >
            <Animated.View style={[styles.settingsBtn, { transform: [{ scale: settingsPress.scale }] }]}>
              <Text style={styles.settingsIcon}>⊞</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Insight card ── */}
        {showInsight ? (
          <Animated.View
            style={[
              styles.insightBox,
              insightLabel === 'Alerte' && styles.insightBoxAlert,
              insightLabel === 'Attention' && styles.insightBoxWarning,
              insightLabel === 'Bon rythme' && styles.insightBoxGood,
              { transform: [{ translateX: insightTranslate }], opacity: insightOpacity },
            ]}
            {...insightPanResponder.panHandlers}
          >
            <View style={styles.insightTopRow}>
              <View style={[
                styles.insightChip,
                insightLabel === 'Alerte' && styles.insightChipAlert,
                insightLabel === 'Attention' && styles.insightChipWarning,
                insightLabel === 'Bon rythme' && styles.insightChipGood,
              ]}>
                <Text style={[
                  styles.insightChipText,
                  insightLabel === 'Alerte' && styles.insightChipTextAlert,
                  insightLabel === 'Attention' && styles.insightChipTextWarning,
                  insightLabel === 'Bon rythme' && styles.insightChipTextGood,
                ]}>{insightLabel}</Text>
              </View>
              <Pressable onPress={() => closeInsight({ withHaptic: true })} hitSlop={10}>
                <Text style={styles.insightHint}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.insightText}>{insightMessage}</Text>
          </Animated.View>
        ) : null}

        {/* ── Balance hero ── */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Balance Totale</Text>
          <View style={styles.balanceAmtRow}>
            <Text style={styles.balanceAmt}>
              {state.income > 0 ? state.income.toLocaleString() : '0'}
            </Text>
            <Text style={styles.balanceCurrency}>{state.currency || '€'}</Text>
          </View>
          <View style={styles.balanceMeta}>
            <View style={styles.dotLive} />
            <Text style={styles.balanceStatus}>Comptes synchronisés</Text>
          </View>
        </View>

        {/* ── Trial card ── */}
        {state.trial?.active && trialDaysLeft > 0 && showTrial && (
          <Animated.View style={[styles.trialCard, { opacity: trialOpacity }]}>
            <View style={styles.trialCardInner}>
              <Text style={styles.trialCrown}>♛</Text>
              <View style={styles.trialCardBody}>
                <Text style={styles.trialCardTitle}>Pro · Essai gratuit</Text>
                <Text style={styles.trialCardSub}>{trialDaysLeft} jours restants</Text>
              </View>
              <Pressable
                style={styles.trialCtaBtn}
                onPress={() => { PremiumHaptics.selection(); navigation.navigate('Settings'); }}
              >
                <Text style={styles.trialCtaTxt}>Activer</Text>
              </Pressable>
              <Pressable onPress={() => closeTrial({ withHaptic: true })} hitSlop={12}>
                <Text style={styles.trialDismiss}>✕</Text>
              </Pressable>
            </View>
            <View style={styles.trialProgressTrack}>
              <View style={[styles.trialProgressFill, {
                width: `${Math.min(100, Math.round((trialDaysLeft / 14) * 100))}%`,
              }]} />
            </View>
          </Animated.View>
        )}

        {/* ── Budget sections ── */}
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

        {/* ── Add category button ── */}
        <Pressable
          onPress={openCategoryPanel}
          onPressIn={addPress.onPressIn}
          onPressOut={addPress.onPressOut}
        >
          <Animated.View style={[styles.addBtn, { transform: [{ scale: addPress.scale }] }]}>
            <Text style={styles.addBtnIcon}>+</Text>
            <Text style={styles.addBtnText}>Gérer les catégories</Text>
          </Animated.View>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        onPress={() => setShowAddTx(true)}
        onPressIn={fabPress.onPressIn}
        onPressOut={fabPress.onPressOut}
      >
        <Animated.View style={[styles.fab, { transform: [{ scale: fabPress.scale }] }]}>
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabLabel}>Ajouter</Text>
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

function makeStyles(Colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ───────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Metrics.screenPadding,
    paddingBottom: Spacing.md,
    paddingTop: Metrics.headerTop,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 34,
    height: 34,
  },
  logoTitle: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 18,
    color: Colors.text,
    letterSpacing: 3,
  },
  headerMascotContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLottieAnimation: {
    width: 50,
    height: 50,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsIcon: { ...Fonts.primary, fontSize: 15, color: Colors.text },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Metrics.screenPadding, paddingBottom: Metrics.fabBottomElevated },

  // ── Insight card ─────────────────────────────────────────
  insightBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  insightBoxAlert: {
    backgroundColor: Colors.expenseSoft,
    borderColor: Colors.expense,
    borderWidth: 1,
    shadowColor: Colors.expense,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  insightBoxGood: {
    backgroundColor: Colors.incomeSoft,
    borderColor: Colors.income,
    borderWidth: 1,
    shadowColor: Colors.income,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  insightBoxWarning: {
    backgroundColor: Colors.warningSoft,
    borderColor: Colors.warning,
    borderWidth: 1,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  insightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  insightChip: {
    backgroundColor: addAlpha(Colors.text, 0.08),
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: addAlpha(Colors.text, 0.1),
  },
  insightChipAlert: { backgroundColor: addAlpha(Colors.expense, 0.15), borderColor: addAlpha(Colors.expense, 0.3) },
  insightChipWarning: { backgroundColor: addAlpha(Colors.warning, 0.15), borderColor: addAlpha(Colors.warning, 0.3) },
  insightChipGood:  { backgroundColor: addAlpha(Colors.income, 0.15), borderColor: addAlpha(Colors.income, 0.3) },
  insightChipText: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 10,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  insightChipTextAlert: { color: Colors.expense },
  insightChipTextWarning: { color: Colors.warning },
  insightChipTextGood: { color: Colors.income },
  insightHint: { ...Fonts.primary, fontSize: 13, color: Colors.textMuted },
  insightText: { ...Fonts.primary, fontSize: 13, color: Colors.text, lineHeight: 19 },
  insightStrong: { ...Fonts.bold },

  // ── Balance hero ─────────────────────────────────────────
  balanceSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  balanceLabel: {
    ...Fonts.primary,
    ...Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  balanceAmtRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 10,
  },
  balanceAmt: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 46,
    color: Colors.text,
    letterSpacing: -2,
    lineHeight: 50,
  },
  balanceCurrency: {
    ...Fonts.primary,
    ...Fonts.medium,
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  balanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent },
  dotLive: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.income,
  },
  balanceStatus: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.1,
  },

  // ── Trial card ───────────────────────────────────────────
  trialBannerWrap: { marginTop: Spacing.sm },
  trialCard: {
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentDeep,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  trialCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: 10,
  },
  trialCrown: {
    fontSize: 15,
    lineHeight: 19,
    color: Colors.accentSecondary,
  },
  trialCardBody: {
    flex: 1,
    gap: 2,
  },
  trialCardTitle: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 13,
    color: Colors.pureWhite,
    letterSpacing: -0.1,
  },
  trialCardSub: {
    ...Fonts.primary,
    fontSize: 11,
    color: 'rgba(255,255,255,0.42)',
  },
  trialCtaBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accentSecondary,
  },
  trialCtaTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 12,
    color: Colors.pureWhite,
  },
  trialDismiss: {
    ...Fonts.primary,
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
  },
  trialProgressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  trialProgressFill: {
    height: 2,
    backgroundColor: Colors.accentSecondary,
    opacity: 0.7,
  },
  // legacy stubs
  trialStrip: { marginBottom: Spacing.lg },
  trialStripDivider: { height: 1, backgroundColor: Colors.border },
  trialStripRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  trialStripLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, ...Fonts.primary, fontSize: 12, color: Colors.textMuted },
  trialBadge: { backgroundColor: Colors.accentSoft, borderRadius: Radius.pill, paddingHorizontal: 6, paddingVertical: 2 },
  trialBadgeTxt: { ...Fonts.primary, ...Fonts.bold, fontSize: 9, color: Colors.accent, letterSpacing: 0.8 },
  trialStripDays: { ...Fonts.primary, ...Fonts.semiBold, color: Colors.text },
  trialStripCta: { ...Fonts.primary, ...Fonts.semiBold, fontSize: 12, color: Colors.accent },
  trialCardTop: {}, trialCardLeft: {}, trialCardDays: {},
  trialDismissBtn: {}, trialHero: {}, trialHeadline: {}, trialSubline: {},
  trialCounterRow: {}, trialCounterBox: {}, trialCounterNum: {}, trialCounterLabel: {},
  trialCounterDivider: {}, trialCounterDesc: {}, trialProgressLabels: {},
  trialProgressStart: {}, trialProgressEnd: {}, trialFeatures: {},
  trialFeatureRow: {}, trialFeatureCheck: {}, trialFeatureTxt: {},
  trialCta: {}, trialCtaArrow: {}, trialFootnote: {},

  // ── Add category button ──────────────────────────────────
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderStrong,
    marginTop: Spacing.sm,
  },
  addBtnIcon: {
    ...Fonts.primary,
    ...Fonts.light,
    fontSize: 18,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  addBtnText: {
    ...Fonts.primary,
    ...Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
  },

  // ── FAB ──────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: Metrics.screenPadding,
    bottom: Metrics.fabBottom,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    ...Shadow.medium,
  },
  fabPlus: {
    ...Fonts.primary,
    ...Fonts.light,
    fontSize: 22,
    color: Colors.pureWhite,
    lineHeight: 24,
    marginTop: -1,
  },
  fabLabel: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 14,
    color: Colors.pureWhite,
    letterSpacing: 0.1,
  },
  fabText: { ...Fonts.primary, ...Fonts.light, color: Colors.pureWhite, fontSize: 30, marginTop: -2 },
}); }
