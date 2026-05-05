import React, { useRef, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable,
  StyleSheet, SafeAreaView, Alert,
  Animated, PanResponder,
} from 'react-native';
import { PremiumHaptics } from '../../utils/haptics';
import { Shadow, Fonts, Radius, Spacing, Metrics } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import AddTransactionModal from '../Home/AddTransactionModal';
import WalletCard from '../../components/WalletCard';
import {
  addMonths, addWeeks,
  endOfMonth, endOfWeek,
  formatMonthYear, formatWeekRange,
  startOfMonth, startOfWeek,
} from '../../utils/dateUtils';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Format a number with narrow no-break space as thousands separator */
function fmtAmount(value) {
  return Math.abs(value)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
}

/** Format time from ISO date string — returns "HH:MM" */
function fmtTime(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  const h = d.getHours();
  const m = d.getMinutes();
  // Only show time if it's not midnight (i.e. a real timestamp was stored)
  if (h === 0 && m === 0) return null;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Hex color → rgba with alpha */
function hexAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─────────────────────────────────────────────────────────────
// SwipeableRow — reveals a red delete zone on left-swipe
// ─────────────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 80;
const DELETE_WIDTH    = 72;

function SwipeableRow({ children, onDelete, styles, t }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [swiped, setSwiped] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => {
        const x = Math.min(0, Math.max(-DELETE_WIDTH - 20, g.dx));
        translateX.setValue(x);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start(() => setSwiped(true));
          PremiumHaptics.selection();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
          }).start(() => setSwiped(false));
        }
      },
    })
  ).current;

  function close() {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start(() => setSwiped(false));
  }

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Delete action behind the row */}
      <View style={styles.swipeDeleteZone}>
        <Pressable
          style={styles.swipeDeleteBtn}
          onPress={() => { close(); onDelete(); }}
        >
          <Text style={styles.swipeDeleteIcon}>🗑</Text>
          <Text style={styles.swipeDeleteTxt}>{t('common.delete').substring(0, 6)}.</Text>
        </Pressable>
      </View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

export default function TransactionsScreen() {
  const { state, addTransaction, deleteTransaction } = useApp();
  const { Colors } = useTheme();
  const { t } = useLanguage();
  const [period, setPeriod] = useState('week');
  const [showAdd, setShowAdd] = useState(false);
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [expandedDates, setExpandedDates] = useState({});

  // ── Anomaly threshold: 3× the category average over all history ──
  function getCategoryAvg(categoryName) {
    const all = (state.transactions || []).filter(
      t => t.type === 'expense' && t.categoryName === categoryName
    );
    if (all.length === 0) return null;
    return all.reduce((s, t) => s + t.amount, 0) / all.length;
  }

  const rangeStart = period === 'week' ? startOfWeek(anchorDate) : startOfMonth(anchorDate);
  const rangeEnd = period === 'week' ? endOfWeek(anchorDate) : endOfMonth(anchorDate);

  const filtered = useMemo(() =>
    state.transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= rangeStart && d <= rangeEnd;
    }),
    [state.transactions, rangeStart, rangeEnd]
  );

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach(tx => {
      if (!g[tx.date]) g[tx.date] = [];
      g[tx.date].push(tx);
    });
    return g;
  }, [filtered]);

  const sortedDates = useMemo(
    () => Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)),
    [grouped]
  );

  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  // ── No-income reminder: show if period has expenses but zero income ──
  const showIncomeReminder = totalExpenses > 0 && totalIncome === 0;

  const bars = useMemo(() => {
    if (period !== 'week') return [];
    return DAY_LABELS.map((label, i) => {
      const d = new Date(rangeStart);
      d.setDate(rangeStart.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const value = (grouped[key] || [])
        .filter(t => t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      return { label, value };
    });
  }, [grouped, period, rangeStart]);

  const maxBar = Math.max(...bars.map(b => b.value), 1);
  const periodLabel = period === 'week' ? formatWeekRange(anchorDate) : formatMonthYear(anchorDate);

  const categoryColorMap = useMemo(
    () => Object.fromEntries((state.categories || []).map(c => [c.name, c.color])),
    [state.categories]
  );

  function getTxColor(tx) {
    return tx.color || categoryColorMap[tx.categoryName] || Colors.accent;
  }

  function confirmDelete(tx) {
    Alert.alert(
      t('transactions.deleteConfirm'),
      t('transactions.deleteMessage', { name: tx.note || tx.categoryName, amount: tx.amount, currency: state.currency }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive',
          onPress: async () => {
            const ok = await deleteTransaction(tx.id);
            if (ok) PremiumHaptics.impact();
            else Alert.alert(t('common.error'), t('transactions.deleteError'));
          },
        },
      ]
    );
  }

  function shiftPeriod(dir) {
    PremiumHaptics.selection();
    setAnchorDate(prev => period === 'week' ? addWeeks(prev, dir) : addMonths(prev, dir));
  }

  function goToNow() {
    PremiumHaptics.selection();
    setAnchorDate(new Date());
  }

  function changePeriod(next) {
    PremiumHaptics.selection();
    setPeriod(next);
    setAnchorDate(new Date());
  }

  const styles = makeStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('transactions.title')}</Text>
        <Text style={styles.subtitle}>{t('transactions.subtitle')}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── Period toggle + navigator in one row ── */}
        <View style={styles.topControls}>
          <View style={styles.filterPills}>
            {['week', 'month'].map(item => (
              <Pressable
                key={item}
                onPress={() => changePeriod(item)}
                style={[styles.pill, period === item && styles.pillActive]}
              >
                <Text style={[styles.pillTxt, period === item && styles.pillTxtActive]}>
                  {t(`common.${item}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.shifterRow}>
            <Pressable style={styles.shiftBtn} onPress={() => shiftPeriod(-1)}>
              <Text style={styles.shiftArrow}>‹</Text>
            </Pressable>
            <Pressable onPress={goToNow}>
              <Text style={styles.shiftCenterTxt}>{periodLabel}</Text>
            </Pressable>
            <Pressable style={styles.shiftBtn} onPress={() => shiftPeriod(1)}>
              <Text style={styles.shiftArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Wallet Card avec cartes empilées ── */}
        <WalletCard 
          balance={balance} 
          currency={state.currency}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          userName={state.name || state.profile?.name || state.session?.user?.user_metadata?.full_name || state.session?.user?.email?.split('@')[0] || 'Utilisateur'}
        />

        {/* ── No-income reminder banner ── */}
        {showIncomeReminder && (
          <Pressable
            style={styles.reminderBanner}
            onPress={() => { PremiumHaptics.selection(); setShowAdd(true); }}
          >
            <Text style={styles.reminderIcon}>💡</Text>
            <View style={styles.reminderBody}>
              <Text style={styles.reminderTitle}>{t('transactions.noIncomeRecorded')}</Text>
              <Text style={styles.reminderHint}>{t('transactions.addIncomePrompt')}</Text>
            </View>
            <Text style={styles.reminderCta}>+</Text>
          </Pressable>
        )}

        {/* ── Bar chart (weekly) ── */}
        {period === 'week' && bars.some(b => b.value > 0) && (
          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>{t('transactions.spendingThisWeek')}</Text>
            <View style={styles.chartWrap}>
              {bars.map(item => {
                const pct = item.value / maxBar;
                const isPeak = pct === 1 && item.value > 0;
                return (
                  <View key={item.label} style={styles.barCol}>
                    {isPeak && (
                      <Text style={styles.barPeakVal}>
                        {fmtAmount(item.value)}
                      </Text>
                    )}
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { height: `${pct * 100}%` },
                          isPeak && styles.barFillPeak,
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLbl, isPeak && styles.barLblPeak]}>
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Divider before list ── */}
        <View style={styles.sectionDivider} />

        {/* ── Transaction list ── */}
        {sortedDates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🌿</Text>
            <Text style={styles.emptyTxt}>{t('transactions.calmWeek')}</Text>
            <Text style={styles.emptyHint}>
              {totalIncome === 0 && totalExpenses === 0
                ? t('transactions.noActivity')
                : t('transactions.noActivity')}
            </Text>
            <Pressable
              style={styles.emptyAction}
              onPress={() => { PremiumHaptics.click(); setShowAdd(true); }}
            >
              <Text style={styles.emptyActionTxt}>+ {t('transactions.addTransaction')}</Text>
            </Pressable>
          </View>
        ) : (
          sortedDates.map(date => {
            const dayTxs = grouped[date];
            const isExpanded = expandedDates[date];
            const visible = isExpanded ? dayTxs : dayTxs.slice(0, 3);
            const hasMore = dayTxs.length > 3;
            const dayNet = dayTxs.reduce(
              (sum, tx) => tx.type === 'income' ? sum + tx.amount : sum - tx.amount, 0
            );

            return (
              <View key={date} style={styles.dateGroup}>

                {/* ── Inline date ruler ── */}
                <View style={styles.dateRuler}>
                  <View style={styles.rulerLine} />
                  <Text style={styles.rulerDate}>
                    {new Date(date).toLocaleDateString('fr-FR', {
                      weekday: 'short', day: 'numeric', month: 'short',
                    }).toUpperCase()}
                  </Text>
                  <View style={styles.rulerLine} />
                  <Text style={[styles.rulerNet, dayNet > 0 ? styles.incomeColor : dayNet < 0 ? styles.expenseColor : styles.neutralColor]}>
                    {dayNet > 0 ? '+' : dayNet < 0 ? '−' : ''}{fmtAmount(dayNet)} {state.currency}
                  </Text>
                </View>

                {/* ── Transaction cards ── */}
                <View style={styles.txList}>
                  {visible.map((tx, idx) => {
                    const txColor   = getTxColor(tx);
                    const isIncome  = tx.type === 'income';
                    const time      = fmtTime(tx.date);
                    const isAnomal  = tx.type === 'expense' && (() => {
                      const avg = getCategoryAvg(tx.categoryName);
                      return avg !== null && tx.amount > avg * 3;
                    })();
                    const displayName = tx.note && tx.note !== tx.categoryName
                      ? tx.note
                      : tx.categoryName;

                    return (
                      <View key={tx.id}>
                        <SwipeableRow onDelete={() => confirmDelete(tx)} styles={styles} t={t}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.txCard,
                              pressed && styles.txCardPressed,
                            ]}
                          >
                            {/* ── Colored icon bubble ── */}
                            <View style={[
                              styles.txBubble,
                              { backgroundColor: hexAlpha(txColor, 0.12) },
                            ]}>
                              <Text style={styles.txBubbleEmoji}>{tx.icon}</Text>
                            </View>

                            {/* ── Body ── */}
                            <View style={styles.txBody}>
                              {/* Row 1: name + amount */}
                              <View style={styles.txTopRow}>
                                <Text style={styles.txName} numberOfLines={1}>
                                  {displayName}
                                </Text>
                                {isAnomal && (
                                  <View style={styles.anomalyBadge}>
                                    <Text style={styles.anomalyBadgeTxt}>⚠</Text>
                                  </View>
                                )}
                                <View style={styles.txAmtRow}>
                                  <Text style={[
                                    styles.txAmt,
                                    isIncome ? styles.incomeColor : styles.expenseColor,
                                  ]}>
                                    {isIncome ? '+' : '−'}{fmtAmount(tx.amount)}
                                  </Text>
                                  <Text style={[styles.txCurrency, isIncome ? styles.incomeColor : styles.expenseColor]}>
                                    {state.currency}
                                  </Text>
                                </View>
                              </View>

                              {/* Row 2: category */}
                              <Text style={[styles.catPillTxt, { color: txColor }]}>
                                {tx.categoryName}
                              </Text>
                            </View>
                          </Pressable>
                        </SwipeableRow>

                        {idx < visible.length - 1 && (
                          <View style={styles.rowDivider} />
                        )}
                      </View>
                    );
                  })}
                </View>

                {hasMore && !isExpanded && (
                  <Pressable
                    style={styles.moreBtn}
                    onPress={() => {
                      PremiumHaptics.selection();
                      setExpandedDates(prev => ({ ...prev, [date]: true }));
                    }}
                  >
                    <Text style={styles.moreBtnTxt}>↓ {t('common.more', { count: dayTxs.length - 3 })}</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── FAB labellisé ── */}
      <Pressable
        style={styles.fab}
        onPress={() => { PremiumHaptics.click(); setShowAdd(true); }}
      >
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabLabel}>{t('common.add')}</Text>
      </Pressable>

      <AddTransactionModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        categories={state.categories}
        onSave={async tx => {
          // ── Anomaly check before persisting ──
          if (tx.type === 'expense') {
            const avg = getCategoryAvg(tx.categoryName);
            if (avg !== null && tx.amount > avg * 3) {
              const avgFmt = fmtAmount(avg);
              const amtFmt = fmtAmount(tx.amount);
              await new Promise(resolve => {
                Alert.alert(
                  t('transactions.unusualAmount'),
                  t('transactions.unusualAmountMessage', { 
                    category: tx.categoryName, 
                    avg: avgFmt, 
                    currency: state.currency,
                    amount: amtFmt
                  }),
                  [
                    { text: t('transactions.correct'), style: 'cancel', onPress: () => resolve(false) },
                    {
                      text: t('transactions.confirmAnyway'),
                      onPress: async () => {
                        const ok = await addTransaction(tx);
                        if (ok) { setShowAdd(false); PremiumHaptics.success(); }
                        else Alert.alert(t('common.error'), t('transactions.syncError'));
                        resolve(true);
                      },
                    },
                  ]
                );
              });
              return;
            }
          }
          const ok = await addTransaction(tx);
          if (ok) { setShowAdd(false); PremiumHaptics.success(); }
          else Alert.alert(t('common.error'), t('transactions.syncError'));
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(Colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──────────────────────────────────────────────
  header: {
    paddingHorizontal: Metrics.screenPadding,
    paddingTop: Metrics.headerTop,
    paddingBottom: Spacing.sm,
  },
  title: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: 1.5,
  },
  subtitle: {
    ...Fonts.primary,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },

  // ── Scroll ───────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Metrics.screenPadding,
    paddingBottom: 160,
  },

  // ── Top controls: pills + navigator on same line ─────────
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterPills: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pillTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pillTxtActive: { 
    color: '#FFFFFF',
  },

  shifterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shiftBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftArrow: {
    ...Fonts.primary,
    fontSize: 22,
    color: Colors.warning,
    lineHeight: 26,
  },
  shiftCenterTxt: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 12,
    color: Colors.text,
  },

  // ── Hero section — animated accordion ──────────────────
  heroWrap: {
    // No fixed height — the in-flow child drives the height naturally
  },
  heroHeader: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    ...Shadow.soft,
  },
  heroHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.smd,
  },
  heroHeaderLeft: {
    gap: 2,
  },
  heroHeaderLabel: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroHeaderAmt: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 26,
    letterSpacing: -1,
    lineHeight: 30,
  },
  heroHeaderRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  heroHeaderPeriod: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  heroChevron: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 18,
    color: Colors.textMuted,
    lineHeight: 20,
    // base rotation handled entirely by the animated interpolation
  },
  heroBody: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.mdLg,
    paddingBottom: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.soft,
  },
  heroBodyInner: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroBodyCenter: {
    alignItems: 'center',
    gap: 4,
  },
  heroBodyDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
  },

  heroCollapseHint: {
    ...Fonts.primary,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginTop: -4,
  },
  heroPeriodLabel: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  heroLabel: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroAmt: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 38,
    letterSpacing: -1.2,
    lineHeight: 42,
  },

  // Stat chips row
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statLabel: {
    ...Fonts.primary,
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 1,
  },
  statValue: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 14,
    letterSpacing: -0.3,
  },
  statSep: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderStrong,
  },

  // ── Bar chart ────────────────────────────────────────────
  chartSection: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    ...Shadow.soft,
  },
  chartTitle: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  chartWrap: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  barPeakVal: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 9,
    color: Colors.accent,
    marginBottom: 2,
  },
  barTrack: {
    flex: 1,
    width: 12,
    justifyContent: 'flex-end',
    backgroundColor: Colors.bg,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: Colors.borderStrong,
    borderRadius: Radius.pill,
  },
  barFillPeak: {
    backgroundColor: Colors.accent,
  },
  barLbl: {
    ...Fonts.primary,
    fontSize: 10,
    color: Colors.textMuted,
  },
  barLblPeak: {
    ...Fonts.bold,
    color: Colors.text,
  },

  // ── Section divider ──────────────────────────────────────
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
  },

  // ── Date ruler (inline) ──────────────────────────────────
  dateGroup: {
    marginBottom: Spacing.md,
  },
  dateRuler: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  rulerLine: {
    height: 1,
    backgroundColor: Colors.borderStrong,
    flex: 1,
  },
  rulerDate: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  rulerNet: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 12,
    letterSpacing: -0.2,
  },

  // ── Transaction list container ───────────────────────────
  txList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    overflow: 'hidden',
    ...Shadow.soft,
  },

  // ── Swipe-to-delete ──────────────────────────────────────
  swipeDeleteZone: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    backgroundColor: Colors.expense,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeDeleteBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: DELETE_WIDTH,
    flex: 1,
  },
  swipeDeleteIcon: { fontSize: 18, marginBottom: 2 },
  swipeDeleteTxt: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 0.3,
  },

  // ── Transaction card ─────────────────────────────────────
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
    gap: 12,
  },
  txCardPressed: {
    backgroundColor: Colors.surface,
  },

  // Icon bubble — square-rounded, larger
  txBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  txBubbleEmoji: { fontSize: 17 },

  // Body
  txBody: {
    flexGrow: 1,
    flexShrink: 1,
    gap: 3,
    minWidth: 0,
    alignSelf: 'center',
  },
  txTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  txName: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    letterSpacing: -0.1,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  // Category pill — tighter, cleaner
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  catPillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  catPillTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.1,
  },

  // Time
  txTime: {
    ...Fonts.primary,
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Amount — inline with name row
  txAmtRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    flexShrink: 0,
  },
  txAmt: {
    ...Fonts.primary,
    ...Fonts.regular,
    fontSize: 13,
    textAlign: 'right',
    letterSpacing: -0.2,
  },
  txCurrency: {
    ...Fonts.primary,
    ...Fonts.regular,
    fontSize: 13,
    textAlign: 'right',
  },

  // Anomaly badge
  anomalyBadge: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: Colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  anomalyBadgeTxt: {
    fontSize: 9,
    lineHeight: 11,
  },

  // Row divider — inset to align after bubble
  rowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 70,
  },

  // "Voir plus" button
  moreBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  moreBtnTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 0.3,
  },

  // ── Semantic colors ──────────────────────────────────────
  incomeColor: { color: Colors.income },
  expenseColor: { color: Colors.expense },
  neutralColor: { color: Colors.textSecondary },

  // ── No-income reminder banner ────────────────────────────
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningSoft,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.warning,
    ...Shadow.soft,
  },
  reminderIcon: { fontSize: 20 },
  reminderBody: { flex: 1 },
  reminderTitle: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 13,
    color: Colors.text,
  },
  reminderHint: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reminderCta: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 22,
    color: Colors.warning,
    lineHeight: 26,
  },

  // ── Empty state ──────────────────────────────────────────
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 16,
    color: Colors.text,
  },
  emptyHint: {
    ...Fonts.primary,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyAction: {
    marginTop: 16,
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyActionTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // ── FAB labellisé ────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: Metrics.screenPadding,
    bottom: Metrics.fabBottom,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.accent,
    ...Shadow.medium,
  },
  fabPlus: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
    marginTop: -1,
  },
  fabLabel: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
}); }