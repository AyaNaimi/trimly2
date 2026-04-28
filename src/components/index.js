// src/components/index.js
// Trimly-Minimal: Clean Professional components

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
} from 'react-native';
import {
  Colors, Fonts, Radius, Shadow, Spacing, Layout, Metrics,
} from '../theme';
import { PremiumHaptics } from '../utils/haptics';
import { useApp } from '../context/AppContext';

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.985,
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

export function AnimatedProgressBar({ pct, color, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(pct, 100),
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.pbTrack, style]}>
      <Animated.View style={[styles.pbFill, { width, backgroundColor: color || Colors.accent }]} />
    </View>
  );
}

export function CategoryRow({ category, onPress, simple }) {
  const { state } = useApp();
  const { name, icon, color, budget, spent } = category;
  const left = budget - spent;
  const isOver = left < 0;
  const { scale, onPressIn, onPressOut } = usePressScale();

  const handlePress = () => {
    PremiumHaptics.click();
    onPress && onPress();
  };

  return (
    <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.catMinimalRow, simple && { paddingVertical: 12 }, { transform: [{ scale }] }]}>
        <View style={[styles.catIcon, { backgroundColor: color + '2E' }]}>
          <Text style={{ fontSize: 16, color: color }}>{icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.catName}>{name}</Text>
          <Text style={styles.catSubtext}>Budget {budget}{state.currency}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.catSpent, isOver && { color: Colors.error }]}>
              {spent.toFixed(0)} {state.currency}
            </Text>
            <Text style={styles.catLeft}>{left > 0 ? `Restant ${left.toFixed(0)}${state.currency}` : 'Depassement'}</Text>
          </View>
          <BudgetHealthBadge spent={spent} budget={budget} size="sm" />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function CategorySection({ label, daysLeft, budgeted, left, children }) {
  const { state } = useApp();
  return (
    <View style={styles.sectionMinimal}>
      <View style={styles.sectionHdr}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>{label}</Text>
          <Text style={styles.groupDays}>{daysLeft} jours restants</Text>
        </View>
        <View style={styles.sectionStats}>
          <Text style={[styles.groupColVal, left < 0 && { color: Colors.error }]}>
            {left.toFixed(0)} {state.currency}
          </Text>
          <Text style={styles.groupColLbl}>Restant</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

export function PrimaryButton({ onPress, label, style }) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.primaryBtn, style, { transform: [{ scale }] }]}>
        <Text style={styles.primaryBtnText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Toggle({ value, onChange }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.borderStrong, Colors.accent] });

  return (
    <Pressable onPress={() => onChange(!value)}>
      <Animated.View style={[styles.toggleTrack, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export function SubCard({ sub, billing, onPress }) {
  const { state } = useApp();
  const isUrgent = billing.urgency === 'urgent' || billing.urgency === 'today';
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.subMinimalCard, isUrgent && { borderColor: Colors.error }, { transform: [{ scale }] }]}>
        <View style={[styles.subIcon, { backgroundColor: sub.color + '2E' }]}>
          <Text style={{ fontSize: 18, color: sub.color }}>{sub.icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.subName}>{sub.name}</Text>
          <Text style={styles.subMeta}>{sub.category} - {billing.label}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.subPrice}>{sub.amount.toFixed(2)} {state.currency}</Text>
          <Text style={[styles.subUrgency, isUrgent && { color: Colors.error }]}>{billing.urgency.toUpperCase()}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function SettingsRow({ title, value, onPress, children, danger }) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[Layout.listItem, styles.settingsRow, { transform: [{ scale }] }]}>
        <Text style={[styles.settingsTitle, danger && { color: Colors.error }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
          {children}
          {onPress && !children ? <Text style={styles.chevron}>›</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function SecondaryButton({ onPress, label = '←', style }) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.secondaryBtn, style, { transform: [{ scale }] }]}>
        <Text style={styles.secondaryBtnText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function PeriodPill({ label, onPress }) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable style={styles.periodPill} onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale }] }}>
        <Text style={styles.periodPillText}>{label}</Text>
        <Text style={{ color: Colors.accent, marginLeft: 6, fontSize: 12 }}>▼</Text>
      </Animated.View>
    </Pressable>
  );
}

export function BudgetHealthBadge({ spent, budget, size = 'sm' }) {
  const percentage = (spent / budget) * 100;
  let badgeColor = Colors.budgetHealthy;
  let badgeText = '✓';
  
  if (percentage >= 100) {
    badgeColor = Colors.budgetOver;
    badgeText = '!';
  } else if (percentage >= 80) {
    badgeColor = Colors.budgetWarning;
    badgeText = '⚠';
  }

  const sizeMap = {
    sm: { width: 24, height: 24, fontSize: 12 },
    md: { width: 32, height: 32, fontSize: 16 },
    lg: { width: 40, height: 40, fontSize: 18 },
  };

  const dims = sizeMap[size];

  return (
    <View
      style={{
        width: dims.width,
        height: dims.height,
        borderRadius: dims.width / 2,
        backgroundColor: badgeColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: dims.fontSize, color: '#fff', ...Fonts.bold }}>
        {badgeText}
      </Text>
    </View>
  );
}

export function TrendIndicator({ trend }) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  
  let icon = '→';
  let color = Colors.textMuted;

  if (isPositive) {
    icon = '↑';
    color = Colors.budgetOver;
  } else if (!isNeutral) {
    icon = '↓';
    color = Colors.budgetHealthy;
  }

  return (
    <Text style={{ color, fontSize: 12, ...Fonts.bold }}>
      {icon}
    </Text>
  );
}

export function StatCard({ label, value, currency, trend, style }) {
  const { state } = useApp();
  const currencySymbol = currency || state.currency;

  return (
    <View style={[styles.statCard, style]}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={styles.statValue}>
          {value} {currencySymbol}
        </Text>
        {trend !== undefined && <TrendIndicator trend={trend} />}
      </View>
    </View>
  );
}

export function QuickStatsRow({ categories, state }) {
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalBudget = categories.reduce((sum, cat) => sum + cat.budget, 0);
  const remaining = totalBudget - totalSpent;

  return (
    <View style={styles.quickStatsRow}>
      <StatCard
        label="Dépensé"
        value={totalSpent.toFixed(0)}
        currency={state.currency}
        style={{ flex: 1 }}
      />
      <StatCard
        label="Budget"
        value={totalBudget.toFixed(0)}
        currency={state.currency}
        style={{ flex: 1 }}
      />
      <StatCard
        label="Restant"
        value={remaining.toFixed(0)}
        currency={state.currency}
        trend={remaining > 0 ? -1 : 1}
        style={{ flex: 1 }}
      />
    </View>
  );
}

export function TrialBanner({ daysLeft, onSubscribe, onClose }) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  const dayLabel = daysLeft > 1 ? 'jours' : 'jour';
  const urgencyCopy = daysLeft <= 3
    ? 'Derniers jours pour conserver tous les avantages Pro.'
    : "Passez a Pro pour garder l'acces complet a l'experience.";
  return (
    <View style={styles.trialBanner}>
      <View style={styles.trialBannerCopy}>
        <Text style={styles.trialBannerText}>Plus que {daysLeft} {dayLabel}</Text>
        <View style={styles.trialBannerDaysPill}>
          <Text style={styles.trialBannerDaysLabel}>Essai gratuit</Text>
        </View>
        <Text style={styles.trialBannerSubtext}>{urgencyCopy}</Text>
        <View style={styles.trialBannerActions}>
          <Pressable
            onPress={() => {
              PremiumHaptics.success();
              onSubscribe && onSubscribe();
            }}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
          >
            <Animated.View style={[styles.trialBannerCta, { transform: [{ scale }] }]}>
              <Text style={styles.trialBannerCtaText}>Voir Pro</Text>
            </Animated.View>
          </Pressable>
          <Pressable
            style={styles.trialBannerClose}
            onPress={() => {
              PremiumHaptics.click();
              onClose && onClose();
            }}
          >
            <Text style={styles.trialBannerCloseText}>Plus tard</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Budget Health Badge
  budgetHealthBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stat Card
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.smd,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    ...Fonts.primary,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 16,
    color: Colors.text,
  },

  // Quick Stats Row
  quickStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },

  pbTrack: { height: 6, backgroundColor: Colors.border, borderRadius: Radius.pill, overflow: 'hidden' },
  pbFill: { height: '100%', borderRadius: Radius.pill },

  catMinimalRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    minHeight: Metrics.minTouch + 8,
  },
  catIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  catName: { ...Fonts.primary, ...Fonts.bold, fontSize: 14, color: Colors.text },
  catSubtext: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  catSpent: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
  catLeft: { ...Fonts.primary, fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  sectionMinimal: { marginBottom: Spacing.xl },
  sectionHdr: {
    flexDirection: 'row', alignItems: 'flex-end', paddingBottom: Spacing.smd,
    borderBottomWidth: 1.5, borderBottomColor: Colors.text, marginBottom: 8,
  },
  sectionLabel: { ...Fonts.primary, ...Fonts.black, fontSize: 17, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionStats: { alignItems: 'flex-end' },
  groupDays: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  groupColVal: { ...Fonts.primary, ...Fonts.black, fontSize: 17, color: Colors.text },
  groupColLbl: { ...Fonts.primary, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBody: { paddingTop: 4 },

  primaryBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.md,
    paddingVertical: 16, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center', minHeight: 52,
  },
  primaryBtnText: { color: Colors.white, ...Fonts.primary, ...Fonts.bold, fontSize: 15 },

  secondaryBtn: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: Colors.borderStrong,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 18, color: Colors.text, ...Fonts.bold },

  toggleTrack: { width: 44, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', ...Shadow.soft },

  subMinimalCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: Colors.white, borderRadius: Radius.lg, marginBottom: 10,
    borderWidth: 1.2, borderColor: Colors.border, minHeight: 76,
  },
  subIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  subName: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
  subMeta: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
  subPrice: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
  subUrgency: { ...Fonts.primary, fontSize: 9, ...Fonts.black, color: Colors.textMuted, marginTop: 4 },

  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, borderBottomColor: Colors.border,
  },
  settingsTitle: { ...Fonts.primary, ...Fonts.medium, fontSize: 15, color: Colors.text },
  settingsValue: { ...Fonts.primary, fontSize: 13, color: Colors.textSecondary },
  chevron: { fontSize: 18, color: Colors.textMuted, marginLeft: 4 },

  periodPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accentMuted,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.pill, minHeight: Metrics.minTouch,
  },
  periodPillText: { ...Fonts.primary, ...Fonts.bold, fontSize: 13, color: Colors.accent },

  trialBanner: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.medium,
  },
  trialBannerCopy: { flex: 1 },
  trialBannerText: {
    ...Fonts.primary,
    ...Fonts.black,
    fontSize: 18,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  trialBannerDaysPill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  trialBannerDaysLabel: {
    ...Fonts.primary,
    fontSize: 10,
    ...Fonts.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trialBannerSubtext: {
    ...Fonts.primary,
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginBottom: 10,
  },
  trialBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trialBannerCta: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 34,
    justifyContent: 'center',
  },
  trialBannerCtaText: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 10,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  trialBannerClose: {
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  trialBannerCloseText: {
    ...Fonts.primary,
    ...Fonts.bold,
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
