// src/components/index.js
// All shared UI components - Standard Animated Version for Stability

import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { PremiumHaptics } from '../utils/haptics';
import { Colors, Fonts, Radius, Shadow, Spacing } from '../theme';

// ──────────────────────────────────────────────────────
// ProgressBar with animated fill
// ──────────────────────────────────────────────────────
export function AnimatedProgressBar({ pct, color, style }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(pct, 100),
      duration: 700,
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
      <Animated.View style={[styles.pbFill, { width, backgroundColor: color || Colors.purple }]} />
    </View>
  );
}

// ──────────────────────────────────────────────────────
// CategoryRow
// ──────────────────────────────────────────────────────
export function CategoryRow({ category, onPress, simple }) {
  const { name, icon, color, budget, spent } = category;
  const left = budget - spent;
  const isOver = left < 0;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    PremiumHaptics.click(); // Fancy double-click feel
    onPress && onPress();
  };

  const pressIn = () => {
    Animated.spring(scaleAnim, { 
      toValue: 0.97, 
      useNativeDriver: true,
      tension: 180,
      friction: 12
    }).start();
  };
  
  const pressOut = () => {
    Animated.spring(scaleAnim, { 
      toValue: 1, 
      useNativeDriver: true,
      tension: 100,
      friction: 10
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.catUnifiedCard,
          simple && styles.catRowSimple,
          isOver && !simple && { borderColor: Colors.red }
        ]}
      >
        <View style={styles.catTopRow}>
          <View style={[styles.catIcon, { backgroundColor: color   }]}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.catName}>{name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.catSpent, isOver && { color: Colors.red }]}>
              {left.toFixed(0)} €
            </Text>
            <View style={[styles.catPill, { backgroundColor: '#F0F0F3' }]}>
              <Text style={styles.catPillText}>
                {spent.toFixed(0)}€ dépensés
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────
// CategorySection
// ──────────────────────────────────────────────────────
export function CategorySection({ label, daysLeft, budgeted, left, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHdr}>
        <View>
          <Text style={styles.sectionLabel}>{label}</Text>
          <Text style={styles.groupDays}>{daysLeft} jours restants</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 20 }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.groupColLbl}>Budget</Text>
            <Text style={styles.groupColVal}>{budgeted.toFixed(0)} €</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.groupColLbl}>Restant</Text>
            <Text style={[styles.groupColVal, left < 0 && { color: Colors.red }]}>
              {left.toFixed(2)} €
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────
// Primary Button
// ──────────────────────────────────────────────────────
export function PrimaryButton({ onPress, label, style, loading }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.primaryBtn, style]}
      >
        <Text style={styles.primaryBtnText}>{label} →</Text>
      </Pressable>
    </Animated.View>
  );
}

// ──────────────────────────────────────────────────────
// Toggle Switch
// ──────────────────────────────────────────────────────
export function Toggle({ value, onChange }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.border, Colors.purple] });

  return (
    <Pressable onPress={() => onChange(!value)}>
      <Animated.View style={[styles.toggleTrack, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

// ──────────────────────────────────────────────────────
// Sub card
// ──────────────────────────────────────────────────────
export function SubCard({ sub, billing, onPress }) {
  const isUrgent = billing.urgency === 'urgent' || billing.urgency === 'today';
  const isTrial = billing.isTrial;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const badge = isTrial
    ? { bg: Colors.amberLight, color: '#92400E', text: `Essai ${billing.trialDaysLeft}j` }
    : isUrgent
      ? { bg: Colors.redLight, color: Colors.red, text: billing.label }
      : { bg: Colors.greenLight, color: Colors.green, text: billing.label };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.subCard,
          isUrgent && { borderColor: Colors.red, backgroundColor: Colors.redLight },
          isTrial && { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
        ]}
      >
        <View style={[styles.subIcon, { backgroundColor: sub.color}]}>
          <Text style={{ fontSize: 22 }}>{sub.icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.subName}>{sub.name}</Text>
          <Text style={styles.subCycle}>{cycleFr(sub.cycle)} · {sub.category}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.subPrice}>
            {isTrial ? '0,00 €' : `${sub.amount.toFixed(2)} €`}
          </Text>
          <View style={[styles.subBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.subBadgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function cycleFr(c) {
  return { weekly: 'Hebdo', monthly: 'Mensuel', quarterly: 'Trimestriel', annual: 'Annuel' }[c] || c;
}

// ──────────────────────────────────────────────────────
// Helper components
// ──────────────────────────────────────────────────────
export function SecondaryButton({ onPress, label = '←', style }) {
  return (
    <Pressable onPress={onPress} style={[styles.secondaryBtn, style]}>
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function PeriodPill({ label, onPress }) {
  return (
    <Pressable style={styles.periodPill} onPress={onPress}>
      <Text style={styles.periodPillText}>{label}</Text>
      <Text style={{ color: Colors.purple, marginLeft: 4 }}>▾</Text>
    </Pressable>
  );
}

export function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <View style={styles.alertWrap}>
      <Text style={styles.alertLabel}>⚠️  Prélèvements à venir</Text>
      {alerts.map((item, i) => (
        <View key={i} style={styles.alertItem}>
          <View>
            <Text style={styles.alertName}>{item.sub.icon}  {item.sub.name}</Text>
            <Text style={styles.alertDays}>{item.billing.label}</Text>
          </View>
          <Text style={styles.alertAmt}>{item.billing.nextChargeAmount.toFixed(2)} €</Text>
        </View>
      ))}
    </View>
  );
}

// ──────────────────────────────────────────────────────
// Trial Banner (Subscription Ticket)
// ──────────────────────────────────────────────────────
export function TrialBanner({ daysLeft, onSubscribe, onClose }) {
  return (
    <View style={styles.trialContainer}>
      <View style={styles.trialGlassCard}>
        <View style={styles.trialSideBar} />
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.trialOverline}>PRO TRIAL</Text>
          <Text style={styles.trialMainText}>
            Votre essai gratuit expire dans <Text style={{ fontWeight: '700' }}>{daysLeft} jours</Text>.
          </Text>
          <Pressable 
            style={styles.trialCTA} 
            onPress={() => {
              PremiumHaptics.success();
              onSubscribe && onSubscribe();
            }}
          >
            <Text style={styles.trialCTAText}>S'abonner maintenant</Text>
          </Pressable>
        </View>
        <Pressable 
          style={styles.trialHideBtn} 
          onPress={() => {
            PremiumHaptics.click();
            onClose && onClose();
          }}
        >
          <View style={styles.trialCheckCircle}>
            <Text style={styles.trialCheckText}>✓</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export function SettingsRow({ title, value, onPress, children, danger }) {
  return (
    <Pressable onPress={onPress} style={styles.settingsRow}>
      <Text style={[styles.settingsTitle, danger && { color: Colors.red }]}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text style={styles.settingsValue}>{value}</Text> : null}
        {children}
        {onPress && !children ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pbTrack: { height: 6, backgroundColor: Colors.border, borderRadius: 100, overflow: 'hidden' },
  pbFill: { height: '100%', borderRadius: 100 },
  catUnifiedCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 8,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  catTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catRowSimple: {
    marginBottom: 0, borderWidth: 0, borderRadius: 0,
    backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0,
    paddingHorizontal: 0, paddingVertical: 14,
  },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 15, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  catSpent: { fontSize: 14, fontWeight: '700', color: Colors.text },
  catPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: Colors.bgSecondary },
  catPillText: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  sectionCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 18, paddingTop: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  sectionHdr: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 12,
  },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
  groupDays: { fontSize: 12, color: Colors.textTertiary, marginTop: 2, fontWeight: '500' },
  groupColLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  groupColVal: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 3 },
  primaryBtn: {
    backgroundColor: Colors.purple, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24,
    alignItems: 'center', justifyContent: 'center', flex: 1,
  },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    width: 48, height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 18, color: Colors.purple, fontWeight: '700' },
  toggleTrack: { width: 50, height: 30, borderRadius: 100, justifyContent: 'center', backgroundColor: Colors.border },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white, ...Shadow.card },
  alertWrap: { backgroundColor: Colors.purple, borderRadius: 16, padding: 16, marginBottom: 16 },
  alertLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  alertItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, marginBottom: 8,
  },
  alertName: { fontSize: 13, fontWeight: '700', color: Colors.white },
  alertDays: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  alertAmt: { fontSize: 18, fontWeight: '700', color: Colors.white },
  trialContainer: {
    marginBottom: 16,
    paddingHorizontal: 0,
  },
  trialGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.purpleXLight,
    borderRadius: 16,
    padding: 16,
    paddingRight: 20,
    borderWidth: 1.5,
    borderColor: Colors.purpleLight,
    overflow: 'hidden',
  },
  trialSideBar: {
    width: 5,
    height: '100%',
    backgroundColor: Colors.purple,
    borderRadius: 100,
    position: 'absolute',
    left: 0,
  },
  trialOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.purple,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  trialMainText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  trialCTA: {
    backgroundColor: Colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  trialCTAText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  trialHideBtn: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  trialCheckText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  periodPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 100,
  },
  periodPillText: { fontSize: 13, fontWeight: '700', color: Colors.purple },
  subCard: {
    flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16,
    backgroundColor: Colors.white, borderRadius: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  subIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subName: { fontSize: 15, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  subCycle: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  subPrice: { fontSize: 17, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  subBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 3 },
  subBadgeText: { fontSize: 11, fontWeight: '700' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, paddingHorizontal: 16, backgroundColor: Colors.white,
    borderRadius: 14, marginBottom: 6, borderWidth: 1.5, borderColor: Colors.border,
  },
  settingsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  settingsValue: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chevron: { fontSize: 20, color: Colors.textSecondary },
});
