// src/components/index.js
// Trimly-Minimal: Clean Professional components

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable,
} from 'react-native';
import {
  LightColors, Fonts, Radius, Shadow, Spacing, Metrics,
} from '../theme';
import { PremiumHaptics } from '../utils/haptics';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const addAlpha = (hex, opacity) => {
  if (!hex) return 'transparent';
  // Handle 3-digit hex
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const op = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${op}`;
};

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
  const { Colors } = useTheme();
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
    <View style={[{ height: 6, backgroundColor: Colors.border, borderRadius: Radius.pill, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height: '100%', borderRadius: Radius.pill }, { width, backgroundColor: color || Colors.accent }]} />
    </View>
  );
}

export function CategoryRow({ category, onPress, simple }) {
  const { state } = useApp();
  const { Colors } = useTheme();
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
      <Animated.View style={[{
        flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        minHeight: Metrics.minTouch + 8,
      }, simple && { paddingVertical: 12 }, { transform: [{ scale }] }]}>
        <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: addAlpha(color, 0.18) }}>
          <Text style={{ fontSize: 16, color: color }}>{icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ ...Fonts.primary, ...Fonts.bold, fontSize: 14, color: Colors.text }}>{name}</Text>
          <Text style={{ ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>Budget {budget}{state.currency}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[{ ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text }, isOver && { color: Colors.error }]}>
            {spent.toFixed(0)} {state.currency}
          </Text>
          <Text style={{ ...Fonts.primary, fontSize: 10, color: Colors.textMuted, marginTop: 2 }}>{left > 0 ? `Restant ${left.toFixed(0)}${state.currency}` : 'Depassement'}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function CategorySection({ label, daysLeft, budgeted, left, children }) {
  const { state } = useApp();
  const { Colors } = useTheme();
  return (
    <View style={{ marginBottom: Spacing.xl }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingBottom: Spacing.smd, borderBottomWidth: 1.5, borderBottomColor: Colors.text, marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...Fonts.primary, ...Fonts.black, fontSize: 17, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
          <Text style={{ ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 4 }}>{daysLeft} jours restants</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[{ ...Fonts.primary, ...Fonts.black, fontSize: 17, color: Colors.text }, left < 0 && { color: Colors.error }]}>
            {left.toFixed(0)} {state.currency}
          </Text>
          <Text style={{ ...Fonts.primary, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Restant</Text>
        </View>
      </View>
      <View style={{ paddingTop: 4 }}>
        {children}
      </View>
    </View>
  );
}

export function PrimaryButton({ onPress, label, style }) {
  const { Colors } = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[{
        backgroundColor: Colors.accent, borderRadius: Radius.md,
        paddingVertical: 16, paddingHorizontal: 24,
        alignItems: 'center', justifyContent: 'center', minHeight: 52,
      }, style, { transform: [{ scale }] }]}>
        <Text style={{ color: Colors.pureWhite, ...Fonts.primary, ...Fonts.bold, fontSize: 15 }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Toggle({ value, onChange }) {
  const { Colors } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 18] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.borderStrong, Colors.accent] });

  return (
    <Pressable onPress={() => onChange(!value)}>
      <Animated.View style={[{ width: 44, height: 24, borderRadius: 12, justifyContent: 'center' }, { backgroundColor: bgColor }]}>
        <Animated.View style={[{ width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.bg, ...Shadow.soft }, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export function SubCard({ sub, billing, onPress }) {
  const { state } = useApp();
  const { Colors } = useTheme();
  const isUrgent = billing.urgency === 'urgent' || billing.urgency === 'today';
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[{
        flexDirection: 'row', alignItems: 'center', padding: 16,
        backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: 10,
        borderWidth: 1.2, borderColor: Colors.border, minHeight: 76,
      }, isUrgent && { borderColor: Colors.error }, { transform: [{ scale }] }]}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: addAlpha(sub.color, 0.18) }}>
          <Text style={{ fontSize: 18, color: sub.color }}>{sub.icon}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text }}>{sub.name}</Text>
          <Text style={{ ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 3 }}>{sub.category} - {billing.label}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text }}>{sub.amount.toFixed(2)} {state.currency}</Text>
          <Text style={[{ ...Fonts.primary, fontSize: 9, ...Fonts.black, color: Colors.textMuted, marginTop: 4 }, isUrgent && { color: Colors.error }]}>{billing.urgency.toUpperCase()}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function SettingsRow({ title, value, onPress, children, danger, colors: colorsProp }) {
  const { Colors: themeColors } = useTheme();
  const Colors = colorsProp || themeColors;
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 4, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        backgroundColor: Colors.bg,
      }, { transform: [{ scale }] }]}>
        <Text style={[{ ...Fonts.primary, ...Fonts.medium, fontSize: 15, color: Colors.text }, danger && { color: Colors.error }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {value ? <Text style={{ ...Fonts.primary, fontSize: 13, color: Colors.textSecondary }}>{value}</Text> : null}
          {children}
          {onPress && !children ? <Text style={{ fontSize: 18, color: Colors.textMuted, marginLeft: 4 }}>›</Text> : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function SecondaryButton({ onPress, label = '←', style }) {
  const { Colors } = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[{
        width: 48, height: 48, borderRadius: 24,
        borderWidth: 1.5, borderColor: Colors.borderStrong,
        backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
      }, style, { transform: [{ scale }] }]}>
        <Text style={{ fontSize: 18, color: Colors.text, ...Fonts.bold }}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function PeriodPill({ label, onPress }) {
  const { Colors } = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Pressable
      style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accentMuted, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.pill, minHeight: Metrics.minTouch }}
      onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}
    >
      <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale }] }}>
        <Text style={{ ...Fonts.primary, ...Fonts.bold, fontSize: 13, color: Colors.accent }}>{label}</Text>
        <Text style={{ color: Colors.accent, marginLeft: 6, fontSize: 12 }}>▼</Text>
      </Animated.View>
    </Pressable>
  );
}

export function TrialBanner({ daysLeft, onSubscribe, onClose }) {
  const { Colors } = useTheme();
  const { scale, onPressIn, onPressOut } = usePressScale();
  const dayLabel = daysLeft > 1 ? 'jours' : 'jour';
  const urgencyCopy = daysLeft <= 3
    ? 'Votre essai se termine bientot. Passez a Pro pour garder toutes vos fonctionnalites.'
    : "Profitez pleinement de votre essai, puis passez a Pro sans interruption.";
  return (
    <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.borderStrong, padding: Spacing.md, marginBottom: Spacing.md, ...Shadow.medium }}>
      <View style={{ alignSelf: 'flex-start', backgroundColor: Colors.surfaceAlt, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 }}>
        <Text style={{ ...Fonts.primary, fontSize: 10, ...Fonts.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Essai gratuit</Text>
      </View>
      <Text style={{ ...Fonts.primary, ...Fonts.black, fontSize: 18, color: Colors.text, lineHeight: 23, marginBottom: 8 }}>Il vous reste {daysLeft} {dayLabel} d'essai gratuit</Text>
      <Text style={{ ...Fonts.primary, fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 14 }}>{urgencyCopy}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={() => { PremiumHaptics.success(); onSubscribe && onSubscribe(); }} onPressIn={onPressIn} onPressOut={onPressOut}>
          <Animated.View style={[{ backgroundColor: Colors.accent, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 9, minHeight: 36, justifyContent: 'center', alignItems: 'center' }, { transform: [{ scale }] }]}>
            <Text style={{ ...Fonts.primary, ...Fonts.bold, fontSize: 10, color: Colors.pureWhite, textTransform: 'uppercase', letterSpacing: 0.4 }}>Decouvrir Pro</Text>
          </Animated.View>
        </Pressable>
        <Pressable style={{ borderWidth: 1, borderColor: Colors.borderStrong, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 9, minHeight: 36, justifyContent: 'center', backgroundColor: Colors.surface }} onPress={() => { PremiumHaptics.click(); onClose && onClose(); }}>
          <Text style={{ ...Fonts.primary, ...Fonts.bold, fontSize: 10, color: Colors.textSecondary }}>Plus tard</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Static styles (non-color-dependent only)
const styles = StyleSheet.create({
  // kept for any future static layout needs
});

// Export WalletCard
export { default as WalletCard } from './WalletCard';

// Export Responsive components
export {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveMaxWidth,
  ResponsiveSpacer,
} from './ResponsiveContainer';
