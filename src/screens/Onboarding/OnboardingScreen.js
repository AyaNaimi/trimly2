// src/screens/Onboarding/OnboardingScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput,
  StyleSheet, SafeAreaView, Animated, Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Radius, Spacing } from '../../theme';
import { ONBOARDING_CAT_GROUPS, CATEGORY_COLORS, DEFAULT_CATEGORIES } from '../../data/initialData';
import { PrimaryButton, SecondaryButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { requestNotificationPermissions } from '../../utils/notifications';

const { width: W } = Dimensions.get('window');
const TOTAL_STEPS = 5;

export default function OnboardingScreen() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [selectedCats, setSelectedCats] = useState(['Courses', 'Restaurants', 'Transport']);
  const [budgets, setBudgets] = useState({});
  const [income, setIncome] = useState('');
  const [notifLevel, setNotifLevel] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current;

  const steps = ['Catégories', 'Budgets', 'Notifications', 'Essai'];

  function goNext() {
    Haptics.selectionAsync();
    Animated.timing(slideX, { toValue: -W, duration: 250, useNativeDriver: true }).start(() => {
      slideX.setValue(W);
      setStep(s => s + 1);
      Animated.timing(slideX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    });
  }

  function goBack() {
    Haptics.selectionAsync();
    Animated.timing(slideX, { toValue: W, duration: 250, useNativeDriver: true }).start(() => {
      slideX.setValue(-W);
      setStep(s => s - 1);
      Animated.timing(slideX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    });
  }

  function toggleCat(name) {
    Haptics.selectionAsync();
    setSelectedCats(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  function suggestBudgets() {
    const inc = parseFloat(income) || 2500;
    const ratios = {
      Loyer: 0.30, Courses: 0.12, Restaurants: 0.08, Transport: 0.05,
      Santé: 0.03, Loisirs: 0.05, Shopping: 0.07, Café: 0.02,
      Sport: 0.03, Épargne: 0.15, Électricité: 0.04, Forfait: 0.02,
    };
    const suggested = {};
    selectedCats.forEach(name => {
      const key = Object.keys(ratios).find(k => name.includes(k));
      suggested[name] = key ? Math.round(inc * ratios[key]) : 50;
    });
    setBudgets(suggested);
  }

  async function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await requestNotificationPermissions();

    // Build categories from selected
    const cats = selectedCats.map((name, i) => {
      const existing = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === name.toLowerCase());
      return {
        id: `cat_${Date.now()}_${i}`,
        name,
        icon: existing?.icon || '💰',
        color: existing?.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        budget: parseFloat(budgets[name]) || 0,
        spent: 0,
        cycle: existing?.cycle || 'monthly',
      };
    });

    dispatch({ type: 'SET_CATEGORIES', payload: cats });
    dispatch({ type: 'SET_NOTIF_LEVEL', payload: notifLevel });
    if (income) dispatch({ type: 'SET_INCOME', payload: parseFloat(income) });
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  }

  // ── Step 0: Categories (like Luna) ──
  const StepCategories = () => (
    <View style={{ flex: 1 }}>
      <Text style={styles.h1}>Créons des catégories</Text>
      <Text style={styles.sub}>Suggestions pour vous (modifiables plus tard)</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 16 }}>
        {ONBOARDING_CAT_GROUPS.map(group => (
          <View key={group.label} style={{ marginBottom: 20 }}>
            <Text style={[styles.groupLbl, { color: group.color }]}>{group.label}</Text>
            <View style={styles.chipWrap}>
              {group.items.map(item => {
                const sel = selectedCats.includes(item.name);
                return (
                  <Pressable
                    key={item.name}
                    onPress={() => toggleCat(item.name)}
                    style={[styles.chip, sel && { backgroundColor: Colors.pink, borderColor: Colors.pink }]}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    <Text style={[styles.chipText, sel && { color: '#fff' }]}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );

  // ── Step 1: Budget allocation (like Luna) ──
  const StepBudgets = () => (
    <View style={{ flex: 1 }}>
      <Text style={styles.h1}>Allouez un budget</Text>
      <View style={styles.suggestCard}>
        <Text style={{ fontSize: 13, color: Colors.textSecondary }}>
          🤔 Pas sûr des montants ? Entrez votre revenu et on vous suggère.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            placeholder="Revenu mensuel (€)"
            placeholderTextColor={Colors.textSecondary}
          />
          <Pressable style={styles.suggestBtn} onPress={suggestBudgets}>
            <Text style={{ color: Colors.purple, fontWeight: '700', fontSize: 13 }}>Suggérer →</Text>
          </Pressable>
        </View>
      </View>

      {/* Currency */}
      <View style={styles.currencyRow}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>Devise sélectionnée</Text>
        <Text style={{ fontSize: 15, color: Colors.textSecondary, fontWeight: '600' }}>EUR €</Text>
      </View>

      {/* Weekly cats */}
      {selectedCats.filter(n => {
        const c = ONBOARDING_CAT_GROUPS.flatMap(g => g.items).find(i => i.name === n);
        return c?.cycle === 'weekly';
      }).length > 0 && (
        <View style={{ marginBottom: 8 }}>
          <View style={styles.budgetGroupHdr}>
            <Text style={{ fontSize: 15, fontWeight: '800' }}>Catégories hebdo</Text>
            <Text style={{ fontSize: 12, color: Colors.textSecondary }}>
              Total {selectedCats.filter(n => {
                const c = ONBOARDING_CAT_GROUPS.flatMap(g => g.items).find(i => i.name === n);
                return c?.cycle === 'weekly';
              }).reduce((a, n) => a + (parseFloat(budgets[n]) || 0), 0).toFixed(2)} € / sem
            </Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {selectedCats.map(name => {
          const item = ONBOARDING_CAT_GROUPS.flatMap(g => g.items).find(i => i.name === name);
          return (
            <View key={name} style={styles.budgetRow}>
              <Text style={{ fontSize: 18 }}>{item?.icon || '💰'}</Text>
              <Text style={{ flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600' }}>{name}</Text>
              <TextInput
                style={styles.budgetInput}
                value={budgets[name] ? String(budgets[name]) : ''}
                onChangeText={v => setBudgets(prev => ({ ...prev, [name]: v }))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          );
        })}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );

  // ── Step 2: Notifications (exactly like Luna) ──
  const StepNotifications = () => {
    const opts = [
      { level: 0, emoji: '🤫', title: "Silencieux", desc: "Désactiver tous les rappels" },
      { level: 1, emoji: '🤠', title: "Doux", desc: "1-2 notifications par jour" },
      { level: 2, emoji: '😤', title: "Agressif", desc: "4-5 notifications par jour" },
      { level: 3, emoji: '🤬', title: "Implacable", desc: "Vous allez nous haïr (10+)" },
    ];

    return (
      <View style={{ flex: 1 }}>
        <Text style={[styles.h1, { textAlign: 'center' }]}>Besoin de rappels ?</Text>
        <Text style={[styles.sub, { textAlign: 'center' }]}>
          Rappels de dépenses + alertes prélèvements
        </Text>
        <View style={{ gap: 10, marginTop: 20 }}>
          {opts.map(opt => (
            <Pressable
              key={opt.level}
              onPress={() => { Haptics.selectionAsync(); setNotifLevel(opt.level); }}
              style={[styles.notifOpt, notifLevel === opt.level && styles.notifOptSel]}
            >
              <View style={[styles.notifEmoji, notifLevel === opt.level && { backgroundColor: Colors.purpleLight }]}>
                <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
              </View>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>{opt.title}</Text>
                <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>{opt.desc}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Preview notification */}
        <View style={styles.notifPreview}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10 }}>Aperçu</Text>
          <View style={styles.notifPreviewCard}>
            <View style={[styles.notifPreviewIcon]}>
              <Text>🐾</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, fontWeight: '800' }}>Trimly</Text>
                <Text style={{ fontSize: 12, color: Colors.textSecondary }}>il y a 2j</Text>
              </View>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
                ⚠️ Netflix – 15,99€ prélevé dans 2 jours
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ── Step 3: Trial info (like Luna) ──
  const StepTrial = () => (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>🐾</Text>
      <Text style={styles.h1}>Votre essai gratuit</Text>
      <Text style={styles.sub}>Essayez Trimly 14 jours, sans engagement ✌️</Text>

      <View style={{ gap: 20, marginTop: 32 }}>
        {[
          { emoji: '💳', title: 'Aucune carte nécessaire', desc: "L'essai est activé automatiquement, rien à faire" },
          { emoji: '🙋', title: 'Besoin de plus de temps ?', desc: "Contactez-nous via les réglages, on prolonge volontiers" },
          { emoji: '🎯', title: 'Dans 14 jours', desc: "4,99€/mois · 49,99€/an · 149,99€ une fois – ou continuez à l'utiliser gratuitement avec des limites" },
        ].map(item => (
          <View key={item.title} style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
            <View style={styles.trialItemIcon}>
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.purple }}>{item.title}</Text>
              <Text style={{ fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginTop: 3 }}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return <StepCategories />;
      case 1: return <StepBudgets />;
      case 2: return <StepNotifications />;
      case 3: return <StepTrial />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressWrap}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < step && styles.dotDone,
              i === step && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { transform: [{ translateX: slideX }] }]}>
        {renderStep()}
      </Animated.View>

      {/* Navigation */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <SecondaryButton onPress={goBack} />
        ) : (
          <View style={{ width: 52 }} />
        )}
        {step < 3 ? (
          <PrimaryButton onPress={goNext} label="Continuer" />
        ) : (
          <PrimaryButton onPress={finish} label="Commencer" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 },
  progressWrap: { flexDirection: 'row', gap: 6, marginTop: 12, marginBottom: 28 },
  dot: { height: 5, flex: 1, borderRadius: 100, backgroundColor: Colors.border },
  dotDone: { backgroundColor: Colors.purple },
  dotActive: { backgroundColor: Colors.purple, flex: 2 },
  content: { flex: 1 },
  h1: { fontSize: 26, fontWeight: '800', color: Colors.text, letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },

  // Categories
  groupLbl: { fontSize: 14, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: '#fff',
  },
  chipText: { fontSize: 14, fontWeight: '600', color: Colors.text },

  // Budgets
  suggestCard: {
    backgroundColor: Colors.bg, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    fontSize: 15, fontWeight: '600', borderWidth: 1.5, borderColor: Colors.border, color: Colors.text,
  },
  suggestBtn: {
    backgroundColor: Colors.purpleLight, borderRadius: 12,
    paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center',
  },
  currencyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 12, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  budgetGroupHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  budgetRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg, borderRadius: 12, padding: 12, marginBottom: 8,
  },
  budgetInput: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 15, fontWeight: '700', borderWidth: 1.5, borderColor: Colors.border,
    width: 80, textAlign: 'right', color: Colors.text,
  },

  // Notifications
  notifOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderRadius: 16, borderWidth: 2, borderColor: Colors.border, backgroundColor: '#fff',
  },
  notifOptSel: { borderColor: Colors.purple, backgroundColor: Colors.purpleXLight },
  notifEmoji: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  notifPreview: { marginTop: 20 },
  notifPreviewCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  notifPreviewIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.purpleLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // Trial
  trialItemIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.purpleLight, alignItems: 'center', justifyContent: 'center',
  },

  // Nav
  navRow: { flexDirection: 'row', gap: 12, paddingBottom: 12, paddingTop: 16 },
});
