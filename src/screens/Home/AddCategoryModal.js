import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CATEGORY_COLORS } from '../../data/initialData';
import { Colors, Fonts, Radius, Spacing, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';

const EMOJIS = ['🛒', '🍽️', '☕', '🚇', '💊', '🧴', '📱', '🌐', '🏠', '💡', '🎬', '💪', '✈️', '🎮', '🏦', '👗', '🎉', '⛽', '🚗', '🏥'];

const DEFAULT_VALUES = {
  name: '',
  icon: '💰',
  color: Colors.accent,
  type: 'expense',
  budget: '',
  cycle: 'monthly',
};

export default function AddCategoryModal({
  visible,
  onClose,
  onSave,
  initialValues = null,
  mode = 'create',
  onDelete,
}) {
  const [name, setName] = useState(DEFAULT_VALUES.name);
  const [icon, setIcon] = useState(DEFAULT_VALUES.icon);
  const [color, setColor] = useState(DEFAULT_VALUES.color);
  const [type, setType] = useState(DEFAULT_VALUES.type);
  const [amount, setAmount] = useState(DEFAULT_VALUES.budget);
  const [cycle, setCycle] = useState(DEFAULT_VALUES.cycle);

  useEffect(() => {
    if (!visible) return;
    const values = { ...DEFAULT_VALUES, ...(initialValues || {}) };
    setName(values.name || '');
    setIcon(values.icon || DEFAULT_VALUES.icon);
    setColor(values.color || DEFAULT_VALUES.color);
    setType(values.type || DEFAULT_VALUES.type);
    setAmount(typeof values.budget === 'number' ? String(values.budget) : (values.budget || ''));
    setCycle(values.cycle || DEFAULT_VALUES.cycle);
  }, [visible, initialValues]);

  function resetForm() {
    setName(DEFAULT_VALUES.name);
    setIcon(DEFAULT_VALUES.icon);
    setColor(DEFAULT_VALUES.color);
    setType(DEFAULT_VALUES.type);
    setAmount(DEFAULT_VALUES.budget);
    setCycle(DEFAULT_VALUES.cycle);
  }

  function save() {
    if (!name.trim()) {
      PremiumHaptics.error();
      return;
    }

    PremiumHaptics.success();
    onSave({
      ...(initialValues || {}),
      name: name.trim(),
      icon,
      color,
      budget: parseFloat(amount) || 0,
      cycle,
      type,
    });
    resetForm();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => { PremiumHaptics.selection(); onClose(); }} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{mode === 'edit' ? 'Modifier la categorie' : 'Nouvelle categorie'}</Text>
            <Pressable onPress={save} style={styles.createBtnBox}>
              <Text style={styles.createTxt}>{mode === 'edit' ? 'Enregistrer' : 'Creer'}</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <View style={styles.previewBox}>
              <View style={[styles.iconLarge, { backgroundColor: `${color}15` }]}>
                <Text style={{ fontSize: 44 }}>{icon}</Text>
              </View>
              <Text style={styles.previewText}>{name || 'Nouvelle categorie'}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nom de la categorie</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex. Loisirs, Alimentation..."
                placeholderTextColor={Colors.textSecondary}
                autoFocus
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Configuration</Text>
              <View style={styles.typeRow}>
                {['expense', 'savings'].map(item => (
                  <Pressable
                    key={item}
                    onPress={() => { PremiumHaptics.selection(); setType(item); }}
                    style={[styles.typeBtn, type === item && styles.typeBtnActive]}
                  >
                    <Text style={[styles.typeTxt, type === item && styles.typeTxtActive]}>
                      {item === 'expense' ? 'Depense' : 'Epargne'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.budgetRow}>
                <View style={styles.amountBox}>
                  <Text style={styles.currency}>EUR</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textSecondary}
                    style={styles.budgetInput}
                  />
                </View>
                <Pressable
                  onPress={() => { PremiumHaptics.selection(); setCycle(current => (current === 'weekly' ? 'monthly' : 'weekly')); }}
                  style={styles.cycleBtn}
                >
                  <Text style={styles.cycleTxt}>{cycle === 'weekly' ? 'Semaine' : 'Mois'}</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.label}>Icone</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(item => (
                <Pressable
                  key={item}
                  onPress={() => { PremiumHaptics.selection(); setIcon(item); }}
                  style={[styles.emojiPill, icon === item && styles.emojiPillActive]}
                >
                  <Text style={{ fontSize: 22 }}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Palette de couleurs</Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map(item => (
                <Pressable
                  key={item}
                  onPress={() => { PremiumHaptics.selection(); setColor(item); }}
                  style={[styles.colorDot, { backgroundColor: item }, color === item && styles.colorDotActive]}
                />
              ))}
            </View>

            {mode === 'edit' && onDelete ? (
              <Pressable onPress={onDelete} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Supprimer la categorie</Text>
              </Pressable>
            ) : null}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  headerTitle: { ...Fonts.sans, fontSize: 20, ...Fonts.bold, color: Colors.text, flex: 1, textAlign: 'center', marginHorizontal: 12 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  closeTxt: { fontSize: 14, color: '#666666' },
  createBtnBox: {
    backgroundColor: Colors.accent,
    minWidth: 98,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTxt: { ...Fonts.sans, fontSize: 13, ...Fonts.bold, color: Colors.white },
  scroll: { padding: 16 },
  previewBox: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 4,
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 16,
    ...Shadow.soft,
  },
  iconLarge: {
    width: 90,
    height: 90,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadow.sm,
  },
  previewText: { ...Fonts.sans, fontSize: 24, ...Fonts.bold, color: Colors.text, textAlign: 'center' },
  label: {
    ...Fonts.sans,
    fontSize: 11,
    ...Fonts.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  fieldGroup: { marginBottom: 28 },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: 16,
    ...Fonts.sans,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  typeBtnActive: { backgroundColor: Colors.white, ...Shadow.sm },
  typeTxt: { ...Fonts.sans, fontSize: 14, ...Fonts.semiBold, color: Colors.textSecondary },
  typeTxtActive: { color: Colors.text, ...Fonts.bold },
  budgetRow: { flexDirection: 'row', gap: 12 },
  amountBox: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currency: { ...Fonts.sans, fontSize: 14, ...Fonts.bold, color: Colors.textSecondary, marginRight: 8 },
  budgetInput: { ...Fonts.serif, fontSize: 20, color: Colors.text, flex: 1 },
  cycleBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cycleTxt: { ...Fonts.sans, fontSize: 14, ...Fonts.bold, color: Colors.accent },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  emojiPill: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiPillActive: { borderColor: Colors.accent, backgroundColor: `${Colors.accent}10`, ...Shadow.sm },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: Colors.text, transform: [{ scale: 1.1 }] },
  deleteButton: {
    marginTop: 8,
    backgroundColor: Colors.errorSoft,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error,
  },
  deleteButtonText: {
    ...Fonts.sans,
    fontSize: 14,
    ...Fonts.bold,
    color: Colors.error,
  },
});
