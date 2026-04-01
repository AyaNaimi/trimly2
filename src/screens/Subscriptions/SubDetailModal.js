// src/screens/Subscriptions/SubDetailModal.js
import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Colors, Shadow } from '../../theme';
import { formatDateFull, annualEquivalent, monthlyEquivalent } from '../../utils/dateUtils';

export default function SubDetailModal({ sub, billing, onClose, onCancel, onGenerateLetter }) {
  if (!sub) return null;
  const annual = annualEquivalent(sub.amount, sub.cycle);
  const monthly = monthlyEquivalent(sub.amount, sub.cycle);

  const cycleFr = { weekly: 'semaine', monthly: 'mois', quarterly: 'trimestre', annual: 'an' };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <View style={styles.handle} />
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>✕</Text>
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.iconWrap}>
            <View style={[styles.iconCircle, { backgroundColor: sub.color + '22' }]}>
              <Text style={{ fontSize: 40 }}>{sub.icon}</Text>
            </View>
            <Text style={styles.subName}>{sub.name}</Text>
            <Text style={styles.subCat}>{sub.category}</Text>
            {!sub.active && (
              <View style={styles.cancelledBadge}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textSecondary }}>Résilié</Text>
              </View>
            )}
          </View>

          {/* Trial warning */}
          {billing.isTrial && (
            <View style={styles.trialWarning}>
              <Text style={styles.trialWarnTitle}>⏰  Essai gratuit en cours</Text>
              <Text style={styles.trialWarnBody}>
                Se termine dans {billing.trialDaysLeft} jour{billing.trialDaysLeft > 1 ? 's' : ''} le {formatDateFull(billing.trialEndsAt)}.
                {'\n'}Après : {sub.amount.toFixed(2)} €/{cycleFr[sub.cycle] || 'mois'}
              </Text>
            </View>
          )}

          {/* Leap year notice */}
          {sub.leapDayStart && (
            <View style={styles.leapNotice}>
              <Text style={{ fontSize: 13, color: '#92400E' }}>
                ℹ️ Commencé le 29 fév. — prélèvement le 28 fév. les années non bissextiles
              </Text>
            </View>
          )}

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLbl}>Par {cycleFr[sub.cycle] || 'mois'}</Text>
              <Text style={styles.statVal}>{billing.isTrial ? 'Gratuit' : `${sub.amount.toFixed(2)} €`}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLbl}>Par mois</Text>
              <Text style={styles.statVal}>{monthly.toFixed(2)} €</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLbl}>Par an</Text>
              <Text style={styles.statVal}>{annual.toFixed(2)} €</Text>
            </View>
          </View>

          {/* Info rows */}
          <View style={styles.infoCard}>
            <InfoRow label="Prochain prélèvement" value={billing.isTrial ? `Fin essai: ${formatDateFull(billing.trialEndsAt)}` : formatDateFull(billing.nextChargeDate)} highlight={billing.urgency === 'urgent' || billing.urgency === 'today'} />
            <InfoRow label="Date de début" value={formatDateFull(new Date(sub.startDate))} />
            <InfoRow label="Fréquence" value={{ weekly: 'Hebdomadaire', monthly: 'Mensuel', quarterly: 'Trimestriel', annual: 'Annuel' }[sub.cycle]} />
            {sub.trialDays > 0 && <InfoRow label="Durée essai" value={`${sub.trialDays} jours`} />}
            {sub.cancelledAt && <InfoRow label="Résilié le" value={formatDateFull(new Date(sub.cancelledAt))} danger />}
          </View>

          {/* Actions */}
          {sub.active && (
            <View style={styles.actions}>
              <Pressable style={styles.letterBtn} onPress={onGenerateLetter}>
                <Text style={styles.letterTxt}>✉️  Générer lettre de résiliation</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={onCancel}>
                <Text style={styles.cancelTxt}>Résilier cet abonnement</Text>
              </Pressable>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function InfoRow({ label, value, highlight, danger }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
      <Text style={{ fontSize: 14, color: Colors.textSecondary, fontWeight: '600' }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: danger ? Colors.red : highlight ? Colors.red : Colors.text }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
  handle: { width: 40, height: 5, backgroundColor: Colors.border, borderRadius: 100, alignSelf: 'center', marginTop: 10, marginBottom: 16 },
  closeBtn: { position: 'absolute', right: 20, top: 30, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  closeTxt: { fontSize: 14, color: Colors.textSecondary },
  iconWrap: { alignItems: 'center', marginBottom: 24, marginTop: 16 },
  iconCircle: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  subName: { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  subCat: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', marginTop: 4 },
  cancelledBadge: { backgroundColor: Colors.border, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, marginTop: 8 },
  trialWarning: { backgroundColor: Colors.amberLight, borderRadius: 14, padding: 14, marginBottom: 14 },
  trialWarnTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 6 },
  trialWarnBody: { fontSize: 13, color: '#78350F', lineHeight: 19 },
  leapNotice: { backgroundColor: Colors.amberLight, borderRadius: 10, padding: 12, marginBottom: 14 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: Colors.bg, borderRadius: 12, padding: 14 },
  statLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  statVal: { fontSize: 18, fontWeight: '900', color: Colors.text, marginTop: 4, letterSpacing: -0.5 },
  infoCard: { backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 16 },
  actions: { gap: 10 },
  letterBtn: { backgroundColor: Colors.purpleLight, borderRadius: 14, padding: 16, alignItems: 'center' },
  letterTxt: { fontSize: 15, fontWeight: '700', color: Colors.purple },
  cancelBtn: { backgroundColor: Colors.redLight, borderRadius: 14, padding: 16, alignItems: 'center' },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: Colors.red },
});
