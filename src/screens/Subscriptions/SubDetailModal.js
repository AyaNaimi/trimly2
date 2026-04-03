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
  wrap: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 20 },
  handle: { width: 40, height: 5, backgroundColor: Colors.border, borderRadius: 100, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  closeBtn: { position: 'absolute', right: 20, top: 30, width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', zIndex: 1, borderWidth: 1, borderColor: Colors.border },
  closeTxt: { fontSize: 16, color: Colors.textSecondary },
  iconWrap: { alignItems: 'center', marginBottom: 26, marginTop: 16 },
  iconCircle: { width: 84, height: 84, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  subName: { fontSize: 26, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  subCat: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600', marginTop: 6 },
  cancelledBadge: { backgroundColor: Colors.bgSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: Colors.border },
  trialWarning: { backgroundColor: Colors.amberLight, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: Colors.amber },
  trialWarnTitle: { fontSize: 14, fontWeight: '700', color: Colors.amberDark, marginBottom: 6 },
  trialWarnBody: { fontSize: 13, color: Colors.amberDark, lineHeight: 19 },
  leapNotice: { backgroundColor: Colors.amberLight, borderRadius: 12, padding: 13, marginBottom: 16, borderWidth: 1.5, borderColor: Colors.amber },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.bgSecondary, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  statLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statVal: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 6, letterSpacing: -0.5 },
  infoCard: { backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 16, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 18 },
  actions: { gap: 10, marginBottom: 16 },
  letterBtn: { backgroundColor: Colors.purpleXLight, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.purpleLight },
  letterTxt: { fontSize: 15, fontWeight: '700', color: Colors.purple },
  cancelBtn: { backgroundColor: Colors.redLight, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: Colors.red },
  cancelTxt: { fontSize: 15, fontWeight: '700', color: Colors.red },
});
