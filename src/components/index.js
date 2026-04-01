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
  pbTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 100, overflow: 'hidden' },
  pbFill: { height: '100%', borderRadius: 100 },
  catUnifiedCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 16, marginBottom: 10,
    ...Shadow.medium,
  },
  catTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catRowSimple: {
    marginBottom: 0, borderWidth: 0, borderRadius: 0,
    backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0,
    paddingHorizontal: 0, paddingVertical: 14,
  },
  catIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 14, fontWeight: '400', color: Colors.text, letterSpacing: 0.1 },
  catSpent: { fontSize: 13, fontWeight: '500', color: Colors.text },
  catPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  catPillText: { fontSize: 10, fontWeight: '500', color: Colors.textSecondary },
  sectionCard: {
    backgroundColor: '#ffffffb2', borderRadius: 24, padding: 16, paddingTop: 18, marginBottom: 20,
    ...Shadow.medium,
  },
  sectionHdr: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F3', marginBottom: 6,
  },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: 1.5 },
  groupDays: { fontSize: 11, color: Colors.textSecondary, marginTop: 1, fontWeight: '400' },
  groupColLbl: { fontSize: 10, color: '#A1A1AA', fontWeight: '500', textTransform: 'uppercase' },
  groupColVal: { fontSize: 14, fontWeight: '500', color: Colors.text, marginTop: 1 },
  primaryBtn: {
    backgroundColor: Colors.purple, borderRadius: 100,
    paddingVertical: 16, paddingHorizontal: 32,
    alignItems: 'center', justifyContent: 'center', flex: 1,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    width: 52, height: 52, borderRadius: 100,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontSize: 18, color: Colors.purple, fontWeight: '700' },
  toggleTrack: { width: 48, height: 28, borderRadius: 100, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', ...Shadow.card },
  alertWrap: { backgroundColor: '#1A1050', borderRadius: 16, padding: 18, marginBottom: 12 },
  alertLabel: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  alertItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: 11, marginBottom: 6,
  },
  alertName: { fontSize: 13, fontWeight: '800', color: '#fff' },
  alertDays: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  alertAmt: { fontSize: 17, fontWeight: '900', color: '#fff' },
  trialContainer: {
    marginBottom: 24,
    paddingHorizontal: 2,
  },
  trialGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF', // Subtle Lavender tint for contrast
    borderRadius: 24,
    padding: 16,
    paddingRight: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
    ...Shadow.medium,
    overflow: 'hidden',
  },
  trialSideBar: {
    width: 4,
    height: '100%',
    backgroundColor: Colors.purple,
    borderRadius: 100,
    position: 'absolute',
    left: 12,
  },
  trialOverline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A1A1AA',
    letterSpacing: 2,
    marginBottom: 4,
  },
  trialMainText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '400',
    marginBottom: 12,
  },
  trialCTA: {
    backgroundColor: Colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  trialCTAText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  trialHideBtn: {
    paddingLeft: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trialCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.2,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialCheckText: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '300',
    marginTop: -1,
  },
  periodPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 100, ...Shadow.card,
  },
  periodPillText: { fontSize: 14, fontWeight: '700', color: Colors.purple },
  subCard: {
    flexDirection: 'row', alignItems: 'center', padding: 15, paddingHorizontal: 16,
    backgroundColor: Colors.white, borderRadius: 14, marginBottom: 8,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadow.card,
  },
  subIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subName: { fontSize: 15, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  subCycle: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  subPrice: { fontSize: 17, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  subBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100, marginTop: 3 },
  subBadgeText: { fontSize: 11, fontWeight: '800' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 15, paddingHorizontal: 16, backgroundColor: Colors.white,
    borderRadius: 14, marginBottom: 6, borderWidth: 1.5, borderColor: Colors.border,
  },
  settingsTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  settingsValue: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chevron: { fontSize: 20, color: Colors.textSecondary },
});
