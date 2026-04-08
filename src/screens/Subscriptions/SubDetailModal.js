// src/screens/Subscriptions/SubDetailModal.js
import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Colors, Fonts, Radius, Spacing, Shadow, Layout } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { formatDateFull, annualEquivalent, monthlyEquivalent } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';

export default function SubDetailModal({ sub, billing, onClose, onCancel, onGenerateLetter }) {
  const { state } = useApp();
  if (!sub) return null;
  const annual = annualEquivalent(sub.amount, sub.cycle);
  const monthly = monthlyEquivalent(sub.amount, sub.cycle);
  const currency = state.currency || '€';

  const cycleFr = { weekly: 'semaine', monthly: 'mois', quarterly: 'trimestre', annual: 'an' };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => { PremiumHaptics.selection(); onClose(); }} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Détails</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* Main Info */}
          <View style={styles.hero}>
            <View style={[styles.iconCircle, { backgroundColor: sub.color + '15' }]}>
              <Text style={{ fontSize: 44 }}>{sub.icon}</Text>
            </View>
            <Text style={styles.subName}>{sub.name}</Text>
            <Text style={styles.subCat}>{sub.category}</Text>
            
            {!sub.active && (
              <View style={styles.cancelledBadge}>
                <Text style={styles.cancelledTxt}>Résilié</Text>
              </View>
            )}
          </View>

          {/* Trial / Leap Year Notices */}
          {billing.isTrial && (
            <View style={[Layout.glassCard, styles.noticeCard, { borderColor: Colors.accent }]}>
              <Text style={styles.noticeTitle}>⏰ Essai gratuit actif</Text>
              <Text style={styles.noticeBody}>
                Fin de l'essai le {formatDateFull(billing.trialEndsAt)}. 
                Ensuite, {sub.amount.toFixed(2)} {currency} par {cycleFr[sub.cycle] || 'mois'}.
              </Text>
            </View>
          )}

          {/* Economics Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: Colors.surface }]}>
              <Text style={styles.statLabel}>Par {cycleFr[sub.cycle] || 'mois'}</Text>
              <Text style={styles.statValue}>{billing.isTrial ? `0.00 ${currency}` : `${sub.amount.toFixed(2)} ${currency}`}</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: Colors.surface }]}>
              <Text style={styles.statLabel}>Lissage mensuel</Text>
              <Text style={styles.statValue}>{monthly.toFixed(2)} {currency}</Text>
            </View>
          </View>

          {/* Detailed Info */}
          <View style={[Layout.glassCard, styles.infoCard]}>
            <DetailRow 
              label="Prochain prélèvement" 
              value={billing.isTrial ? formatDateFull(billing.trialEndsAt) : formatDateFull(billing.nextChargeDate)} 
              highlight={billing.urgency === 'urgent' || billing.urgency === 'today'}
            />
            <DetailRow label="Date de souscription" value={formatDateFull(new Date(sub.startDate))} />
            <DetailRow label="Fréquence" value={{ weekly: 'Hebdomadaire', monthly: 'Mensuel', quarterly: 'Trimestriel', annual: 'Annuel' }[sub.cycle]} />
            <DetailRow label="Équivalent annuel" value={`${annual.toFixed(2)} ${currency}`} />
            {sub.cancelledAt && <DetailRow label="Date de résiliation" value={formatDateFull(new Date(sub.cancelledAt))} danger />}
          </View>

          {/* Actions */}
          {sub.active && (
            <View style={styles.actions}>
              <Pressable 
                style={styles.actionBtnSecondary} 
                onPress={() => { PremiumHaptics.selection(); onGenerateLetter(); }}
              >
                <Text style={styles.actionTxtSecondary}>✉️ Générer une lettre</Text>
              </Pressable>
              
              <Pressable 
                style={styles.actionBtnDanger} 
                onPress={() => { PremiumHaptics.notification(true); onCancel(); }}
              >
                <Text style={styles.actionTxtDanger}>Résilier l'abonnement</Text>
              </Pressable>
            </View>
          )}
          
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value, highlight, danger }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: Colors.error }, danger && { color: Colors.error }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: Spacing.xl, paddingVertical: 20,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border
  },
  headerTitle: { ...Fonts.serif, fontSize: 18, color: Colors.text },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 20, color: Colors.textSecondary },
  
  scroll: { padding: Spacing.xl },
  hero: { alignItems: 'center', marginBottom: 32, marginTop: 12 },
  iconCircle: { width: 100, height: 100, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...Shadow.sm },
  subName: { ...Fonts.serif, fontSize: 32, color: Colors.text, letterSpacing: -0.5 },
  subCat: { ...Fonts.sans, fontSize: 16, color: Colors.textSecondary, marginTop: 6, ...Fonts.medium },
  
  cancelledBadge: { backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, marginTop: 12, borderWidth: 1, borderColor: Colors.border },
  cancelledTxt: { ...Fonts.sans, fontSize: 12, color: Colors.textSecondary, ...Fonts.bold },
  
  noticeCard: { padding: 16, marginBottom: 24, backgroundColor: Colors.accent + '05' },
  noticeTitle: { ...Fonts.sans, fontSize: 14, ...Fonts.bold, color: Colors.accent, marginBottom: 4 },
  noticeBody: { ...Fonts.sans, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statItem: { flex: 1, padding: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border },
  statLabel: { ...Fonts.sans, fontSize: 11, ...Fonts.bold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { ...Fonts.serif, fontSize: 20, color: Colors.text, marginTop: 8 },
  
  infoCard: { padding: 8, marginBottom: 32 },
  detailRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border 
  },
  detailLabel: { ...Fonts.sans, fontSize: 14, color: Colors.textSecondary, ...Fonts.medium },
  detailValue: { ...Fonts.sans, fontSize: 14, ...Fonts.bold, color: Colors.text },
  
  actions: { gap: 12 },
  actionBtnSecondary: { 
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: 18, 
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm 
  },
  actionTxtSecondary: { ...Fonts.sans, fontSize: 15, ...Fonts.bold, color: Colors.text },
  actionBtnDanger: { 
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 18, 
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border 
  },
  actionTxtDanger: { ...Fonts.sans, fontSize: 15, ...Fonts.bold, color: Colors.error },
});

