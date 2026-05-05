import React, { useEffect, useState, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';
import { CATEGORY_COLORS } from '../../data/initialData';
import { Fonts, Radius, Spacing, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const addAlpha = (hex, opacity) => {
  if (!hex) return 'transparent';
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const op = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${op}`;
};

const EMOJI_CATEGORIES = [
  { id: 'recent', label: 'Récents', icon: '🕒', items: ['💰', '🛒', '🍽️', '☕'] },
  { id: 'smileys', label: 'Smileys', icon: '😊', items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'] },
  { id: 'finance', label: 'Finance', icon: '💳', items: ['💰', '💵', '💸', '💳', '🏦', '💹', '🪙', '📊', '📈', '📉', '🤑', '💎', '💼', '👜', '🛍️', '🛒', '📦', '🏷️', '🏧', '🧾'] },
  { id: 'food', label: 'Alimentation', icon: '🍕', items: ['🍕', '🍔', '🍟', '🍎', '🍓', '🍰', '🍺', '🥤', '🍦', '🍳', '🥐', '🥖', '🥨', '🧀', '🍗', '🍖', '🌮', '🍣', '🍱', '🍜', '🍝', '🍲', '🥗', '🍿', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🥛', '☕', '🍵', '🍶', '🥂', '🥃', '🍸', '🍹'] },
  { id: 'transport', label: 'Transport', icon: '🚇', items: ['🚲', '🛵', '🚅', '✈️', '🚢', '🚀', '⛽', '🅿️', '🚧', '🗺️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏍️', '🚲', '🛴', '🛵', '🚠', '🚟', '🛶', '⛵', '🚁'] },
  { id: 'leisure', label: 'Loisirs', icon: '🎮', items: ['🎮', '🎨', '🎸', '📷', '📚', '⚽', '🎾', '🎳', '🎯', '🎡', '🎭', '🎬', '🎹', '🎷', '🎺', '🎻', '🎤', '🎧', '📻', '📺', '📻', '🎞️', '🎟️', '🛹', '🛶', '🏊', '🏄', '🏌️', '🧗', '🚵', '🧘'] },
  { id: 'home', label: 'Vie Quotidienne', icon: '🏠', items: ['🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪', '🕌', '🕍', '🕋', '⛲', '⛺', '💊', '🧴', '📱', '🌐', '💡', '👗', '🎉', '💪', '🛍️', '🧼', '🧺', '🧹', '🪣', '🚿', '🛁', '🚽', '🛋️', '🪑', '🛏️'] },
];

const DEFAULT_VALUES = {
  name: '',
  icon: '💰',
  color: '',
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
  const { Colors } = useTheme();
  const [name, setName] = useState(DEFAULT_VALUES.name);
  const [icon, setIcon] = useState(DEFAULT_VALUES.icon);
  const [color, setColor] = useState(DEFAULT_VALUES.color);
  const [type, setType] = useState(DEFAULT_VALUES.type);
  const [amount, setAmount] = useState(DEFAULT_VALUES.budget);
  const [cycle, setCycle] = useState(DEFAULT_VALUES.cycle);

  // Picker States
  const [activeEmojiCategory, setActiveEmojiCategory] = useState('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showColorWheel, setShowColorWheel] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!color && Colors?.accent) {
      setColor(Colors.accent);
    }
  }, [Colors, color]);

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
    setEmojiSearch('');
    setShowColorWheel(false);
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

  const filteredEmojis = emojiSearch.length > 0
    ? EMOJI_CATEGORIES.flatMap(c => c.items).filter(e => e.includes(emojiSearch)) // Note: simple search, could be improved with a dictionary
    : EMOJI_CATEGORIES.find(c => c.id === activeEmojiCategory)?.items || [];



  const styles = makeStyles(Colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => { PremiumHaptics.selection(); onClose(); }} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{mode === 'edit' ? 'Modifier' : 'Nouvelle catégorie'}</Text>
            <Pressable onPress={save} style={styles.createBtnBox}>
              <Text style={styles.createTxt}>{mode === 'edit' ? 'Enregistrer' : 'Créer'}</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} ref={scrollRef}>
            {/* --- Hero Preview --- */}
            <View style={styles.previewBox}>
              <View style={[styles.iconLarge, { backgroundColor: addAlpha(color, 0.12) }]}>
                <Text style={{ fontSize: 48 }}>{icon}</Text>
              </View>
              <View style={styles.previewTextWrapper}>
                <TextInput
                  style={styles.previewInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nom de la catégorie..."
                  placeholderTextColor={Colors.textMuted}
                  autoFocus
                />
                <Text style={styles.previewSub}>{type === 'expense' ? 'Dépense mensuelle' : 'Objectif d\'épargne'}</Text>
              </View>
            </View>

            {/* --- Config Section --- */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Configuration</Text>
              <View style={styles.typeToggle}>
                {['expense', 'savings'].map(item => (
                  <Pressable
                    key={item}
                    onPress={() => { PremiumHaptics.selection(); setType(item); }}
                    style={[styles.typeBtn, type === item && { backgroundColor: Colors.accent, ...Shadow.sm }]}
                  >
                    <Text style={[styles.typeTxt, type === item && { color: Colors.pureWhite, ...Fonts.bold }]}>
                      {item === 'expense' ? 'Dépense' : 'Épargne'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.budgetRow}>
                <View style={styles.amountInputBox}>
                  <Text style={styles.currencySymbol}>€</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textMuted}
                    style={styles.mainAmountInput}
                  />
                </View>
                <Pressable
                  onPress={() => { PremiumHaptics.selection(); setCycle(c => c === 'weekly' ? 'monthly' : 'weekly'); }}
                  style={styles.cycleBadge}
                >
                  <Text style={styles.cycleBadgeTxt}>{cycle === 'weekly' ? 'Par semaine' : 'Par mois'}</Text>
                </Pressable>
              </View>
            </View>

            {/* --- Innovative Icon Picker --- */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Icône & Identité</Text>
              <View style={styles.emojiPickerContainer}>
                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un emoji..."
                    placeholderTextColor={Colors.textMuted}
                    value={emojiSearch}
                    onChangeText={setEmojiSearch}
                  />
                </View>

                {/* Categories Tabs (WhatsApp Style) */}
                {!emojiSearch && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                    {EMOJI_CATEGORIES.map(cat => (
                      <Pressable
                        key={cat.id}
                        onPress={() => { PremiumHaptics.selection(); setActiveEmojiCategory(cat.id); }}
                        style={[styles.tabItem, activeEmojiCategory === cat.id && styles.tabItemActive]}
                      >
                        <Text style={styles.tabIcon}>{cat.icon}</Text>
                        <Text style={[styles.tabLabel, activeEmojiCategory === cat.id && styles.tabLabelActive]}>{cat.label}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}

                {/* Emoji Grid */}
                <View style={styles.emojiGrid}>
                  {filteredEmojis.map((item, idx) => (
                    <Pressable
                      key={`${item}-${idx}`}
                      onPress={() => { PremiumHaptics.selection(); setIcon(item); }}
                      style={[styles.emojiCell, icon === item && { backgroundColor: addAlpha(color || Colors.accent, 0.15), borderColor: color || Colors.accent }]}
                    >
                      <Text style={{ fontSize: 26 }}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* --- Premium Color Wheel --- */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>Couleur de la catégorie</Text>
                <Pressable onPress={() => { PremiumHaptics.selection(); setShowColorWheel(!showColorWheel); }}>
                  <Text style={styles.wheelToggleTxt}>{showColorWheel ? 'Palette simple' : 'Roue chromatique'}</Text>
                </Pressable>
              </View>

              {!showColorWheel ? (
                <View style={styles.colorPalette}>
                  {CATEGORY_COLORS.map(c => (
                    <Pressable
                      key={c}
                      onPress={() => { PremiumHaptics.selection(); setColor(c); }}
                      style={[styles.colorBubble, { backgroundColor: c }, color === c && styles.colorBubbleActive]}
                    />
                  ))}
                  <Pressable
                    onPress={() => { PremiumHaptics.selection(); setShowColorWheel(true); }}
                    style={styles.plusColorBtn}
                  >
                    <Text style={{ fontSize: 18, color: Colors.textSecondary }}>🎨</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.wheelContainer}>
                  <ColorPicker
                    color={color || '#5B3BF5'}
                    onColorChange={setColor}
                    thumbSize={26}
                    sliderSize={26}
                    noSnap={true}
                    row={false}
                  />
                  <View style={styles.wheelFooter}>
                    <View style={styles.hexBox}>
                      <Text style={styles.hexHash}>#</Text>
                      <TextInput
                        style={styles.hexValue}
                        value={color?.replace('#', '').toUpperCase()}
                        onChangeText={(v) => setColor(`#${v.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)}`)}
                        maxLength={6}
                      />
                    </View>
                    <View style={[styles.colorPreview, { backgroundColor: color }]} />
                  </View>
                </View>
              )}
            </View>

            {mode === 'edit' && onDelete && (
              <Pressable onPress={onDelete} style={styles.dangerZone}>
                <Text style={styles.dangerText}>Supprimer cette catégorie</Text>
              </Pressable>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    headerTitle: { ...Fonts.sans, fontSize: 17, ...Fonts.bold, color: Colors.text },
    closeBtn: { padding: 8, marginLeft: -8 },
    closeTxt: { fontSize: 18, color: Colors.textMuted },
    createBtnBox: {
      backgroundColor: Colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
    },
    createTxt: { ...Fonts.sans, fontSize: 14, ...Fonts.bold, color: Colors.pureWhite },
    scroll: { padding: 20 },

    // Hero
    previewBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
      backgroundColor: Colors.surface,
      padding: 20,
      borderRadius: 24,
      ...Shadow.soft,
    },
    iconLarge: {
      width: 80,
      height: 80,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 20,
    },
    previewTextWrapper: { flex: 1 },
    previewInput: { ...Fonts.sans, fontSize: 22, ...Fonts.bold, color: Colors.text, padding: 0 },
    previewSub: { ...Fonts.sans, fontSize: 13, color: Colors.textMuted, marginTop: 4 },

    // Sections
    section: { marginBottom: 32 },
    sectionLabel: { ...Fonts.sans, fontSize: 12, ...Fonts.bold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },

    // Config
    typeToggle: {
      flexDirection: 'row',
      backgroundColor: Colors.surface,
      borderRadius: 14,
      padding: 4,
      marginBottom: 16,
    },
    typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
    typeTxt: { ...Fonts.sans, fontSize: 14, color: Colors.textMuted },

    budgetRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    amountInputBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    currencySymbol: { ...Fonts.sans, fontSize: 20, ...Fonts.bold, color: Colors.textMuted, marginRight: 8 },
    mainAmountInput: { ...Fonts.serif, fontSize: 24, color: Colors.text, flex: 1 },
    cycleBadge: {
      paddingHorizontal: 16,
      height: 44,
      backgroundColor: Colors.surface,
      borderRadius: 22,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cycleBadgeTxt: { ...Fonts.sans, fontSize: 13, ...Fonts.bold, color: Colors.accent },

    // Emoji Picker (Innovative / WhatsApp Inspired)
    emojiPickerContainer: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: 16,
      ...Shadow.soft,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: 16,
    },
    searchIcon: { fontSize: 14, marginRight: 8 },
    searchInput: { flex: 1, ...Fonts.sans, fontSize: 14, color: Colors.text },
    tabsScroll: { marginBottom: 16, paddingBottom: 4 },
    tabItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginRight: 8,
      backgroundColor: Colors.surface,
    },
    tabItemActive: { backgroundColor: addAlpha(Colors.accent, 0.15) },
    tabIcon: { fontSize: 16, marginRight: 6 },
    tabLabel: { ...Fonts.sans, fontSize: 12, color: Colors.textMuted },
    tabLabelActive: { color: Colors.accent, ...Fonts.bold },
    emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    emojiCell: {
      width: (SCREEN_WIDTH - 120) / 5,
      height: (SCREEN_WIDTH - 120) / 5,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },

    // Color Wheel
    colorPalette: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorBubble: { width: 36, height: 36, borderRadius: 18 },
    colorBubbleActive: { borderWidth: 3, borderColor: Colors.text, transform: [{ scale: 1.1 }] },
    plusColorBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    wheelToggleTxt: { ...Fonts.sans, fontSize: 12, color: Colors.accent, ...Fonts.bold },
    wheelContainer: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      minHeight: 300,
      ...Shadow.soft,
    },
    wheelFooter: {
      flexDirection: 'row',
      marginTop: 24,
      width: '100%',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    hexBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      flex: 1,
      marginRight: 16,
    },
    hexHash: { ...Fonts.sans, fontSize: 16, ...Fonts.bold, color: Colors.textMuted, marginRight: 4 },
    hexValue: { ...Fonts.sans, fontSize: 16, ...Fonts.bold, color: Colors.text, flex: 1, padding: 0 },
    colorPreview: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },

    // Danger
    dangerZone: {
      marginTop: 8,
      paddingVertical: 16,
      alignItems: 'center',
    },
    dangerText: { ...Fonts.sans, fontSize: 14, color: Colors.error, ...Fonts.bold },
  });
}
