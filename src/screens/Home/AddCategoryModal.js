// src/screens/Home/AddCategoryModal.js
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../theme';
import { CATEGORY_COLORS } from '../../data/initialData';

const EMOJIS = ['🛒','🍽️','☕','🚇','💊','🧴','📱','🌐','🏠','💡','🎬','💪','✈️','🎮','🏦','👗','🎉','⛽','🚗','🏥'];

export default function AddCategoryModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💰');
  const [color, setColor] = useState(Colors.pink);
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly');

  function save() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color, budget: parseFloat(amount) || 0, cycle, type });
    setName(''); setAmount(''); setIcon('💰'); setColor(Colors.pink);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.wrap}>
          <View style={styles.topRow}>
            <Pressable onPress={onClose} style={styles.closeBtn}><Text style={{ fontSize: 14, color: Colors.textSecondary }}>✕</Text></Pressable>
            <Text style={styles.title}>Nouvelle catégorie</Text>
            <Pressable onPress={save}><Text style={{ fontSize: 14, fontWeight: '700', color: Colors.purple }}>Créer</Text></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Icon preview */}
            <View style={styles.iconPreview}>
              <View style={[styles.iconCircle, { backgroundColor: color }]}>
                <Text style={{ fontSize: 32 }}>{icon}</Text>
              </View>
            </View>

            {/* Emoji grid */}
            <Text style={styles.lbl}>Icône</Text>
            <View style={styles.emojiGrid}>
              {EMOJIS.map(e => (
                <Pressable key={e} onPress={() => setIcon(e)} style={[styles.emojiBtn, icon === e && { backgroundColor: Colors.purpleLight }]}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.lbl}>Nom de la catégorie</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom..." placeholderTextColor={Colors.textSecondary} autoFocus />

            <Text style={styles.lbl}>Type</Text>
            <View style={styles.segment}>
              {['expense', 'savings'].map(t => (
                <Pressable key={t} onPress={() => setType(t)} style={[styles.segBtn, type === t && styles.segBtnActive]}>
                  <Text style={[styles.segTxt, type === t && styles.segTxtActive]}>{t === 'expense' ? 'Dépense' : 'Épargne'}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.lbl}>Montant alloué</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <View style={[styles.input, { flexDirection: 'row', alignItems: 'center', flex: 1 }]}>
                <Text style={{ color: Colors.textSecondary, fontSize: 15, marginRight: 4 }}>€</Text>
                <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textSecondary} style={{ flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text }} />
              </View>
              <View style={[styles.input, { justifyContent: 'center' }]}>
                <Pressable onPress={() => setCycle(c => c === 'weekly' ? 'monthly' : 'weekly')}>
                  <Text style={{ color: Colors.purple, fontWeight: '700', fontSize: 14 }}>{cycle === 'weekly' ? 'Hebdo' : 'Mensuel'} ▾</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.lbl}>Couleur</Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map(c => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorChip, { backgroundColor: c }, color === c && styles.colorChipSel]}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 24 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  iconPreview: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  lbl: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 },
  emojiBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgSecondary, borderWidth: 1, borderColor: Colors.border },
  input: { backgroundColor: Colors.bgSecondary, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '600', marginBottom: 18, color: Colors.text, borderWidth: 1.5, borderColor: Colors.border },
  segment: { flexDirection: 'row', backgroundColor: Colors.bgSecondary, borderRadius: 12, padding: 3, gap: 3, marginBottom: 18, borderWidth: 1, borderColor: Colors.border },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segBtnActive: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  segTxt: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  segTxtActive: { color: Colors.purple, fontWeight: '700' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 40 },
  colorChip: { width: 40, height: 40, borderRadius: 12 },
  colorChipSel: { borderWidth: 2.5, borderColor: Colors.text },
});
