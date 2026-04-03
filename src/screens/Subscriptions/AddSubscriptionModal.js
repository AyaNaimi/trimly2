// src/screens/Subscriptions/AddSubscriptionModal.js
import React, { useState } from 'react';
import { View, Text, Modal, Pressable, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../theme';
import { QUICK_SUBSCRIPTIONS, SUB_CATEGORIES } from '../../data/initialData';
import { todayISO, isLeapDaySubscription } from '../../utils/dateUtils';

export default function AddSubscriptionModal({ visible, onClose, onSave }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#5B3BF5');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly');
  const [startDate, setStartDate] = useState(todayISO());
  const [trialDays, setTrialDays] = useState('0');
  const [category, setCategory] = useState('Streaming');

  function prefill(qs) {
    setName(qs.name); setIcon(qs.icon); setColor(qs.color);
    setAmount(String(qs.amount)); setCycle(qs.cycle); setCategory(qs.category);
  }

  function save() {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) return;
    const isLeap = isLeapDaySubscription(startDate);
    onSave({ name: name.trim(), icon, color, amount: amt, cycle, startDate, trialDays: parseInt(trialDays) || 0, category, leapDayStart: isLeap });
    setName(''); setAmount(''); setTrialDays('0'); setStartDate(todayISO());
  }

  const cycles = [
    { key: 'weekly', label: 'Hebdo' },
    { key: 'monthly', label: 'Mensuel' },
    { key: 'quarterly', label: 'Trimestriel' },
    { key: 'annual', label: 'Annuel' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.wrap}>
          <View style={styles.handle} />
          <View style={styles.topRow}>
            <Pressable onPress={onClose} style={styles.closeBtn}><Text style={styles.closeTxt}>✕</Text></Pressable>
            <Text style={styles.title}>Nouvel abonnement</Text>
            <Pressable onPress={save}><Text style={styles.saveTxt}>Ajouter</Text></Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Quick add */}
            <Text style={styles.lbl}>Populaires</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {QUICK_SUBSCRIPTIONS.slice(0, 10).map(qs => (
                <Pressable key={qs.name} onPress={() => prefill(qs)} style={[styles.quickChip, name === qs.name && { backgroundColor: Colors.purple, borderColor: Colors.purple }]}>
                  <Text>{qs.icon}</Text>
                  <Text style={[styles.quickTxt, name === qs.name && { color: '#fff' }]}>{qs.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.lbl}>Nom</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="ex: Netflix, Adobe..." placeholderTextColor={Colors.textSecondary} />

            <Text style={styles.lbl}>Montant (€)</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" placeholderTextColor={Colors.textSecondary} />

            <Text style={styles.lbl}>Fréquence</Text>
            <View style={styles.cycleRow}>
              {cycles.map(c => (
                <Pressable key={c.key} onPress={() => setCycle(c.key)} style={[styles.cycleBtn, cycle === c.key && styles.cycleBtnActive]}>
                  <Text style={[styles.cycleTxt, cycle === c.key && styles.cycleTxtActive]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.lbl}>Date de début</Text>
            <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSecondary} />

            {/* Leap year notice */}
            {isLeapDaySubscription(startDate) && (
              <View style={styles.leapNotice}>
                <Text style={{ fontSize: 13, color: '#92400E' }}>
                  ℹ️ Commencé le 29 fév. — les années non bissextiles, le prélèvement sera le 28 février
                </Text>
              </View>
            )}

            <Text style={styles.lbl}>Essai gratuit (jours) — 0 si aucun</Text>
            <TextInput style={styles.input} value={trialDays} onChangeText={setTrialDays} keyboardType="number-pad" placeholder="0" placeholderTextColor={Colors.textSecondary} />
            {parseInt(trialDays) > 0 && (
              <View style={styles.trialNotice}>
                <Text style={{ fontSize: 13, color: '#166534' }}>
                  ✓ Gratuit pendant {trialDays} jours, puis {parseFloat(amount) || 0} €/{cycle === 'monthly' ? 'mois' : cycle === 'annual' ? 'an' : cycle}
                </Text>
              </View>
            )}

            <Text style={styles.lbl}>Catégorie</Text>
            <View style={styles.catWrap}>
              {SUB_CATEGORIES.map(c => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.catChip, category === c && { backgroundColor: Colors.purple, borderColor: Colors.purple }]}>
                  <Text style={[styles.catTxt, category === c && { color: '#fff' }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 20 },
  handle: { width: 40, height: 5, backgroundColor: Colors.border, borderRadius: 100, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  closeTxt: { fontSize: 16, color: Colors.textSecondary },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  saveTxt: { fontSize: 15, fontWeight: '700', color: Colors.purple },
  lbl: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: Colors.bgSecondary, borderRadius: 12, padding: 14, fontSize: 15, fontWeight: '600', marginBottom: 18, color: Colors.text, borderWidth: 1.5, borderColor: Colors.border },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, marginRight: 8 },
  quickTxt: { fontSize: 13, fontWeight: '700', color: Colors.text },
  cycleRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  cycleBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.white },
  cycleBtnActive: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  cycleTxt: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  cycleTxtActive: { color: Colors.white },
  leapNotice: { backgroundColor: Colors.amberLight, borderRadius: 12, padding: 13, marginBottom: 18, marginTop: -8, borderWidth: 1.5, borderColor: Colors.amber },
  trialNotice: { backgroundColor: Colors.greenLight, borderRadius: 12, padding: 13, marginBottom: 18, marginTop: -8, borderWidth: 1.5, borderColor: Colors.green },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 16 },
  catChip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  catTxt: { fontSize: 13, fontWeight: '700', color: Colors.text },
});
