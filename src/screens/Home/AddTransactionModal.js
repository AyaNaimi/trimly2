import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, Modal, Pressable, TextInput, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Fonts, Radius, Spacing, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { formatDateFull, todayISO } from '../../utils/dateUtils';
import DatePickerModal from '../../components/DatePickerModal';

const addAlpha = (hex, opacity) => {
  if (!hex) return 'transparent';
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const op = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${op}`;
};

import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function AddTransactionModal({
  visible,
  onClose,
  categories,
  onSave,
  initialCategoryId: initial_category_id = '',
}) {
  const { Colors } = useTheme();
  const { state } = useApp();
  const { t } = useLanguage();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category_id, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  const [categoryQuery, setCategoryQuery] = useState('');
  const [showCategorySearch, setShowCategorySearch] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    if (initial_category_id && categories.find(c => c.id === initial_category_id)) {
      setCategoryId(initial_category_id);
      return;
    }
    if (!categories.find(c => c.id === category_id)) {
      setCategoryId(categories[0]?.id || '');
    }
  }, [visible, categories, category_id, initial_category_id]);

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

  const sortedCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    return [...categories]
      .filter(cat => {
        if (!query) return true;
        return (
          cat.name.toLowerCase().includes(query)
          || String(cat.icon || '').includes(query)
          || String(cat.cycle || '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.id === category_id) return -1;
        if (b.id === category_id) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [categories, category_id, categoryQuery]);

  const selectedCategory = categories.find(c => c.id === category_id) || sortedCategories[0];
  const visibleCategories = categoryQuery ? sortedCategories : (
    showAllCategories ? sortedCategories : sortedCategories.slice(0, 8)
  );
  const canExpandCategories = !categoryQuery && sortedCategories.length > 8;
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

  function selectCategory(id) {
    PremiumHaptics.selection();
    setCategoryId(id);
  }

  function toggleCategorySearch() {
    PremiumHaptics.selection();
    if (showCategorySearch) {
      setCategoryQuery('');
    }
    setShowCategorySearch(prev => !prev);
  }

  function save() {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!amt || amt <= 0 || !selectedCategory) {
      PremiumHaptics.error();
      return;
    }

    PremiumHaptics.success();
    onSave({
      type,
      amount: amt,
      category_id: selectedCategory.id,
      categoryName: selectedCategory.name || '',
      icon: selectedCategory.icon || '💳',
      color: selectedCategory.color || Colors.accent,
      note: note || selectedCategory.name || '',
      date,
    });
    setAmount('');
    setNote('');
    setDate(todayISO());
    setCategoryQuery('');
  }

  const styles = makeStyles(Colors);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => { PremiumHaptics.selection(); onClose(); }} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t('transactions.addTransaction')}</Text>
            <Pressable onPress={save} style={styles.saveBtnBox}>
              <Text style={styles.saveTxt}>{t('common.save')}</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.typeRow}>
              {['expense', 'income'].map(txType => (
                <Pressable
                  key={txType}
                  onPress={() => { PremiumHaptics.selection(); setType(txType); }}
                  style={[styles.typeBtn, type === txType && styles.typeBtnActive]}
                >
                  <Text style={[styles.typeTxt, type === txType && styles.typeTxtActive]}>
                    {txType === 'expense' ? t('transactions.expense') : t('transactions.income')}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('transactions.amount')}</Text>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                borderBottomWidth: 2, 
                borderBottomColor: isAmountFocused ? Colors.accent : Colors.borderStrong,
                paddingBottom: 4,
                marginBottom: 8
              }}>
                <TextInput
                  style={[styles.amountInput, { ...Fonts.serif, fontSize: 24, height: 52, flex: 1 }]}
                  value={amount}
                  onChangeText={(v) => { PremiumHaptics.selection(); setAmount(v); }}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textSecondary}
                  autoFocus
                />
                <Text style={{ ...Fonts.serif, fontSize: 18, color: Colors.textSecondary, marginLeft: 10 }}>{state.currency || '€'}</Text>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.categoryHeader}>
                <Text style={styles.label}>{t('transactions.category')}</Text>
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
                      placeholder={t('transactions.searchCategories')}
                      placeholderTextColor={Colors.textSecondary}
                    />
                  </Animated.View>
                  <Pressable onPress={toggleCategorySearch} style={styles.searchIconButton}>
                    <Text style={styles.searchIcon}>⌕</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.categoryGrid}>
                {visibleCategories.map(cat => {
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => selectCategory(cat.id)}
                      style={[styles.categoryCard, category_id === cat.id && styles.categoryCardActive]}
                    >
                      {category_id === cat.id ? (
                        <View style={styles.categoryCheck}>
                          <Text style={styles.categoryCheckText}>✓</Text>
                        </View>
                      ) : null}
                      <View style={[styles.categoryIcon, { backgroundColor: addAlpha(cat.color || Colors.accent, 0.12) }]}>
                        <Text style={{ fontSize: 18 }}>{cat.icon}</Text>
                      </View>
                      <Text style={[styles.categoryName, category_id === cat.id && styles.categoryNameActive]} numberOfLines={1}>{cat.name}</Text>
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

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('transactions.note')}</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder={t('modals.addTransaction.notePlaceholder')}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('transactions.date')}</Text>
              <Pressable
                style={styles.dateButton}
                onPress={() => {
                  PremiumHaptics.selection();
                  setShowDatePicker(true);
                }}
              >
                <Text style={styles.dateValue}>{formatDateFull(date)}</Text>
                <Text style={styles.dateIcon}>🗓</Text>
              </Pressable>
            </View>

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <DatePickerModal
        visible={showDatePicker}
        value={date}
        onChange={setDate}
        onClose={() => setShowDatePicker(false)}
        title={t('modals.addTransaction.dateTitle')}
      />
    </Modal>
  );
}

function makeStyles(Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: Colors.bg,
  },
  headerTitle: { ...Fonts.sans, fontSize: 20, ...Fonts.bold, color: Colors.text },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  closeTxt: { fontSize: 14, color: Colors.textSecondary },
  saveBtnBox: {
    backgroundColor: Colors.accent,
    minWidth: 98,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  saveTxt: { ...Fonts.sans, fontSize: 13, ...Fonts.bold, color: Colors.pureWhite },

  scroll: { padding: 16 },

  typeRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 18, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: Colors.border,
  },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  typeBtnActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  typeTxt: { ...Fonts.sans, fontSize: 14, ...Fonts.semiBold, color: Colors.textSecondary },
  typeTxtActive: { color: Colors.text, ...Fonts.bold },

  label: {
    ...Fonts.sans, fontSize: 11, ...Fonts.bold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
  },
  fieldGroup: { marginBottom: 24 },
  amountInput: { flex: 1, ...Fonts.serif, fontSize: 24, color: Colors.text },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categorySearchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInputWrap: { overflow: 'hidden', marginRight: 8 },
  searchIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: { ...Fonts.sans, fontSize: 16, ...Fonts.bold, color: Colors.text },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 4,
    minHeight: 76,
    marginBottom: 10,
    position: 'relative',
  },
  categoryCardActive: {
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
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
  categoryCheckText: { ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.pureWhite },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryName: { ...Fonts.sans, fontSize: 10, ...Fonts.bold, color: Colors.text, textAlign: 'center' },
  categoryNameActive: { color: Colors.text },
  moreDotsButton: {
    alignSelf: 'center',
    minWidth: 56,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
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

  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16,
    ...Fonts.sans, fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateValue: { ...Fonts.sans, fontSize: 15, ...Fonts.semiBold, color: Colors.text },
  dateIcon: { fontSize: 16, color: Colors.textSecondary },
}); }
