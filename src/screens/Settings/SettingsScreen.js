// src/screens/Settings/SettingsScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, Alert, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../theme';
import { SettingsRow, Toggle } from '../../components';
import { useApp } from '../../context/AppContext';
import { scheduleDailyReminders } from '../../utils/notifications';
import { formatDateFull } from '../../utils/dateUtils';

export default function SettingsScreen() {
  const { state, dispatch, trialDaysLeft, isPro } = useApp();
  const [showPaywall, setShowPaywall] = useState(false);

  const trialExpiry = () => {
    if (!state.trial?.startDate) return '';
    const d = new Date(state.trial.startDate);
    d.setDate(d.getDate() + (state.trial.durationDays || 14));
    return formatDateFull(d);
  };

  const notifLabels = ['Silencieux', 'Doux', 'Agressif', 'Implacable'];

  function setNotifLevel(level) {
    Haptics.selectionAsync();
    dispatch({ type: 'SET_NOTIF_LEVEL', payload: level });
    scheduleDailyReminders(level);
  }

  function subscribe(plan) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch({ type: 'SET_SUBSCRIPTION_PLAN', payload: plan });
    setShowPaywall(false);
    Alert.alert('✅ Abonnement activé !', `Bienvenue dans Trimly Pro 🎉`);
  }

  function resetData() {
    Alert.alert(
      'Nouveau départ ?',
      'Toutes vos données seront supprimées. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser', style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_PERIOD' });
            Alert.alert('✓ Données réinitialisées');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 32 }}>🐾</Text>
          </View>
          <Text style={styles.avatarName}>Trimly</Text>
          <Text style={styles.avatarEmail}>trimly@app.com</Text>
        </View>

        {/* Account */}
        <Text style={styles.sectionLbl}>Compte</Text>
        <SettingsRow title="Nom" value="Utilisateur" />
        <SettingsRow title="Email" value="trimly@app.com" />
        <SettingsRow title="Changer le mot de passe" onPress={() => {}} />

        {/* Subscription */}
        <Text style={styles.sectionLbl}>Abonnement</Text>

        {state.subscription ? (
          <View style={[styles.subRow, { backgroundColor: Colors.purpleLight, borderColor: Colors.purple }]}>
            <Text style={{ fontSize: 18 }}>🎉</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.purple }}>
                Trimly Pro Actif
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                Plan {state.subscription === 'monthly' ? 'mensuel' : state.subscription === 'annual' ? 'annuel' : 'à vie'}
              </Text>
            </View>
          </View>
        ) : state.trial?.active && trialDaysLeft > 0 ? (
          <View style={[styles.subRow, { backgroundColor: Colors.purpleLight, borderColor: Colors.purple }]}>
            <Text style={{ fontSize: 18 }}>🥳</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.purple }}>
                Essai gratuit actif
              </Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                Expire le {trialExpiry()} ({trialDaysLeft}j restants)
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.subRow, { backgroundColor: Colors.redLight, borderColor: Colors.red }]}>
            <Text style={{ fontSize: 18 }}>⏰</Text>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.red }}>Essai expiré</Text>
              <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                Abonnez-vous pour accéder à toutes les fonctionnalités
              </Text>
            </View>
          </View>
        )}

        <SettingsRow title="⭐  S'abonner à Trimly Pro" onPress={() => setShowPaywall(true)} />
        <SettingsRow title="Vérifier le statut" onPress={() => Alert.alert('Statut', isPro ? '✅ Accès Pro actif' : '❌ Pas d\'abonnement actif')} />

        {/* App Settings */}
        <Text style={styles.sectionLbl}>Préférences</Text>
        <SettingsRow title="Devise" value={state.currency || '€'} />
        <SettingsRow title="Apparence" value="Système" />
        <SettingsRow
          title="Notifications"
          value={notifLabels[state.notifLevel ?? 0]}
          onPress={() => {
            Alert.alert('Niveau de notifications', 'Choisissez votre niveau', [
              { text: '🤫 Silencieux', onPress: () => setNotifLevel(0) },
              { text: '🤠 Doux (1-2/j)', onPress: () => setNotifLevel(1) },
              { text: '😤 Agressif (4-5/j)', onPress: () => setNotifLevel(2) },
              { text: '🤬 Implacable (10+/j)', onPress: () => setNotifLevel(3) },
              { text: 'Annuler', style: 'cancel' },
            ]);
          }}
        />
        <SettingsRow title="Widgets écran d'accueil" onPress={() => {}} />
        <SettingsRow title="Exiger Face ID" onPress={() => {}}>
          <Toggle
            value={state.features?.faceId || false}
            onChange={v => dispatch({ type: 'UPDATE_FEATURES', payload: { faceId: v } })}
          />
        </SettingsRow>

        {/* Features */}
        <Text style={styles.sectionLbl}>Fonctionnalités</Text>
        <SettingsRow title="Budgétisation">
          <Toggle value={state.features?.budgeting !== false} onChange={v => dispatch({ type: 'UPDATE_FEATURES', payload: { budgeting: v } })} />
        </SettingsRow>
        <SettingsRow title="Suivi des revenus">
          <Toggle value={state.features?.incomeTracking !== false} onChange={v => dispatch({ type: 'UPDATE_FEATURES', payload: { incomeTracking: v } })} />
        </SettingsRow>
        <SettingsRow title="Rapports">
          <Toggle value={state.features?.reports !== false} onChange={v => dispatch({ type: 'UPDATE_FEATURES', payload: { reports: v } })} />
        </SettingsRow>
        <SettingsRow title="Arrondir les montants">
          <Toggle value={state.features?.rounding || false} onChange={v => dispatch({ type: 'UPDATE_FEATURES', payload: { rounding: v } })} />
        </SettingsRow>
        <SettingsRow title="Gérer les récurrences" onPress={() => {}} />

        {/* Help */}
        <Text style={styles.sectionLbl}>Aide & Support</Text>
        <SettingsRow title="❓  Contacter le support" onPress={() => Alert.alert('Support', 'support@trimly.app')} />
        <SettingsRow title="🎁  Voter pour des features" onPress={() => {}} />
        <SettingsRow title="💜  À propos de l\'app" onPress={() => Alert.alert('Trimly v1.0.0', 'Budget + Abonnements en une app')} />

        {/* Danger zone */}
        <Text style={styles.sectionLbl}>Zone dangereuse</Text>
        <SettingsRow title="🌱  Nouveau départ ?" onPress={resetData} />
        <SettingsRow title="🗑️  Supprimer le compte" danger onPress={() => Alert.alert('Supprimer ?', 'Êtes-vous sûr ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Supprimer', style: 'destructive' }])} />
        <SettingsRow title="👋  Se déconnecter" danger onPress={() => Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [{ text: 'Annuler', style: 'cancel' }, { text: 'Se déconnecter', style: 'destructive' }])} />
      </ScrollView>

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribe={subscribe} />
    </SafeAreaView>
  );
}

// ── Paywall Modal ──
function PaywallModal({ visible, onClose, onSubscribe }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.paywallWrap}>
        <View style={styles.handle} />
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>✕</Text>
        </Pressable>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 56, marginBottom: 12 }}>✨</Text>
            <Text style={styles.paywallTitle}>Trimly Pro</Text>
            <Text style={styles.paywallSub}>Gérez vos finances comme un pro</Text>
          </View>

          {/* Features list */}
          <View style={styles.featureList}>
            {[
              '🔄  Abonnements illimités',
              '☠️  Death Chart 12 mois',
              '⚠️  Alertes avant prélèvement',
              '✉️  Générateur de résiliation',
              '📊  Rapports avancés',
              '👨‍👩‍👧  Partage familial',
              '🔔  Notifications intelligentes',
            ].map(f => (
              <View key={f} style={styles.featureRow}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text }}>{f}</Text>
                <Text style={{ fontSize: 16, color: Colors.green }}>✓</Text>
              </View>
            ))}
          </View>

          {/* Plans */}
          <View style={{ gap: 10, marginTop: 24 }}>
            <Pressable style={styles.planBtn} onPress={() => onSubscribe('monthly')}>
              <Text style={styles.planBtnTxt}>4,99 € / mois</Text>
            </Pressable>

            <Pressable style={[styles.planBtn, { backgroundColor: '#0F0F1A' }]} onPress={() => onSubscribe('annual')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={styles.planBtnTxt}>49,99 € / an</Text>
                <View style={{ backgroundColor: Colors.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>-17%</Text>
                </View>
              </View>
            </Pressable>

            <Pressable style={[styles.planBtn, { backgroundColor: Colors.purpleLight }]} onPress={() => onSubscribe('lifetime')}>
              <Text style={[styles.planBtnTxt, { color: Colors.purple }]}>149,99 € une fois</Text>
            </Pressable>
          </View>

          <Text style={styles.legalTxt}>Résiliable à tout moment · Paiement sécurisé · Sans engagement</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  sectionLbl: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 20, marginLeft: 2 },
  avatarWrap: { alignItems: 'center', marginBottom: 28, marginTop: 16 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarName: { fontSize: 19, fontWeight: '700', color: Colors.text },
  avatarEmail: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginTop: 4 },
  subRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, marginBottom: 8, borderWidth: 1.5 },

  // Paywall
  paywallWrap: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: 20 },
  handle: { width: 40, height: 5, backgroundColor: Colors.border, borderRadius: 100, alignSelf: 'center', marginTop: 10, marginBottom: 20 },
  closeBtn: { position: 'absolute', right: 20, top: 30, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bgSecondary, alignItems: 'center', justifyContent: 'center', zIndex: 1, borderWidth: 1, borderColor: Colors.border },
  closeTxt: { fontSize: 16, color: Colors.textSecondary },
  paywallTitle: { fontSize: 32, fontWeight: '700', color: Colors.text, letterSpacing: -0.5 },
  paywallSub: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600', marginTop: 8 },
  featureList: { backgroundColor: Colors.bgSecondary, borderRadius: 16, padding: 16, gap: 0 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  planBtn: { backgroundColor: Colors.purple, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  planBtnTxt: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  legalTxt: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});
