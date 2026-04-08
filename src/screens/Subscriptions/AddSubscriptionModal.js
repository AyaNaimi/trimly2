import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Modal, Pressable, TextInput, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { QUICK_SUBSCRIPTIONS, SUB_CATEGORIES } from '../../data/initialData';
import { formatDateFull, todayISO, isLeapDaySubscription } from '../../utils/dateUtils';
import DatePickerModal from '../../components/DatePickerModal';
import { useApp } from '../../context/AppContext';

export default function AddSubscriptionModal({ visible, onClose, onSave }) {
  const { state } = useApp();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState(Colors.accent);
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly');
  const [startDate, setStartDate] = useState(todayISO());
  const [trialDays, setTrialDays] = useState('0');
  const [category, setCategory] = useState(SUB_CATEGORIES[0]);
  const [leap_day_start, setLeapDayStart] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: showCategorySearch ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [searchAnim, showCategorySearch]);

  useEffect(() => {
    if (!showCategorySearch) return undefined;
    const timeoutId = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 240);
    return () => clearTimeout(timeoutId);
  }, [showCategorySearch]);

  useEffect(() => {
    if (!visible) return;
    setShowCategorySearch(false);
    setShowAllCategories(false);
    setCategoryQuery('');
  }, [visible]);

  function prefill(qs) {
    PremiumHaptics.selection();
    setName(qs.name);
    setIcon(qs.icon);
    setColor(qs.color || Colors.accent);
    setAmount(String(qs.amount));
    setCycle(qs.cycle);
    setCategory(qs.category);
    setTrialDays('0');
  }

  function save() {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) {
      PremiumHaptics.error();
      return;
    }
    PremiumHaptics.success();
    const isLeap = isLeapDaySubscription(startDate);
    onSave({
      name: name.trim(),
      icon,
      color,
      amount: amt,
      cycle,
      startDate,
      trialDays: parseInt(trialDays, 10) || 0,
      category,
      leap_day_start,
    });
    setName('');
    setAmount('');
    setTrialDays('0');
    setStartDate(todayISO());
    setCategoryQuery('');
  }

  const cycles = [
    { key: 'weekly', label: 'Hebdo' },
    { key: 'monthly', label: 'Mensuel' },
    { key: 'quarterly', label: 'Trimestriel' },
    { key: 'annual', label: 'Annuel' },
  ];

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    return SUB_CATEGORIES
      .filter(item => !query || item.toLowerCase().includes(query))
      .sort((a, b) => {
        if (a === category) return -1;
        if (b === category) return 1;
        return a.localeCompare(b);
      });
  }, [category, categoryQuery]);
  const visibleCategories = categoryQuery ? filteredCategories : (
    showAllCategories ? filteredCategories : filteredCategories.slice(0, 8)
  );
  const canExpandCategories = !categoryQuery && filteredCategories.length > 8;
  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 170],
  });
  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const searchTranslateX = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  function toggleCategorySearch() {
    PremiumHaptics.selection();
    if (showCategorySearch) {
      setCategoryQuery('');
    }
    setShowCategorySearch(prev => !prev);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => { PremiumHaptics.selection(); onClose(); }} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Abonnement</Text>
            <Pressable onPress={save} style={styles.saveBtn}>
              <Text style={styles.saveTxt}>Ajouter</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={styles.sectionLabel}>Favoris</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
              {QUICK_SUBSCRIPTIONS.slice(0, 10).map(qs => (
                <Pressable
                  key={qs.name}
                  onPress={() => prefill(qs)}
                  style={[styles.quickChip, name === qs.name && styles.quickChipActive]}
                >
                  <Text>{qs.icon}</Text>
                  <Text style={[styles.quickTxt, name === qs.name && styles.quickTxtActive]}>{qs.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom de l'offre</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex. Netflix, Spotify..."
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tarif mensuel</Text>
              <View style={styles.amountWrap}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                />
                <Text style={styles.currency}>{state.currency}</Text>
              </View>
            </View>

            <Text style={styles.label}>Frequence</Text>
            <View style={styles.cycleRow}>
              {cycles.map(c => (
                <Pressable
                  key={c.key}
                  onPress={() => { PremiumHaptics.selection(); setCycle(c.key); }}
                  style={[styles.cycleBtn, cycle === c.key && styles.cycleBtnActive]}
                >
                  <Text style={[styles.cycleTxt, cycle === c.key && styles.cycleTxtActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date de debut</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => {
                  PremiumHaptics.selection();
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateValue}>{formatDateFull(startDate)}</Text>
                <Text style={styles.dateIcon}>🗓</Text>
              </Pressable>
            </View>

            {isLeapDaySubscription(startDate) && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTxt}>
                  Commence le 29 fev. Les annees non bissextiles, le prelevement sera le 28 fevrier.
                </Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Essai gratuit (jours)</Text>
              <TextInput
                style={styles.input}
                value={trialDays}
                onChangeText={setTrialDays}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.categoryHeader}>
                <Text style={styles.label}>Categorie</Text>
                <View style={styles.categorySearchRow}>
                  <Animated.View
                    style={[
                      styles.searchInputWrap,
                      {
                        width: searchWidth,
                        opacity: searchOpacity,
                        transform: [{ translateX: searchTranslateX }],
                      },
                    ]}
                  >
                    <TextInput
                      ref={searchInputRef}
                      style={styles.searchInput}
                      value={categoryQuery}
                      onChangeText={setCategoryQuery}
                      placeholder="Rechercher"
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </Animated.View>
                  <Pressable onPress={toggleCategorySearch} style={styles.searchIconButton}>
                    <Text style={styles.searchIcon}>⌕</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.categoryGrid}>
                {visibleCategories.map(item => {
                  const active = item === category;
                  return (
                    <Pressable
                      key={item}
                      onPress={() => { PremiumHaptics.selection(); setCategory(item); }}
                      style={[styles.categoryCard, active && styles.categoryCardActive]}
                    >
                      {active ? (
                        <View style={styles.categoryCheck}>
                          <Text style={styles.categoryCheckText}>✓</Text>
                        </View>
                      ) : null}
                      <Text style={[styles.categoryCardText, active && styles.categoryCardTextActive]} numberOfLines={2}>{item}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {canExpandCategories ? (
                <Pressable
                  onPress={() => { PremiumHaptics.selection(); setShowAllCategories(prev => !prev); }}
                  style={styles.moreDotsButton}
                >
                  <Text style={styles.moreDotsText}>...</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <DatePickerModal
        visible={showDatePicker}
        value={startDate}
        onChange={setStartDate}
        onClose={() => setShowDatePicker(false)}
        title="Date de debut"
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white,
  },
  title: { ...Fonts.serif, fontSize: 18, color: Colors.text },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 18, color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.text, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.md },
  saveTxt: { ...Fonts.sans, fontSize: 13, ...Fonts.bold, color: Colors.white },

  scroll: { padding: Spacing.xl },
  sectionLabel: {
    ...Fonts.sans, fontSize: 11, ...Fonts.bold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  quickScroll: { marginBottom: 24 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: Radius.pill, backgroundColor: Colors.white,
    marginRight: 8, borderWidth: 1, borderColor: Colors.border,
  },
  quickChipActive: { backgroundColor: Colors.surface, borderColor: Colors.text },
  quickTxt: { ...Fonts.sans, fontSize: 13, ...Fonts.semiBold, color: Colors.text },
  quickTxtActive: { color: Colors.text },

  fieldGroup: { marginBottom: 20 },
  label: { ...Fonts.sans, fontSize: 13, ...Fonts.bold, color: Colors.text, marginBottom: 8 },
  input: {
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14,
    ...Fonts.sans, fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  amountWrap: { flexDirection: 'row', alignItems: 'center' },
  amountInput: { flex: 1, ...Fonts.semiBold },
  currency: { marginLeft: 12, ...Fonts.serif, fontSize: 20, color: Colors.textSecondary },

  cycleRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  cycleBtn: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.white,
  },
  cycleBtnActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  cycleTxt: { ...Fonts.sans, fontSize: 12, ...Fonts.semiBold, color: Colors.textSecondary },
  cycleTxtActive: { color: Colors.white },

  infoBox: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, marginBottom: 20 },
  infoBoxTxt: { ...Fonts.sans, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },

  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categorySearchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInputWrap: { overflow: 'hidden', marginRight: 8 },
  searchIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: { ...Fonts.sans, fontSize: 16, ...Fonts.bold, color: Colors.text },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...Fonts.sans,
    fontSize: 13,
    color: Colors.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '23%',
    paddingHorizontal: 6,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: 'transparent',
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  categoryCardActive: {
    backgroundColor: 'transparent',
  },
  categoryCheck: {
    position: 'absolute',
    top: 2,
    right: 3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCheckText: { ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.white },
  categoryCardText: {
    ...Fonts.sans,
    fontSize: 10,
    ...Fonts.semiBold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryCardTextActive: {
    color: Colors.text,
    ...Fonts.bold,
  },
  moreDotsButton: {
    alignSelf: 'center',
    minWidth: 56,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.white,
    marginTop: 2,
  },
  moreDotsText: {
    ...Fonts.sans,
    fontSize: 18,
    ...Fonts.bold,
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateValue: { ...Fonts.sans, fontSize: 15, ...Fonts.semiBold, color: Colors.text },
  dateIcon: { fontSize: 16, color: Colors.textSecondary },
});
