// src/screens/Subscriptions/SubDetailModal.js
import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Fonts, Radius, Spacing, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { formatDateFull, annualEquivalent, monthlyEquivalent } from '../../utils/dateUtils';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { getSuggestedAlternatives } from '../../services/emailService';

const addAlpha = (hex, opacity) => {
  if (!hex) return 'transparent';
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const op = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${op}`;
};

export default function SubDetailModal({ sub, billing, onClose, onCancel, onGenerateLetter }) {
  const { Colors } = useTheme();
  const { state } = useApp();
  const { t } = useLanguage();
  if (!sub) return null;

  const annual = annualEquivalent(sub.amount, sub.cycle);
  const monthly = monthlyEquivalent(sub.amount, sub.cycle);
  const currency = state.currency || '€';
  const alternatives = getSuggestedAlternatives(sub.name);
  const s = makeStyles(Colors);

  return (
    <Modal visible={!!sub} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <Pressable onPress={() => { PremiumHaptics.selection(); onClose(); }} style={s.closeBtn}>
            <Text style={s.closeTxt}>✕</Text>
          </Pressable>
          <Text style={s.headerTitle}>{t('subscriptions.detail.details')}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          {/* Hero */}
          <View style={s.hero}>
            <View style={[s.iconCircle, { backgroundColor: addAlpha(sub.color || Colors.accent, 0.12) }]}>
              <Text style={{ fontSize: 44 }}>{sub.icon}</Text>
            </View>
            <Text style={s.subName}>{sub.name}</Text>
            <Text style={s.subCat}>{sub.category}</Text>
            {!sub.active && (
              <View style={s.cancelledBadge}>
                <Text style={s.cancelledTxt}>{t('subscriptions.detail.cancelled')}</Text>
              </View>
            )}
          </View>

          {/* Trial notice */}
          {billing.isTrial && (
            <View style={[s.noticeCard, { borderColor: Colors.accent }]}>
              <Text style={s.noticeTitle}>{t('subscriptions.detail.trialActive')}</Text>
              <Text style={s.noticeBody}>
                {t('subscriptions.detail.trialEnds', {
                  date: formatDateFull(billing.trialEndsAt),
                  amount: sub.amount.toFixed(2),
                  currency,
                  cycle: t(`subscriptions.cycles.${sub.cycle}`)
                })}
              </Text>
            </View>
          )}

          {/* Stats grid */}
          <View style={s.statsGrid}>
            <View style={[s.statItem, { backgroundColor: Colors.surface }]}>
              <Text style={s.statLabel}>{t('subscriptions.detail.perCycle', { cycle: t(`subscriptions.cycles.${sub.cycle}`) })}</Text>
              <Text style={s.statValue}>
                {billing.isTrial ? `0.00 ${currency}` : `${sub.amount.toFixed(2)} ${currency}`}
              </Text>
            </View>
            <View style={[s.statItem, { backgroundColor: Colors.surface }]}>
              <Text style={s.statLabel}>{t('subscriptions.detail.monthlyAverage')}</Text>
              <Text style={s.statValue}>{monthly.toFixed(2)} {currency}</Text>
            </View>
          </View>

          {/* Detail rows */}
          <View style={s.infoCard}>
            <DetailRow Colors={Colors} label={t('subscriptions.detail.nextCharge')}
              value={billing.isTrial ? formatDateFull(billing.trialEndsAt) : formatDateFull(billing.nextChargeDate)}
              highlight={billing.urgency === 'urgent' || billing.urgency === 'today'} />
            <DetailRow Colors={Colors} label={t('subscriptions.detail.subscriptionDate')} value={formatDateFull(new Date(sub.startDate))} />
            <DetailRow Colors={Colors} label={t('subscriptions.detail.frequency')}
              value={t(`subscriptions.cycles.${sub.cycle}Full`)} />
            <DetailRow Colors={Colors} label={t('subscriptions.detail.annualEquivalent')} value={`${annual.toFixed(2)} ${currency}`} />
            {sub.cancelledAt && (
              <DetailRow Colors={Colors} label={t('subscriptions.detail.cancellationDate')} value={formatDateFull(new Date(sub.cancelledAt))} danger />
            )}
          </View>

          {alternatives.length > 0 && (
            <View style={s.infoCard}>
              <Text style={s.altTitle}>{t('subscriptions.detail.alternatives')}</Text>
              <Text style={s.altText}>{alternatives.join(' • ')}</Text>
            </View>
          )}

          {/* Actions */}
          {sub.active && (
            <View style={s.actions}>
              <Pressable style={s.actionBtnSecondary} onPress={() => { PremiumHaptics.selection(); onGenerateLetter(); }}>
                <Text style={s.actionTxtSecondary}>✉️ Générer une lettre</Text>
              </Pressable>
              <Pressable style={s.actionBtnDanger} onPress={() => { PremiumHaptics.notification?.(true); onCancel(); }}>
                <Text style={s.actionTxtDanger}>{t('subscriptions.detail.cancelSubscription')}</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value, highlight, danger, Colors }) {
  const s = makeStyles(Colors);  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, (highlight || danger) && { color: Colors.error }]}>{value}</Text>
    </View>
  );
}

function makeStyles(Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl, paddingVertical: 20,
      backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 18, color: Colors.text },
    closeBtn: { padding: 4 },
    closeTxt: { fontSize: 20, color: Colors.textSecondary },

    scroll: { padding: Spacing.xl },
    hero: { alignItems: 'center', marginBottom: 32, marginTop: 12 },
    iconCircle: {
      width: 100, height: 100, borderRadius: Radius.lg,
      alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...Shadow.soft,
    },
    subName: { ...Fonts.primary, ...Fonts.black, fontSize: 28, color: Colors.text, letterSpacing: -0.5 },
    subCat: { ...Fonts.primary, fontSize: 16, color: Colors.textSecondary, marginTop: 6 },

    cancelledBadge: {
      backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: Radius.pill, marginTop: 12, borderWidth: 1, borderColor: Colors.border,
    },
    cancelledTxt: { ...Fonts.primary, ...Fonts.bold, fontSize: 12, color: Colors.textSecondary },

    noticeCard: {
      padding: 16, marginBottom: 24, borderRadius: Radius.lg,
      backgroundColor: Colors.surface, borderWidth: 1,
    },
    noticeTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 14, color: Colors.accent, marginBottom: 4 },
    noticeBody: { ...Fonts.primary, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

    altTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 13, color: Colors.text, marginBottom: 8 },
    altText: { ...Fonts.primary, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },

    statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statItem: {
      flex: 1, padding: 16, borderRadius: Radius.lg,
      borderWidth: 1, borderColor: Colors.border,
    },
    statLabel: {
      ...Fonts.primary, ...Fonts.bold, fontSize: 11, color: Colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 1,
    },
    statValue: { ...Fonts.primary, ...Fonts.black, fontSize: 20, color: Colors.text, marginTop: 8 },

    infoCard: { marginBottom: 24, borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    detailRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    detailLabel: { ...Fonts.primary, fontSize: 14, color: Colors.textSecondary },
    detailValue: { ...Fonts.primary, ...Fonts.bold, fontSize: 14, color: Colors.text },

    actions: { gap: 12 },
    actionBtnSecondary: {
      backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 18,
      alignItems: 'center', borderWidth: 1, borderColor: Colors.border, ...Shadow.soft,
    },
    actionTxtSecondary: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
    actionBtnDanger: {
      backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 18,
      alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    },
    actionTxtDanger: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.error },
  });
}
