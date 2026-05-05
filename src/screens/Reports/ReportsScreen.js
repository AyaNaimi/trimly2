import React, { useMemo, useState, useRef } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text, View,
  Pressable, Animated, Modal, TouchableWithoutFeedback,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Fonts, Metrics, Radius, Shadow, Spacing } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { monthlyEquivalent } from '../../utils/dateUtils';

/** Returns { start, end } Date objects for a given period + offset */
function periodRange(periodKey, offset = 0) {
  const now = new Date();
  let start, end;

  if (periodKey === 'week') {
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    start = new Date(now); start.setDate(now.getDate() - day + offset * 7); start.setHours(0,0,0,0);
    end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
  } else if (periodKey === 'month') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end   = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  } else if (periodKey === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) + offset;
    const year = now.getFullYear() + Math.floor(q / 4);
    const qNorm = ((q % 4) + 4) % 4;
    start = new Date(year, qNorm * 3, 1);
    end   = new Date(year, qNorm * 3 + 3, 0, 23, 59, 59, 999);
  } else { // year
    const y = now.getFullYear() + offset;
    start = new Date(y, 0, 1);
    end   = new Date(y, 11, 31, 23, 59, 59, 999);
  }
  return { start, end };
}

/** Human-readable label for a period range */
function periodLabel(periodKey, offset) {
  const { start, end } = periodRange(periodKey, offset);
  const opts = { day: 'numeric', month: 'short' };
  if (periodKey === 'week') {
    return `${start.toLocaleDateString('fr-FR', opts)} – ${end.toLocaleDateString('fr-FR', opts)}`;
  }
  if (periodKey === 'month') {
    return start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
  if (periodKey === 'quarter') {
    const q = Math.floor(start.getMonth() / 3) + 1;
    return `T${q} ${start.getFullYear()}`;
  }
  return `${start.getFullYear()}`;
}

/** Build bar-chart slots for the evolution section */
function buildSlots(periodKey, offset) {
  const slots = [];
  if (periodKey === 'week') {
    const { start } = periodRange('week', offset);
    const days = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = d.toISOString().split('T')[0];
      slots.push({ key, label: days[i], total: 0 });
    }
  } else if (periodKey === 'month') {
    const { start, end } = periodRange('month', offset);
    const weeks = [];
    let cur = new Date(start);
    let w = 1;
    while (cur <= end) {
      const wStart = new Date(cur);
      const wEnd   = new Date(cur); wEnd.setDate(cur.getDate() + 6);
      if (wEnd > end) wEnd.setTime(end.getTime());
      weeks.push({ key: `W${w}`, label: `S${w}`, startD: wStart, endD: wEnd, total: 0 });
      cur.setDate(cur.getDate() + 7);
      w++;
    }
    return weeks;
  } else if (periodKey === 'quarter') {
    const { start } = periodRange('quarter', offset);
    for (let m = 0; m < 3; m++) {
      const d = new Date(start.getFullYear(), start.getMonth() + m, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.','').slice(0,3);
      slots.push({ key, label, total: 0 });
    }
  } else { // year
    const { start } = periodRange('year', offset);
    for (let m = 0; m < 12; m++) {
      const d = new Date(start.getFullYear(), m, 1);
      const key = `${d.getFullYear()}-${String(m+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.','').slice(0,3);
      slots.push({ key, label, total: 0 });
    }
  }
  return slots;
}

const NUM_MONTHS = 7;

function buildMonthSlots(count) {
  const slots = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date
      .toLocaleDateString('fr-FR', { month: 'short' })
      .replace('.', '')
      .slice(0, 3);

    slots.push({ key, label, total: 0 });
  }

  return slots;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format uniforme dans toute l'app :
 * - Séparateur milliers : espace fine insécable (\u202F)
 * - Décimales : uniquement si la valeur en a (max 2)
 * - Jamais de virgule sans espace milliers
 */
function formatAmount(value, currency) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  // Afficher les centimes seulement si la valeur est < 10 000 et a des décimales réelles
  const showDecimals = abs < 10000 && Math.abs(abs % 1) > 0.009;
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  // fr-FR uses \u00A0 (non-breaking space) — replace with narrow no-break space for consistency
  }).replace(/\u00A0/g, '\u202F');
  return `${formatted} ${currency}`;
}

function formatDelta(value, currency) {
  const amount = Number(value) || 0;
  const prefix = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${prefix}${formatAmount(Math.abs(amount), currency)}`;
}

function pickToneColors(tone, Colors) {
  if (tone === 'alert') {
    return { accent: Colors.expense, soft: Colors.expenseSoft, text: Colors.expense };
  }
  if (tone === 'warning') {
    return { accent: Colors.warning, soft: Colors.warningSoft, text: Colors.warning };
  }
  if (tone === 'good') {
    return { accent: Colors.income, soft: Colors.incomeSoft, text: Colors.income };
  }
  return { accent: Colors.accentSecondary, soft: Colors.surface, text: Colors.textSecondary };
}

// ─── Accordion component ──────────────────────────────────────────────────────
function Accordion({ title, tag, meta, defaultOpen = true, children, Colors }) {
  const [open, setOpen] = useState(defaultOpen);
  const anim = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  function toggle() {
    const toValue = open ? 0 : 1;
    setOpen(!open);
    Animated.spring(anim, { toValue, useNativeDriver: false, tension: 60, friction: 10 }).start();
  }

  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const s = makeStyles(Colors);

  return (
    <View style={s.softPanel}>
      <Pressable style={s.accordionHeader} onPress={toggle}>
        <View style={s.accordionLeft}>
          <Text style={s.panelTitle}>{title}</Text>
          {meta ? <Text style={s.panelMeta}>{meta}</Text> : null}
        </View>
        <View style={s.accordionRight}>
          {tag ? <Text style={s.panelTag}>{tag}</Text> : null}
          <Animated.Text style={[s.accordionChevron, { transform: [{ rotate }] }]}>
            ›
          </Animated.Text>
        </View>
      </Pressable>
      {open && <View style={s.accordionBody}>{children}</View>}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { state, activeSubscriptions } = useApp();
  const { Colors } = useTheme();
  const { t } = useLanguage();
  const categories = state.categories || [];
  const transactions = state.transactions || [];
  const currency = state.currency || 'EUR';

  // ── Date filter state ──────────────────────────────────────
  const [activePeriod, setActivePeriod] = useState('month');
  const [offset, setOffset]             = useState(0);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const periodBtnRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const PERIODS = [
    { key: 'week',    label: t('common.week') },
    { key: 'month',   label: t('common.month') },
    { key: 'quarter', label: t('common.quarter') },
    { key: 'year',    label: t('common.year') },
  ];

  // Calculate date range for current period
  const { start: rangeStart, end: rangeEnd } = useMemo(() => periodRange(activePeriod, offset), [activePeriod, offset]);
  const label = useMemo(() => periodLabel(activePeriod, offset), [activePeriod, offset]);
  const isCurrentPeriod = offset === 0;

  // ── Filtered transactions for the selected period ──────────
  const filtered = useMemo(
    () => transactions.filter(tx => {
      const d = new Date(tx.date);
      return d >= rangeStart && d <= rangeEnd;
    }),
    [transactions, rangeStart, rangeEnd]
  );

  // ── For the hero card: days elapsed ratio ─────────────────
  const now = new Date();
  const daysInPeriod = Math.max(1, Math.round((rangeEnd - rangeStart) / 86400000) + 1);
  const daysElapsed  = isCurrentPeriod
    ? Math.min(daysInPeriod, Math.max(1, Math.round((now - rangeStart) / 86400000) + 1))
    : daysInPeriod;
  const elapsedPct   = clamp((daysElapsed / daysInPeriod) * 100, 0, 100);

  // ── Category summary ───────────────────────────────────────
  const monthlyCategorySummary = useMemo(() => {
    const spentByCategory = {};
    let totalSpent = 0;
    let largestExpense = null;

    filtered.forEach(tx => {
      if (tx.type !== 'expense') return;
      const amount = Number(tx.amount) || 0;
      totalSpent += amount;
      if (tx.category_id) {
        spentByCategory[tx.category_id] = (spentByCategory[tx.category_id] || 0) + amount;
      }
      if (!largestExpense || amount > largestExpense.amount) {
        largestExpense = { amount, label: tx.note || tx.description || tx.title || 'Dépense ponctuelle' };
      }
    });
    return { spentByCategory, totalSpent, largestExpense };
  }, [filtered]);

  const totalIncome = useMemo(
    () => filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [filtered]
  );

  // Scale budgets to the period length (monthly budgets → period equivalent)
  const periodDays = daysInPeriod;
  const budgetScale = periodDays / 30; // rough scale from monthly

  const totalBudget = useMemo(
    () => categories.reduce(
      (sum, c) => sum + monthlyEquivalent(Number(c.budget) || 0, c.cycle) * budgetScale,
      0
    ),
    [categories, budgetScale]
  );

  const totalSubscriptions = useMemo(
    () => activeSubscriptions.reduce(
      (sum, s) => sum + monthlyEquivalent(Number(s.amount) || 0, s.cycle) * budgetScale,
      0
    ),
    [activeSubscriptions, budgetScale]
  );

  const categoryRows = useMemo(
    () => categories
      .map(c => {
        const spent = monthlyCategorySummary.spentByCategory[c.id] || 0;
        const monthlyBudget = monthlyEquivalent(Number(c.budget) || 0, c.cycle) * budgetScale;
        const usagePct  = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
        const sharePct  = monthlyCategorySummary.totalSpent > 0 ? (spent / monthlyCategorySummary.totalSpent) * 100 : 0;
        return { ...c, spent, monthlyBudget, usagePct, sharePct, remaining: monthlyBudget - spent };
      })
      .filter(c => c.spent > 0 || c.monthlyBudget > 0)
      .sort((a, b) => b.spent !== a.spent ? b.spent - a.spent : b.monthlyBudget - a.monthlyBudget),
    [categories, monthlyCategorySummary, budgetScale]
  );

  const focusCategory = useMemo(() => {
    return categoryRows.filter(c => c.monthlyBudget > 0).sort((a, b) => b.usagePct - a.usagePct)[0] || null;
  }, [categoryRows]);

  // ── Evolution chart ────────────────────────────────────────
  const trendData = useMemo(() => {
    const slots = buildSlots(activePeriod, offset);

    transactions.forEach(tx => {
      if (tx.type !== 'expense') return;
      const d = new Date(tx.date);
      const amount = Number(tx.amount) || 0;

      if (activePeriod === 'week') {
        const key = d.toISOString().split('T')[0];
        const slot = slots.find(s => s.key === key);
        if (slot) slot.total += amount;
      } else if (activePeriod === 'month') {
        // week slots have startD/endD
        const slot = slots.find(s => d >= s.startD && d <= s.endD);
        if (slot) slot.total += amount;
      } else {
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const slot = slots.find(s => s.key === key);
        if (slot) slot.total += amount;
      }
    });

    const values = slots.map(s => s.total);
    const maxSpend = Math.max(...values, 1);
    const nonZero  = values.filter(v => v > 0);
    const avgSpend = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
    const lastTwo  = slots.slice(-2);
    const curr     = lastTwo[1]?.total ?? 0;
    const prev     = lastTwo[0]?.total ?? 0;
    const trendPct = prev > 0 ? ((curr - prev) / prev) * 100 : null;

    return { slots, maxSpend, averageSpend: avgSpend, currentTotal: curr, previousTotal: prev, trendPct };
  }, [transactions, activePeriod, offset]);

  // ── Derived values ─────────────────────────────────────────
  const totalSpent      = monthlyCategorySummary.totalSpent;
  const remaining       = totalBudget - totalSpent;
  const budgetPct       = totalBudget > 0 ? clamp((totalSpent / totalBudget) * 100, 0, 100) : 0;
  const projectedSpend  = daysElapsed > 0 ? (totalSpent / daysElapsed) * daysInPeriod : 0;
  const projectedGap    = projectedSpend - totalBudget;
  const paceDelta       = budgetPct - elapsedPct;
  const subscriptionsShare = totalBudget > 0 ? (totalSubscriptions / totalBudget) * 100 : 0;
  const isOverBudget    = totalBudget > 0 && totalSpent > totalBudget;
  const hasTransactions = totalSpent > 0;

  const mainInsight = useMemo(() => {
    if (totalBudget <= 0) return { tone: 'neutral', title: 'Ajoutez un budget', text: 'Définissez un budget par catégorie pour suivre vos dépenses.' };
    if (!hasTransactions) return { tone: 'neutral', title: 'Aucune dépense', text: `Aucune dépense sur cette période. Tout votre budget est disponible.` };
    if (isOverBudget) return { tone: 'alert', title: 'Budget dépassé', text: `${formatAmount(totalSpent - totalBudget, currency)} au-dessus du budget.` };
    if (projectedSpend > totalBudget * 1.08) return { tone: 'warning', title: 'Rythme trop élevé', text: `À ce rythme, vous finirez la période à ${formatAmount(projectedSpend, currency)}.` };
    if (focusCategory && focusCategory.usagePct >= 85) return { tone: 'warning', title: `${focusCategory.name} monte vite`, text: `${focusCategory.usagePct.toFixed(0)}% du budget de cette catégorie est déjà utilisé.` };
    if (subscriptionsShare >= 30) return { tone: 'warning', title: 'Abonnements élevés', text: `${formatAmount(totalSubscriptions, currency)}/mois, soit ${subscriptionsShare.toFixed(0)}% du budget.` };
    return { tone: 'good', title: 'Bon rythme', text: `${formatAmount(remaining, currency)} restants. Vous êtes dans le budget.` };
  }, [currency, focusCategory, hasTransactions, isOverBudget, projectedSpend, remaining, subscriptionsShare, totalBudget, totalSpent, totalSubscriptions]);

  const toneColors = pickToneColors(mainInsight.tone, Colors);

  const scoreCards = [
    {
      label: 'Rythme de dépense',
      value: `${paceDelta >= 0 ? '+' : ''}${paceDelta.toFixed(0)}%`,
      hint: paceDelta > 10
        ? 'Vous dépensez plus vite que la période ne s\'écoule'
        : paceDelta > 0
          ? 'Légèrement au-dessus du rythme normal'
          : 'Vous êtes dans les clous',
      tone: paceDelta > 10 ? 'alert' : paceDelta > 0 ? 'warning' : 'good',
    },
    {
      label: 'Estimation fin de période',
      value: hasTransactions ? formatAmount(projectedSpend, currency) : '—',
      hint: hasTransactions
        ? projectedGap > 0
          ? `+${formatAmount(projectedGap, currency)} au-dessus du budget`
          : `${formatAmount(Math.abs(projectedGap), currency)} sous le budget`
        : 'Pas assez de données',
      tone: projectedGap > 0 ? 'warning' : 'good',
    },
    {
      label: 'Abonnements actifs',
      value: formatAmount(totalSubscriptions, currency),
      hint: totalBudget > 0
        ? `${subscriptionsShare.toFixed(0)}% du budget total`
        : 'Coût fixe mensuel',
      tone: subscriptionsShare >= 30 ? 'warning' : 'neutral',
    },
  ];

  const trendNarrative = useMemo(() => {    if (trendData.trendPct === null) return 'Pas assez de données pour comparer.';
    if (trendData.trendPct > 0) return `Dépenses en hausse de ${trendData.trendPct.toFixed(0)}% vs période précédente.`;
    if (trendData.trendPct < 0) return `Dépenses en baisse de ${Math.abs(trendData.trendPct).toFixed(0)}% vs période précédente.`;
    return 'Dépenses stables par rapport à la période précédente.';
  }, [trendData.trendPct]);

  const styles = makeStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>{t('reports.subtitle')}</Text>
            <Text style={styles.title}>{t('reports.title')}</Text>
          </View>
          {totalIncome > 0 && (
            <View style={styles.incomeChip}>
              <Text style={styles.incomeChipTxt}>+{formatAmount(totalIncome, currency)}</Text>
            </View>
          )}
        </View>

        {/* ── Single filter bar: ‹ date › on left, Period ∨ on right ── */}
        <View style={styles.filterBar}>
          {/* Date navigator */}
          <View style={styles.dateNav}>
            <Pressable style={styles.dateNavBtn} onPress={() => setOffset(o => o - 1)} hitSlop={8}>
              <Text style={styles.dateNavArrow}>‹</Text>
            </Pressable>
            <Pressable onPress={() => setOffset(0)} style={styles.dateNavLabel}>
              <Text style={styles.dateNavTxt} numberOfLines={1}>{label}</Text>
            </Pressable>
            <Pressable
              style={[styles.dateNavBtn, isCurrentPeriod && styles.dateNavBtnDisabled]}
              onPress={() => !isCurrentPeriod && setOffset(o => o + 1)}
              hitSlop={8}
            >
              <Text style={[styles.dateNavArrow, isCurrentPeriod && styles.dateNavArrowDisabled]}>›</Text>
            </Pressable>
          </View>

          {/* Period dropdown trigger */}
          <Pressable
            ref={periodBtnRef}
            style={styles.periodDropdown}
            onPress={() => {
              periodBtnRef.current?.measureInWindow((x, y, width, height) => {
                setMenuPos({ top: y + height + 6, right: Metrics.screenPadding });
                setShowPeriodMenu(true);
              });
            }}
          >
            <Text style={styles.periodDropdownTxt}>
              {PERIODS.find(p => p.key === activePeriod)?.label}
            </Text>
            <Text style={styles.periodDropdownChevron}> ∨</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Period dropdown menu (Modal overlay) ── */}
      <Modal
        visible={showPeriodMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPeriodMenu(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPeriodMenu(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuCard, { top: menuPos.top, right: menuPos.right }]}>
                {PERIODS.map((p, i) => (
                  <Pressable
                    key={p.key}
                    style={[
                      styles.menuItem,
                      activePeriod === p.key && styles.menuItemActive,
                      i < PERIODS.length - 1 && styles.menuItemBorder,
                    ]}
                    onPress={() => {
                      setActivePeriod(p.key);
                      setOffset(0);
                      setShowPeriodMenu(false);
                    }}
                  >
                    <Text style={[
                      styles.menuItemTxt,
                      activePeriod === p.key && styles.menuItemTxtActive,
                    ]}>
                      {p.label}
                    </Text>
                    {activePeriod === p.key && (
                      <Text style={styles.menuItemCheck}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Hero card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroStatusBadge, { backgroundColor: toneColors.soft }]}>
              <Text style={[styles.heroStatusText, { color: toneColors.text }]}>{mainInsight.title}</Text>
            </View>
          </View>

          {/* Contextual hero message when over budget */}
          {isOverBudget && totalBudget > 0 ? (
            <>
              <Text style={styles.heroContextMsg}>
                Vous avez dépensé {(totalSpent / totalBudget).toFixed(1)}× votre budget
              </Text>
              <Text style={styles.heroAmount}>{formatAmount(totalSpent, currency)}</Text>
            </>
          ) : (
            <Text style={styles.heroAmount}>{formatAmount(totalSpent, currency)}</Text>
          )}

          <Text style={styles.heroSupport}>
            {totalBudget > 0
              ? `${budgetPct.toFixed(0)}% du budget · ${elapsedPct.toFixed(0)}% de la période écoulée`
              : 'Ajoutez un budget pour mieux suivre vos dépenses.'}
          </Text>

          <View style={styles.heroMeterTrack}>
            <View style={[styles.heroMeterFill, { width: `${clamp(budgetPct, 0, 100)}%`, backgroundColor: toneColors.accent, opacity: 0.5 }]} />
            <View style={[styles.heroMeterMarker, { left: `${clamp(elapsedPct, 2, 98)}%` }]} />
          </View>
          <View style={styles.heroLegendRow}>
            <Text style={styles.heroLegendText}>Budget utilisé</Text>
            <Text style={styles.heroLegendText}>Période écoulée</Text>
          </View>

          <View style={styles.heroDivider} />
          <Text style={styles.mainInsightText}>{mainInsight.text}</Text>

          {/* État actuel */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Dépensé</Text>
              <Text style={styles.quickStatValue}>{formatAmount(totalSpent, currency)}</Text>
            </View>
            <View style={[styles.quickStatItem, styles.quickStatItemBorder]}>
              <Text style={styles.quickStatLabel}>Budget</Text>
              <Text style={styles.quickStatValue}>{totalBudget > 0 ? formatAmount(totalBudget, currency) : '—'}</Text>
            </View>
            <View style={[styles.quickStatItem, styles.quickStatItemBorder]}>
              <Text style={styles.quickStatLabel}>Reste</Text>
              <Text style={[styles.quickStatValue, { color: remaining >= 0 ? Colors.pureWhite : '#FF8A9B' }]}>
                {totalBudget > 0 ? formatDelta(remaining, currency) : '—'}
              </Text>
            </View>
          </View>

          {/* Projection — visuellement séparée */}
          {hasTransactions && totalBudget > 0 && (
            <View style={styles.heroProjectionRow}>
              <Text style={styles.heroProjectionLabel}>Projection fin de période</Text>
              <Text style={[
                styles.heroProjectionValue,
                { 
                  color: projectedSpend > totalBudget ? '#FF8A9B' : Colors.pureWhite, 
                  opacity: 0.85 
                },
              ]}>
                {formatAmount(projectedSpend, currency)}
                {projectedSpend > totalBudget ? '  ⚠' : '  ✓'}
              </Text>
            </View>
          )}
        </View>

        {/* ── Résumé rapide (accordion) ── */}
        <Accordion
          title={t('reports.quickSummary')}
          meta={monthlyCategorySummary.largestExpense
            ? t('reports.largestExpense', { amount: formatAmount(monthlyCategorySummary.largestExpense.amount, currency) })
            : null}
          defaultOpen
          Colors={Colors}
        >
          <View style={styles.summaryList}>
            {scoreCards.map((card, index) => {
              const cardTone = pickToneColors(card.tone, Colors);
              return (
                <View key={card.label} style={[styles.summaryRow, index < scoreCards.length - 1 && styles.summaryRowBorder]}>
                  <Text style={styles.summaryLabel}>{card.label}</Text>
                  <View style={styles.summaryValueWrap}>
                    <Text style={[styles.summaryValue, { color: cardTone.text }]}>{card.value}</Text>
                    <Text style={[styles.summaryHint, card.tone !== 'neutral' && card.tone !== 'good' && { color: cardTone.text }]}>
                      {card.hint}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Accordion>

        {/* ── Catégories (accordion) ── */}
        <Accordion
          title={t('reports.categories')}
          tag={categoryRows.length > 0 ? t('reports.activeCategories', { count: categoryRows.length }) : null}
          defaultOpen
          Colors={Colors}
        >
          {categoryRows.length === 0 ? (
            <Text style={styles.emptyStateText}>{t('reports.noExpenseOrBudget')}</Text>
          ) : (
            categoryRows.map((category, index) => {
              const barWidth = category.monthlyBudget > 0
                ? clamp(category.usagePct, 4, 100)
                : clamp(category.sharePct, 4, 100);
              const barColor = category.monthlyBudget > 0 && category.usagePct > 100
                ? Colors.expense
                : category.color || Colors.accent;

              return (
                <View key={category.id} style={[styles.categoryRow, index < categoryRows.length - 1 && styles.categoryRowBorder]}>
                  <View style={styles.categoryTopRow}>
                    {/* Icon + name */}
                    <View style={styles.categoryNameRow}>
                      <View style={[styles.catIconBubble, { backgroundColor: `${category.color || Colors.accent}18` }]}>
                        <Text style={styles.catIconEmoji}>{category.icon || '📦'}</Text>
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>{formatAmount(category.spent, currency)}</Text>
                  </View>

                  <View style={styles.categoryTrack}>
                    <View style={[styles.categoryFill, { width: `${barWidth}%`, backgroundColor: barColor }]} />
                  </View>

                  <View style={styles.categoryBottomRow}>
                    <Text style={styles.categoryMeta}>
                      {category.monthlyBudget > 0
                        ? `${category.usagePct.toFixed(0)}% du budget`
                        : `${category.sharePct.toFixed(0)}% des dépenses`}
                    </Text>
                    <Text style={[styles.categoryMeta, category.remaining < 0 && styles.categoryMetaAlert]}>
                      {category.monthlyBudget > 0
                        ? `${category.remaining >= 0 ? 'reste' : 'dépassé'} ${formatAmount(Math.abs(category.remaining), currency)}`
                        : 'pas de budget'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </Accordion>

        {/* ── Évolution (accordion) ── */}
        <Accordion
          title={t('reports.evolution')}
          tag={label}
          defaultOpen
          Colors={Colors}
        >
          <Text style={styles.panelSubtitle}>{trendNarrative}</Text>
          <View style={styles.panelDivider} />

          <View style={styles.chart}>
            {trendData.slots.map((slot, index) => {
              const isLast = index === trendData.slots.length - 1;
              const isAboveAvg = trendData.averageSpend > 0 && slot.total > trendData.averageSpend;
              const color = isLast ? Colors.accent : isAboveAvg ? Colors.expense : Colors.income;
              const heightPct = (slot.total / trendData.maxSpend) * 100;

              return (
                <View key={slot.key} style={styles.chartColumn}>
                  {/* Value label on tallest bar */}
                  {slot.total > 0 && heightPct >= 85 && (
                    <Text style={styles.chartBarVal}>
                      {Math.round(slot.total / 1000) > 0 ? `${(slot.total/1000).toFixed(0)}k` : fmtK(slot.total)}
                    </Text>
                  )}
                  <View style={styles.chartTrack}>
                    <View style={[
                      styles.chartBar,
                      {
                        height: `${heightPct}%`,
                        backgroundColor: slot.total > 0 ? color : Colors.borderStrong,
                        opacity: isLast ? 1 : 0.65,
                      },
                    ]} />
                  </View>
                  <Text style={[styles.chartLabel, isLast && styles.chartLabelActive]}>{slot.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Average line legend */}
          {trendData.averageSpend > 0 && (
            <View style={styles.avgLegend}>
              <View style={styles.avgLegendDash} />
              <Text style={styles.avgLegendTxt}>Moy. {formatAmount(trendData.averageSpend, currency)}</Text>
            </View>
          )}

          <View style={styles.trendFooter}>
            <View style={styles.trendStat}>
              <Text style={styles.trendStatLabel}>Période actuelle</Text>
              <Text style={styles.trendStatValue}>{formatAmount(trendData.currentTotal, currency)}</Text>
            </View>
            {trendData.previousTotal > 0 && (
              <View style={[styles.trendStat, { alignItems: 'flex-end' }]}>
                <Text style={styles.trendStatLabel}>Période précédente</Text>
                <Text style={styles.trendStatValue}>{formatAmount(trendData.previousTotal, currency)}</Text>
              </View>
            )}
          </View>
        </Accordion>

      </ScrollView>
    </SafeAreaView>
  );
}

function fmtK(v) {
  return v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(Math.round(v));
}

function makeStyles(Colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ────────────────────────────────────────────────
  header: {
    paddingTop: Metrics.headerTop,
    paddingHorizontal: Metrics.screenPadding,
    paddingBottom: Spacing.smd,
    gap: Spacing.smd,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 22,
    color: Colors.text,
    letterSpacing: -0.5,
    lineHeight: 26,
    marginTop: 1,
  },
  incomeChip: {
    backgroundColor: Colors.incomeSoft,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${Colors.income}22`,
  },
  incomeChipTxt: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 12,
    color: Colors.income,
  },

  // ── Period pills (unused — replaced by filterBar) ────────
  pillsRow: { flexDirection: 'row', gap: 6 },
  pill: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.borderStrong, backgroundColor: Colors.white },
  pillActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pillTxt: { ...Fonts.primary, ...Fonts.semiBold, fontSize: 12, color: Colors.textSecondary },
  pillTxtActive: { color: Colors.white },

  // ── Period navigator (unused — replaced by filterBar) ─────
  navigator: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.borderStrong, overflow: 'hidden' },
  navBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.2 },
  navArrow: { ...Fonts.primary, ...Fonts.bold, fontSize: 20, color: Colors.text, lineHeight: 24 },
  navArrowDisabled: { color: Colors.textMuted },
  navCenter: { flex: 1, alignItems: 'center', paddingVertical: 9, borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.borderStrong },
  navLabel: { ...Fonts.primary, ...Fonts.bold, fontSize: 13, color: Colors.text, letterSpacing: -0.1 },
  navBack: { ...Fonts.primary, fontSize: 10, color: Colors.income, marginTop: 2 },

  // ── Compact filter bar ────────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Date navigator — left side
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  dateNavBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavBtnDisabled: { opacity: 0.25 },
  dateNavArrow: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 22,
    color: Colors.text,
    lineHeight: 26,
  },
  dateNavArrowDisabled: { color: Colors.textMuted },
  dateNavLabel: {
    paddingHorizontal: 2,
  },
  dateNavTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 15,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  // Period dropdown — right side
  periodDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  periodDropdownTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 15,
    color: Colors.accent,
    letterSpacing: -0.2,
  },
  periodDropdownChevron: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 13,
    color: Colors.accent,
    lineHeight: 18,
  },

  // ── Dropdown menu ─────────────────────────────────────────
  menuOverlay: {
    flex: 1,
  },
  menuCard: {
    position: 'absolute',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    minWidth: 160,
    ...Shadow.premium,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemActive: {
    backgroundColor: Colors.surface,
  },
  menuItemTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 14,
    color: Colors.text,
  },
  menuItemTxtActive: {
    color: Colors.accent,
    ...Fonts.bold,
  },
  menuItemCheck: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 13,
    color: Colors.accent,
  },

  // ── Scroll ────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: Metrics.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: 164,
    gap: Spacing.smd,
  },

  // ── Hero card ─────────────────────────────────────────────
  heroCard: {
    backgroundColor: Colors.accentDeep,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    gap: Spacing.smd,
    ...Shadow.premium,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroMonthBadgeText: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 10,
    color: Colors.pureWhite,
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  heroStatusText: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 11,
  },
  heroAmount: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 34,
    color: Colors.pureWhite,
    letterSpacing: -1,
  },
  heroLabel: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 12,
    color: Colors.pureWhite,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroSupport: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.pureWhite,
    opacity: 0.45,
    lineHeight: 16,
  },
  heroMeterTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.pureWhite,
    opacity: 0.12,
    overflow: 'hidden',
    position: 'relative',
  },
  heroMeterFill: { height: '100%', borderRadius: Radius.pill },
  heroMeterMarker: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 2, marginLeft: -1,
    backgroundColor: Colors.pureWhite,
    opacity: 0.8,
    borderRadius: 1,
  },
  heroLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  heroLegendText: {
    ...Fonts.primary,
    fontSize: 9,
    color: Colors.pureWhite,
    opacity: 0.3,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.pureWhite,
    opacity: 0.10,
  },
  mainInsightText: {
    ...Fonts.primary,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.pureWhite,
    opacity: 0.72,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickStatItem: {
    flex: 1,
    paddingVertical: Spacing.smd,
    paddingHorizontal: Spacing.smd,
  },
  quickStatItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  quickStatLabel: {
    ...Fonts.primary,
    fontSize: 9,
    color: Colors.pureWhite,
    opacity: 0.45,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  quickStatValue: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 13,
    color: Colors.pureWhite,
    letterSpacing: -0.3,
  },

  // ── Accordion panel ───────────────────────────────────────
  softPanel: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  accordionLeft: { flex: 1, gap: 3 },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionChevron: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 16,
    color: Colors.textMuted,
    lineHeight: 18,
    transform: [{ rotate: '90deg' }],
  },
  accordionBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  panelTitle: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 14,
    color: Colors.text,
    letterSpacing: -0.1,
  },
  panelTag: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 10,
    color: Colors.textSecondary,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  panelMeta: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyStateText: {
    ...Fonts.primary,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
    paddingVertical: Spacing.xs,
  },

  // ── Summary rows ──────────────────────────────────────────
  summaryList: { gap: 0 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.smd,
    gap: Spacing.md,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  summaryValueWrap: { alignItems: 'flex-end' },
  summaryValue: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 14,
    letterSpacing: -0.3,
  },
  summaryHint: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'right',
    maxWidth: 180,
  },

  // ── Category rows ─────────────────────────────────────────
  categoryRow: {
    gap: 7,
    paddingVertical: Spacing.smd,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  catIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catIconEmoji: { fontSize: 15 },
  categoryName: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  categoryAmount: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 13,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  categoryTrack: {
    height: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  categoryFill: { height: '100%', borderRadius: Radius.pill },
  categoryBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  categoryMeta: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textMuted,
  },
  categoryMetaAlert: {
    color: Colors.expense,
    ...Fonts.semiBold,
  },

  // ── Evolution chart ───────────────────────────────────────
  panelSubtitle: {
    ...Fonts.primary,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  panelDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  chart: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  chartBarVal: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 8,
    color: Colors.accent,
  },
  chartTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xs,
    overflow: 'hidden',
    minWidth: 6,
  },
  chartBar: {
    width: '100%',
    borderRadius: Radius.xs,
  },
  chartLabel: {
    ...Fonts.primary,
    fontSize: 9,
    color: Colors.textMuted,
  },
  chartLabelActive: {
    ...Fonts.bold,
    color: Colors.text,
  },

  avgLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avgLegendDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  avgLegendTxt: {
    ...Fonts.primary,
    ...Fonts.semiBold,
    fontSize: 10,
    color: Colors.textSecondary,
  },

  trendFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.smd,
    paddingVertical: Spacing.sm,
  },
  trendStat: { gap: 2 },
  trendStatLabel: {
    ...Fonts.primary,
    fontSize: 10,
    color: Colors.textMuted,
  },
  trendStatValue: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 13,
    color: Colors.text,
    letterSpacing: -0.3,
  },

  // ── Hero extras ───────────────────────────────────────────
  heroContextMsg: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 12,
    color: '#FECACA',
    letterSpacing: 0.1,
  },
  heroProjectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.pureWhite,
    opacity: 0.07,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.smd,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.pureWhite,
  },
  heroProjectionLabel: {
    ...Fonts.primary,
    fontSize: 10,
    color: Colors.pureWhite,
    opacity: 0.45,
  },
  heroProjectionValue: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 12,
    letterSpacing: -0.2,
  },
}); }
