// src/screens/Home/AddTransactionModal.js
import React, { useState } from 'react';
import {
  View, Text, Modal, Pressable, TextInput, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme';
import { todayISO } from '../../utils/dateUtils';

export default function AddTransactionModal({ visible, onClose, categories, onSave }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());

  function save() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const cat = categories.find(c => c.id === categoryId);
    onSave({ type, amount: amt, categoryId, categoryName: cat?.name || '', icon: cat?.icon || '💳', color: cat?.color || Colors.purple, note: note || cat?.name || '', date });
    setAmount('');
    setNote('');
    setDate(todayISO());
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.wrap}>
          <View style={styles.handle} />
          <View style={styles.row}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </Pressable>
            <Text style={styles.title}>Ajouter</Text>
            <Pressable onPress={save} style={styles.saveBtn}>
              <Text style={styles.saveTxt}>Sauvegarder</Text>
            </Pressable>
          </View>

          {/* Type toggle */}
          <View style={styles.segment}>
            {['expense', 'income'].map(t => (
              <Pressable key={t} onPress={() => setType(t)} style={[styles.segBtn, type === t && styles.segBtnActive]}>
                <Text style={[styles.segTxt, type === t && styles.segTxtActive]}>
                  {t === 'expense' ? 'Dépense' : 'Revenu'}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView>
            <Text style={styles.lbl}>Montant (€)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={Colors.textSecondary} autoFocus />

            <Text style={styles.lbl}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {categories.map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[styles.catChip, categoryId === cat.id && { backgroundColor: Colors.purple, borderColor: Colors.purple }]}
                >
                  <Text>{cat.icon}</Text>
                  <Text style={[styles.catChipTxt, categoryId === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.lbl}>Note</Text>
            <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Description..." placeholderTextColor={Colors.textSecondary} />

            <Text style={styles.lbl}>Date</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet;
const styles = s.create({
  wrap: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 20 },
  handle: { width: 40, height: 5, backgroundColor: Colors.border, borderRadius: 100, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  closeTxt: { fontSize: 16, color: Colors.textSecondary },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  saveBtn: {},
  saveTxt: { fontSize: 15, fontWeight: '700', color: Colors.purple },
  segment: { flexDirection: 'row', backgroundColor: Colors.bgSecondary, borderRadius: 12, padding: 3, gap: 3, marginBottom: 24, borderWidth: 1, borderColor: Colors.border },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segBtnActive: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  segTxt: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  segTxtActive: { color: Colors.purple, fontWeight: '700' },
  lbl: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: Colors.bgSecondary, borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '600', marginBottom: 18, color: Colors.text, borderWidth: 1.5, borderColor: Colors.border },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, marginRight: 8 },
  catChipTxt: { fontSize: 13, fontWeight: '700', color: Colors.text },
});
