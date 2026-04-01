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
  wrap: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 20 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  iconPreview: { alignItems: 'center', marginBottom: 20 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  lbl: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emojiBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  input: { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '600', marginBottom: 16, color: Colors.text },
  segment: { flexDirection: 'row', backgroundColor: Colors.bg, borderRadius: 12, padding: 4, gap: 4, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segTxt: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  segTxtActive: { color: Colors.text, fontWeight: '700' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 40 },
  colorChip: { width: 36, height: 36, borderRadius: 18 },
  colorChipSel: { borderWidth: 3, borderColor: Colors.text },
});
