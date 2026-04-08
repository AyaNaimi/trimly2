import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import { PremiumHaptics } from '../../utils/haptics';
import { Colors, Fonts, Radius, Spacing, Metrics } from '../../theme';
import { SettingsRow, Toggle, PrimaryButton, SecondaryButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { scheduleDailyReminders } from '../../utils/notifications';
import { supabase } from '../../utils/supabase';

const notifLabels = ['Silencieux', 'Doux', 'Agressif', 'Implacable'];
const currencyOptions = ['€', '$', '£', 'MAD'];

export default function SettingsScreen() {
  const { 
    state, 
    dispatch, 
    trialDaysLeft, 
    updateProfile,
    setIncome,
    setCurrency,
    setNotifLevel
  } = useApp();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const profile = useMemo(() => ({
    name: state.name || state.profile?.name || 'Utilisateur Trimly',
    email: state.email || state.profile?.email || state.session?.user?.email || 'votre@email.com',
  }), [state.name, state.profile, state.email, state.session]);

  const [draftName, setDraftName] = useState(profile.name);
  const [draftEmail, setDraftEmail] = useState(profile.email);

  function openProfileEditor() {
    setDraftName(profile.name);
    setDraftEmail(profile.email);
    setShowProfileModal(true);
  }

  async function handleSetNotifLevel(level) {
    PremiumHaptics.selection();
    const ok = await setNotifLevel(level);
    if (ok) scheduleDailyReminders(level);
  }

  function subscribe(plan) {
    PremiumHaptics.success();
    dispatch({ type: 'SET_SUBSCRIPTION_PLAN', payload: plan });
    setShowPaywall(false);
    Alert.alert('Trimly Pro', 'Bienvenue dans votre nouvel espace.');
  }

  async function saveProfile() {
    const cleanName = draftName.trim();
    const cleanEmail = draftEmail.trim().toLowerCase();

    if (!cleanName) {
      Alert.alert('Profil', 'Le nom ne peut pas etre vide.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert('Profil', 'Veuillez saisir une adresse email valide.');
      return;
    }

    const ok = await updateProfile({ name: cleanName });
    if (ok) {
      PremiumHaptics.success();
      setShowProfileModal(false);
    } else {
      Alert.alert('Erreur', 'Impossible de synchroniser le profil.');
    }
  }

  async function chooseCurrency() {
    Alert.alert(
      'Devise',
      'Choisissez votre devise principale.',
      [
        ...currencyOptions.map(option => ({
          text: option,
          onPress: async () => {
            const ok = await setCurrency(option);
            if (ok) PremiumHaptics.selection();
          },
        })),
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  }

  function manageSecurity() {
    const passcodeEnabled = !!state.features?.passcode;
    Alert.alert(
      'Securite',
      passcodeEnabled ? 'Le code d acces est actuellement actif.' : 'Aucun code d acces n est configure.',
      [
        {
          text: passcodeEnabled ? 'Desactiver le code' : 'Activer le code',
          onPress: () => {
            dispatch({ type: 'UPDATE_FEATURES', payload: { passcode: !passcodeEnabled } });
            PremiumHaptics.selection();
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  }

  async function contactSupport() {
    PremiumHaptics.click();
    const url = 'mailto:support@trimly.app?subject=Support%20Trimly';

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert('Support', 'Aucune application email n est disponible sur cet appareil.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Support', 'Impossible d ouvrir le support pour le moment.');
    }
  }

  function resetApp() {
    Alert.alert(
      'Reinitialiser',
      'Cette action supprime vos categories, transactions et abonnements. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Reinitialiser',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'RESET_APP' });
            PremiumHaptics.impact();
          },
        },
      ],
    );
  }

  async function logout() {
    Alert.alert(
      'Deconnexion',
      'Souhaitez-vous vraiment vous deconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se deconnecter',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Erreur', error.message);
            } else {
              dispatch({ type: 'LOG_OUT' });
              PremiumHaptics.impact();
            }
          },
        },
      ],
    );
  }

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [draftIncome, setDraftIncome] = useState(state.income.toString());

  async function handleSaveIncome() {
    const val = parseFloat(draftIncome);
    if (isNaN(val) || val < 0) {
      Alert.alert('Erreur', 'Veuillez saisir un montant valide.');
      return;
    }
    const ok = await setIncome(val);
    if (ok) {
      PremiumHaptics.success();
      setShowIncomeModal(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Parametres</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 24 }}>✦</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.avatarName}>{profile.name}</Text>
            <Text style={styles.avatarEmail}>{profile.email}</Text>
          </View>
          <Pressable style={styles.editBtn} onPress={openProfileEditor}>
            <Text style={styles.editBtnText}>Modifier</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLbl}>Compte et securite</Text>
        <View style={styles.listSection}>
          <SettingsRow title="Identite" value={profile.name} onPress={openProfileEditor} />
          <SettingsRow title="Email" value={profile.email} onPress={openProfileEditor} />
          <SettingsRow
            title="Securite"
            value={state.features?.passcode ? 'Code actif' : 'Aucun code'}
            onPress={manageSecurity}
          />
        </View>

        <Text style={styles.sectionLbl}>Finances</Text>
        <View style={styles.listSection}>
          <SettingsRow 
            title="Revenu Mensuel" 
            value={`${state.income.toLocaleString()} ${state.currency || '€'}`} 
            onPress={() => {
              setDraftIncome(state.income.toString());
              setShowIncomeModal(true);
            }} 
          />
          <SettingsRow title="Devise Principale" value={state.currency || '€'} onPress={chooseCurrency} />
        </View>

        <Text style={styles.sectionLbl}>Abonnement</Text>
        <Pressable onPress={() => setShowPaywall(true)} style={styles.subPillRow}>
          <View style={[styles.subIcon, { backgroundColor: Colors.accent }]}>
            <Text style={{ fontSize: 14, color: Colors.white }}>♦</Text>
          </View>
          <Text style={styles.subPillTitle}>
            {state.subscription ? 'Trimly Pro actif' : `Essai : ${trialDaysLeft}j restants`}
          </Text>
          <Text style={styles.chevronInline}>›</Text>
        </Pressable>

        <Text style={styles.sectionLbl}>Preferences</Text>
        <View style={styles.listSection}>
          <SettingsRow
            title="Notifications"
            value={notifLabels[state.notifLevel ?? 0]}
            onPress={() => {
              Alert.alert('Rappels', 'Frequence', [
                { text: 'Silencieux', onPress: () => handleSetNotifLevel(0) },
                { text: 'Doux', onPress: () => handleSetNotifLevel(1) },
                { text: 'Agressif', onPress: () => handleSetNotifLevel(2) },
                { text: 'Implacable', onPress: () => handleSetNotifLevel(3) },
                { text: 'Annuler', style: 'cancel' },
              ]);
            }}
          />
          <SettingsRow title="Securite biometrique">
            <Toggle
              value={state.features?.faceId || false}
              onChange={v => dispatch({ type: 'UPDATE_FEATURES', payload: { faceId: v } })}
            />
          </SettingsRow>
        </View>

        <Text style={styles.sectionLbl}>Application</Text>
        <View style={styles.listSection}>
          <SettingsRow title="Support" onPress={contactSupport} />
          <SettingsRow title="Reinitialiser" danger onPress={resetApp} />
          <SettingsRow title="Deconnexion" danger onPress={logout} />
        </View>

        <Text style={styles.legalTxt}>Trimly v1.3 • Minimal Excellence</Text>
      </ScrollView>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribe={subscribe} />
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        draftName={draftName}
        setDraftName={setDraftName}
        draftEmail={draftEmail}
        setDraftEmail={setDraftEmail}
        onSave={saveProfile}
      />
      <IncomeModal
        visible={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        draftIncome={draftIncome}
        setDraftIncome={setDraftIncome}
        onSave={handleSaveIncome}
        currency={state.currency || '€'}
      />
    </SafeAreaView>
  );
}

function IncomeModal({ visible, onClose, draftIncome, setDraftIncome, onSave, currency }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.profileCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Revenu Mensuel</Text>
            <SecondaryButton onPress={onClose} label="×" style={styles.modalCloseBtn} />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Montant ({currency})</Text>
            <TextInput
              value={draftIncome}
              onChangeText={setDraftIncome}
              style={styles.input}
              placeholder="Ex: 3000"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          </View>

          <PrimaryButton onPress={onSave} label="Mettre a jour le budget" style={{ marginTop: Spacing.md }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProfileModal({
  visible, onClose, draftName, setDraftName, draftEmail, setDraftEmail, onSave,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.profileCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <SecondaryButton onPress={onClose} label="×" style={styles.modalCloseBtn} />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Nom</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
              placeholder="Votre nom"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              value={draftEmail}
              onChangeText={setDraftEmail}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="vous@email.com"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <PrimaryButton onPress={onSave} label="Enregistrer" style={{ marginTop: Spacing.md }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PaywallModal({ visible, onClose, onSubscribe }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.paywallWrap}>
        <View style={styles.handle} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 40 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={styles.paywallLogo}>
              <Text style={{ fontSize: 32 }}>♦</Text>
            </View>
            <Text style={styles.paywallTitle}>Trimly Pro</Text>
            <Text style={styles.paywallSub}>Le luxe de la clarte financiere.</Text>
          </View>

          <View style={styles.featureGrid}>
            {[
              'Abonnements illimites',
              'Analyses predictives',
              'Alertes intelligentes',
              'Exports comptables',
            ].map(f => (
              <View key={f} style={styles.featureItem}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureLabel}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={{ gap: 12, marginTop: 40 }}>
            <Pressable style={styles.planBtn} onPress={() => onSubscribe('annual')}>
              <Text style={styles.planTitle}>Plan Annuel</Text>
              <Text style={styles.planPrice}>49,99 € / an</Text>
            </Pressable>
            <Pressable style={[styles.planBtn, styles.planBtnSec]} onPress={() => onSubscribe('monthly')}>
              <Text style={[styles.planTitle, { color: Colors.text }]}>Plan Mensuel</Text>
              <Text style={[styles.planPrice, { color: Colors.textSecondary }]}>4,99 € / mois</Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} style={styles.paywallClose}>
            <Text style={styles.paywallCloseText}>Plus tard</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Metrics.screenPadding, paddingBottom: Spacing.md, paddingTop: Metrics.headerTop },
  title: { ...Fonts.primary, ...Fonts.black, fontSize: 28, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Metrics.screenPadding, paddingBottom: Metrics.fabBottom },

  avatarRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
  avatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  avatarName: { ...Fonts.primary, ...Fonts.bold, fontSize: 18, color: Colors.text },
  avatarEmail: { ...Fonts.primary, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.sm, backgroundColor: Colors.surface, minHeight: Metrics.minTouch, justifyContent: 'center' },
  editBtnText: { ...Fonts.primary, ...Fonts.bold, fontSize: 12, color: Colors.textSecondary },

  sectionLbl: {
    ...Fonts.primary, fontSize: 11, ...Fonts.black, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 24, marginLeft: 4,
  },
  listSection: { backgroundColor: 'transparent' },

  subPillRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, minHeight: 64,
    backgroundColor: Colors.accentSoft, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  subIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  subPillTitle: { flex: 1, marginLeft: 12, ...Fonts.primary, fontSize: 15, ...Fonts.semiBold, color: Colors.text },
  chevronInline: { fontSize: 18, color: Colors.textMuted },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    justifyContent: 'center',
    paddingHorizontal: Metrics.screenPadding,
  },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 18, color: Colors.text },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 20 },
  fieldBlock: { marginBottom: Spacing.md },
  fieldLabel: { ...Fonts.primary, ...Fonts.bold, fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  input: {
    ...Fonts.primary,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  paywallWrap: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Metrics.screenPadding },
  handle: { width: 36, height: 4, backgroundColor: Colors.borderStrong, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  paywallLogo: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  paywallTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 32, color: Colors.text, textTransform: 'uppercase' },
  paywallSub: { ...Fonts.primary, fontSize: 15, color: Colors.textSecondary, marginTop: 8 },
  featureGrid: { gap: 14, marginTop: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureCheck: { color: Colors.text, ...Fonts.black, fontSize: 16 },
  featureLabel: { ...Fonts.primary, fontSize: 15, color: Colors.textSecondary },

  planBtn: { backgroundColor: Colors.accent, borderRadius: Radius.md, padding: Spacing.mdLg, alignItems: 'center', minHeight: 72, justifyContent: 'center' },
  planBtnSec: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  planTitle: { color: Colors.white, ...Fonts.primary, ...Fonts.bold, fontSize: 16 },
  planPrice: { color: 'rgba(255,255,255,0.7)', ...Fonts.primary, fontSize: 13, marginTop: 4 },

  paywallClose: { marginTop: 20, padding: 16, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  paywallCloseText: { ...Fonts.primary, fontSize: 14, color: Colors.textMuted },
  legalTxt: { ...Fonts.primary, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 48 },
});
