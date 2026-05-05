import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Dimensions,
} from 'react-native';
import { Fonts, Layout, Radius, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const ONBOARDING_CAT_GROUPS = [
  {
    label: 'Maison & Alimentation',
    items: [
      { name: 'Loyer/Prêt', icon: '🏠' },
      { name: 'Courses', icon: '🛒' },
      { name: 'Restaurant', icon: '🍕' },
      { name: 'Factures', icon: '⚡' },
    ],
  },
  {
    label: 'Mobilité & Voyage',
    items: [
      { name: 'Transport', icon: '🚆' },
      { name: 'Carburant', icon: '⛽' },
      { name: 'Voyage', icon: '✈️' },
    ],
  },
  {
    label: 'Loisirs & Style de vie',
    items: [
      { name: 'Sorties', icon: '🎬' },
      { name: 'Abonnements', icon: '📱' },
      { name: 'Shopping', icon: '👕' },
      { name: 'Sport', icon: '💪' },
    ],
  },
  {
    label: 'Finance & Bien-être',
    items: [
      { name: 'Santé', icon: '🏥' },
      { name: 'Épargne', icon: '📈' },
      { name: 'Imprévus', icon: '🆘' },
      { name: 'Cadeaux', icon: '🎁' },
    ],
  },
];

// ── Sub-components moved outside to fix focus loss ──

const Progress = ({ step, Colors, styles }) => (
  <View style={styles.progressContainer}>
    {[0, 1, 2].map((i) => (
      <View 
        key={i} 
        style={[
          styles.progressDot, 
          step === i && { backgroundColor: Colors.accent, width: 20 }
        ]} 
      />
    ))}
  </View>
);

const StepCategories = ({ selectedCats, toggleCat, styles }) => (
  <View style={[styles.unifiedCard, { margin: 10 }]}>
    <Text style={[styles.h1, { ...Fonts.serif, marginBottom: 8 }]}>Votre style analytique</Text>
    <Text style={[styles.sub, { marginBottom: 24 }]}>Identifiez les flux qui structurent votre quotidien financier.</Text>
    
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {ONBOARDING_CAT_GROUPS.map(group => (
        <View key={group.label} style={{ marginBottom: 32 }}>
          <Text style={styles.groupLbl}>{group.label}</Text>
          <View style={styles.chipWrap}>
            {group.items.map(item => {
              const sel = selectedCats.includes(item.name);
              return (
                <Pressable
                  key={item.name}
                  onPress={() => toggleCat(item.name)}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  <Text style={[styles.chipText, sel && styles.chipTextSel]}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
);

const BudgetRow = ({ name, value, onValueChange, icon, Colors, styles }) => {
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleRowPress = () => {
    PremiumHaptics.selection();
    inputRef.current?.focus();
  };

  return (
    <Pressable onPress={handleRowPress} style={styles.budgetRow}>
      <View style={styles.budgetIcon}><Text style={{ fontSize: 18 }}>{icon || '💰'}</Text></View>
      <Text style={styles.budgetName}>{name}</Text>
      <View style={{ 
        borderBottomWidth: 2, 
        borderBottomColor: isFocused ? Colors.accent : Colors.borderStrong, 
        width: 80
      }}>
        <TextInput
          ref={inputRef}
          style={[styles.budgetInput, { ...Fonts.serif, textAlign: 'center', width: '100%' }]}
          value={value ? String(value) : ''}
          onChangeText={(v) => { PremiumHaptics.selection(); onValueChange(v); }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>
    </Pressable>
  );
};

const StepBudgets = ({ income, setIncome, currency, setCurrency, selectedCats, budgets, setBudgets, Colors, styles }) => {
  const [isIncomeFocused, setIsIncomeFocused] = useState(false);
  const totalAllocated = Object.values(budgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const incomeNum = parseFloat(income) || 0;
  const allocationPercent = incomeNum > 0 ? Math.min((totalAllocated / incomeNum) * 100, 100) : 0;

  return (
    <View style={[styles.unifiedCard, { margin: 10 }]}>
      <Text style={[styles.h1, { ...Fonts.serif, marginBottom: 8 }]}>Précision budgétaire</Text>
      <Text style={[styles.sub, { marginBottom: 12 }]}>Définissez vos plafonds pour une gestion sans surprise.</Text>
      
      {/* Allocation Insights (Transparent) */}
      <View style={{ marginBottom: 24, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ ...Fonts.sans, fontSize: 13, color: Colors.textSecondary }}>Allocation totale</Text>
          <Text style={{ ...Fonts.sans, fontSize: 13, ...Fonts.bold, color: Colors.text }}>{totalAllocated} {currency} / {incomeNum} {currency}</Text>
        </View>
        <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${allocationPercent}%`, backgroundColor: Colors.accent }} />
        </View>
      </View>

      <Text style={[styles.groupLbl, { marginBottom: 8 }]}>Revenu & Devise</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
        <View style={{ 
          flex: 2,
          borderBottomWidth: 2, 
          borderBottomColor: isIncomeFocused ? Colors.accent : Colors.borderStrong, 
          paddingBottom: 4
        }}>
          <TextInput
            style={[styles.input, { ...Fonts.serif, fontSize: 18, height: 44, paddingHorizontal: 0 }]}
            value={income}
            onChangeText={(v) => { PremiumHaptics.selection(); setIncome(v); }}
            onFocus={() => setIsIncomeFocused(true)}
            onBlur={() => setIsIncomeFocused(false)}
            keyboardType="numeric"
            placeholder={`Montant (${currency})`}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        
        <View style={{ flex: 1, flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
          {['MAD', '€', '$', '£'].map(c => (
            <Pressable 
              key={c} 
              onPress={() => { PremiumHaptics.selection(); setCurrency(c); }}
              style={[
                styles.currencyBtn, 
                currency === c && { backgroundColor: Colors.accent, borderColor: Colors.accent }
              ]}
            >
              <Text style={[styles.currencyBtnText, currency === c && { color: Colors.white }]}>{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={[styles.groupLbl, { marginTop: 12, marginBottom: 12 }]}>Détails par flux</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {selectedCats.map(name => {
          const item = ONBOARDING_CAT_GROUPS.flatMap(g => g.items).find(i => i.name === name);
          return (
            <BudgetRow 
              key={name}
              name={name}
              icon={item?.icon}
              value={budgets[name]}
              onValueChange={v => setBudgets(prev => ({ ...prev, [name]: v }))}
              Colors={Colors}
              styles={styles}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const StepNotifications = ({ notifLevel, setNotifLevel, Colors, styles }) => {
  const opts = [
    { level: 0, emoji: '🤫', title: "Le Concierge", desc: "Discret et efficace. Luna ne vous alerte que pour les flux critiques." },
    { level: 1, emoji: '🤠', title: "Le Coach", desc: "Un accompagnement quotidien positif pour garder le cap." },
    { level: 2, emoji: '😤', title: "La Rigueur", desc: "Zéro latence. Un suivi précis de chaque écart budgétaire." },
    { level: 3, emoji: '🤬', title: "L'Intransigeant", desc: "Luna devient votre garde-fou pour une discipline absolue." },
  ];

  return (
    <View style={[styles.unifiedCard, { margin: 10 }]}>
      <Text style={[styles.h1, { ...Fonts.serif, marginBottom: 8 }]}>Ton & Vigilance</Text>
      <Text style={[styles.sub, { marginBottom: 28 }]}>Personnalisez la voix de Luna pour vos rapports et alertes.</Text>
      
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ gap: 14 }}>
          {opts.map(opt => {
            const isSel = notifLevel === opt.level;
            return (
              <Pressable
                key={opt.level}
                onPress={() => { PremiumHaptics.selection(); setNotifLevel(opt.level); }}
                style={[
                  styles.notifOpt, 
                  isSel && { borderColor: Colors.accent, borderWidth: 2, backgroundColor: Colors.surface }
                ]}
              >
                <View style={[styles.notifEmoji, isSel && { backgroundColor: Colors.white }]}>
                  <Text style={{ fontSize: 24 }}>{opt.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifTitle, { ...Fonts.serif, fontSize: 15 }]}>{opt.title}</Text>
                  <Text style={styles.notifDesc}>{opt.desc}</Text>
                </View>
                {isSel && (
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: Colors.white, fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const StepWelcome = ({ Colors, styles }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
      <Text style={{ fontSize: 50 }}>🌱</Text>
    </View>
    <Text style={[styles.h1, { textAlign: 'center', fontSize: 32 }]}>Bienvenue chez Trimly</Text>
    <Text style={[styles.sub, { textAlign: 'center', maxWidth: '85%' }]}>
      Votre écosystème est prêt. Commencez à piloter vos finances avec sérénité.
    </Text>
  </View>
);

export default function OnboardingScreen({ navigation }) {
  const { 
    dispatch, 
    setIncome: setIncomeSync, 
    setNotifLevel: setNotifLevelSync, 
    setCurrency: setCurrencySync,
    completeOnboarding,
    addCategory, 
    state 
  } = useApp();
  const { Colors } = useTheme();

  const [step, setStep] = useState(0);
  const [selectedCats, setSelectedCats] = useState(['Loyer', 'Courses']);
  const [income, setIncome] = useState('2500');
  const [currency, setCurrency] = useState('MAD');
  const [budgets, setBudgets] = useState({ Loyer: '800', Courses: '400' });
  const [notifLevel, setNotifLevel] = useState(1);

  const toggleCat = (name) => {
    PremiumHaptics.selection();
    setSelectedCats(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const handleFinish = async () => {
    PremiumHaptics.nav();
    
    try {
      // 1. Persist Income, Currency & Notif Level to Cloud
      await setIncomeSync(parseFloat(income) || 0);
      await setCurrencySync(currency);
      await setNotifLevelSync(notifLevel);

      // 2. Persist Categories to Cloud
      const allCats = ONBOARDING_CAT_GROUPS.flatMap(g => g.items);
      const selectedItems = allCats.filter(c => selectedCats.includes(c.name));

      for (const item of selectedItems) {
        await addCategory({
          name: item.name,
          icon: item.icon,
          budget: parseFloat(budgets[item.name]) || 0,
          spent: 0,
          cycle: 'monthly',
          color: Colors.accent,
          active: true
        });
      }

      // 3. Mark Onboarding as complete in Cloud & Local
      await completeOnboarding();
    } catch (error) {
      console.error('Error during onboarding sync:', error);
      // Fallback: still finish but log error
      await completeOnboarding();
    }
  };

  const nextStep = () => {
    PremiumHaptics.nav();
    if (step < 3) setStep(step + 1);
    else handleFinish();
  };

  const prevStep = () => {
    PremiumHaptics.nav();
    if (step > 0) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepCategories selectedCats={selectedCats} toggleCat={toggleCat} styles={styles} />;
      case 1: return <StepBudgets income={income} setIncome={setIncome} currency={currency} setCurrency={setCurrency} selectedCats={selectedCats} budgets={budgets} setBudgets={setBudgets} Colors={Colors} styles={styles} />;
      case 2: return <StepNotifications notifLevel={notifLevel} setNotifLevel={setNotifLevel} Colors={Colors} styles={styles} />;
      case 3: return <StepWelcome Colors={Colors} styles={styles} />;
      default: return null;
    }
  };

  const styles = makeStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={prevStep} style={styles.navBtn}>
          {step > 0 ? <Text style={styles.navText}>←</Text> : <View style={{ width: 24 }} />}
        </Pressable>
        <Progress step={step} Colors={Colors} styles={styles} />
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        {renderStep()}
      </View>

      <View style={styles.footer}>
        <Pressable 
          onPress={nextStep} 
          style={[styles.nextBtn, { backgroundColor: Colors.accent }]}
        >
          <Text style={styles.nextText}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(Colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 28 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    height: 60, marginTop: 20
  },
  navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 24, color: Colors.textSecondary },
  progressContainer: { flexDirection: 'row', gap: 6 },
  progressDot: { height: 3, borderRadius: 1.5, backgroundColor: Colors.border, width: 8 },
  content: { flex: 1 },
  footer: { 
    height: 100, alignItems: 'center', justifyContent: 'center'
  },
  nextBtn: { 
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', 
    justifyContent: 'center', backgroundColor: Colors.accent,
    ...Shadow.medium
  },
  nextText: { color: Colors.white, fontSize: 28, fontWeight: '300' },
  
  unifiedCard: {
    flex: 1, 
    paddingHorizontal: 0,
    paddingVertical: 10,
    backgroundColor: 'transparent', 
    borderColor: 'transparent',
    borderWidth: 0,
    marginBottom: 20
  },
  
  h1: { fontSize: 28, color: Colors.text, marginBottom: 12, letterSpacing: -0.5, ...Fonts.serif, marginTop: 10 },
  sub: { ...Fonts.sans, fontSize: 15, color: Colors.textSecondary, lineHeight: 22, letterSpacing: -0.1, marginBottom: 28 },

  // Step 0
  groupLbl: { ...Fonts.sans, fontSize: 10, ...Fonts.black, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, 
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, 
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.borderStrong, minHeight: 44,
  },
  chipSel: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipText: { ...Fonts.sans, fontSize: 13, ...Fonts.semiBold, color: Colors.text },
  chipTextSel: { color: Colors.white },

  // Step 1
  input: { 
    ...Fonts.sans, fontSize: 16, color: Colors.text, paddingVertical: 12,
  },
  budgetRow: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 64,
  },
  budgetIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  budgetName: { flex: 1, marginLeft: 14, ...Fonts.sans, fontSize: 14, ...Fonts.bold, color: Colors.text },
  budgetInput: { ...Fonts.serif, fontSize: 18, color: Colors.accent, width: 68, textAlign: 'right' },

  // Step 2
  notifOpt: { 
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, 
    borderRadius: 24, backgroundColor: 'transparent', minHeight: 80,
    borderWidth: 1, borderColor: Colors.borderStrong
  },
  notifEmoji: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  notifTitle: { ...Fonts.sans, fontSize: 14, ...Fonts.black, color: Colors.text },
  notifDesc: { ...Fonts.sans, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  
  currencyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  currencyBtnText: {
    ...Fonts.sans,
    fontSize: 12,
    ...Fonts.bold,
    color: Colors.textSecondary
  }
}); }
