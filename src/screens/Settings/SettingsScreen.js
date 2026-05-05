import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Image,
  SafeAreaView, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Linking,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { PremiumHaptics } from '../../utils/haptics';
import { Fonts, Radius, Spacing, Metrics } from '../../theme';
import { SettingsRow, Toggle, PrimaryButton, SecondaryButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { requestNotificationPermissions, scheduleDailyReminders } from '../../utils/notifications';
import { supabase } from '../../utils/supabase';

const currencyOptions = ['€', '$', '£', 'MAD'];

export default function SettingsScreen() {
  const {
    state,
    dispatch,
    trialDaysLeft,
    updateProfile,
    setIncome,
    setCurrency,
    setNotifLevel,
    updateFeatures,
    setSubscriptionPlan,
  } = useApp();
  const { Colors, isDark, setTheme, userPreference } = useTheme();
  const { getCurrentLanguage, languages, t } = useLanguage();
  const [showPaywall, setShowPaywall] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [draftIncome, setDraftIncome] = useState(state.income.toString());
  const lottieRef = useRef(null);

  // Contrôler l'animation Lottie en fonction du thème
  useEffect(() => {
    if (lottieRef.current) {
      // Jouer l'animation complète dans la bonne direction
      if (isDark) {
        // Aller vers dark (de 0 à 100)
        lottieRef.current.play(0, 100);
      } else {
        // Revenir vers light (de 100 à 0)
        lottieRef.current.play(100, 0);
      }
    }
  }, [isDark]);

  const profile = useMemo(() => {
    const email = state.email || state.profile?.email || state.session?.user?.email || t('settings.yourEmail');
    const emailPrefix = email.split('@')[0];
    return {
      name: state.name || state.profile?.name || state.session?.user?.user_metadata?.full_name || emailPrefix || t('settings.user'),
      email,
    };
  }, [state.name, state.profile, state.email, state.session, t]);

  const [draftName, setDraftName] = useState(profile.name);
  const [draftEmail, setDraftEmail] = useState(profile.email);

  const notifLabels = [
    t('settings.notificationLevels.silent'),
    t('settings.notificationLevels.soft'),
    t('settings.notificationLevels.aggressive'),
    t('settings.notificationLevels.relentless')
  ];

  function openProfileEditor() {
    setDraftName(profile.name);
    setDraftEmail(profile.email);
    setShowProfileModal(true);
  }

  async function handleSetNotifLevel(level) {
    PremiumHaptics.selection();
    const ok = await setNotifLevel(level);
    if (ok) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        scheduleDailyReminders(level);
      } else if (level > 0) {
        Alert.alert(t('settings.notifications'), t('settings.notificationPermission'));
      }
    }
  }

  async function handleTestNotification() {
    PremiumHaptics.click();
    const Notifications = require('expo-notifications');
    
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert(t('settings.notifications'), t('settings.notificationPermissionDenied'));
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('notifications.title'),
        body: t('settings.notificationTest'),
        data: { type: 'test' },
      },
      trigger: null, // deliver immediately
    });
    
    Alert.alert(t('common.success'), t('common.test'));
  }

  async function subscribe(plan) {
    PremiumHaptics.success();
    const ok = await setSubscriptionPlan(plan);
    if (ok) {
      setShowPaywall(false);
      Alert.alert('Trimly Pro', t('settings.welcomePro'));
    } else {
      Alert.alert(t('common.error'), t('settings.subscriptionError'));
    }
  }

  async function saveProfile() {
    const cleanName = draftName.trim();
    const cleanEmail = draftEmail.trim().toLowerCase();
    if (!cleanName) { Alert.alert(t('settings.profile'), t('settings.nameRequired')); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert(t('settings.profile'), t('settings.emailInvalid')); return;
    }
    const ok = await updateProfile({ name: cleanName });
    if (ok) { PremiumHaptics.success(); setShowProfileModal(false); }
    else Alert.alert(t('common.error'), t('settings.profileSyncError'));
  }

  async function chooseCurrency() {
    Alert.alert(t('settings.currency'), t('settings.chooseCurrency'), [
      ...currencyOptions.map(option => ({
        text: option,
        onPress: async () => { const ok = await setCurrency(option); if (ok) PremiumHaptics.selection(); },
      })),
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  function manageSecurity() {
    const passcodeEnabled = !!state.features?.passcode;
    Alert.alert(
      t('settings.security'),
      passcodeEnabled ? t('settings.passcodeActive') : t('settings.passcodeInactive'),
      [
        {
          text: passcodeEnabled ? t('settings.disablePasscode') : t('settings.enablePasscode'),
          onPress: async () => { 
            const ok = await updateFeatures({ passcode: !passcodeEnabled });
            if (ok) PremiumHaptics.selection(); 
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  }

  async function contactSupport() {
    PremiumHaptics.click();
    const url = 'mailto:support@trimly.app?subject=Support%20Trimly';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) { Alert.alert(t('settings.support'), t('settings.noEmailApp')); return; }
      await Linking.openURL(url);
    } catch { Alert.alert(t('settings.support'), t('settings.supportError')); }
  }

  async function resetApp() {
    Alert.alert(t('settings.reset'), t('settings.resetConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { 
        text: t('settings.reset'), 
        style: 'destructive', 
        onPress: async () => { 
          try {
            // Delete from cloud if logged in
            if (state.session) {
              const { DatabaseService } = require('../../services/databaseService');
              await DatabaseService.resetAllData(state.session.user.id);
            }
            // Reset local state
            dispatch({ type: 'RESET_APP' }); 
            PremiumHaptics.impact();
          } catch (error) {
            console.error('Error resetting app:', error);
            Alert.alert(t('common.error'), t('settings.resetError'));
          }
        } 
      },
    ]);
  }

  async function logout() {
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logout'), style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.auth.signOut();
          if (error) Alert.alert(t('common.error'), error.message);
          else { dispatch({ type: 'LOG_OUT' }); PremiumHaptics.impact(); }
        },
      },
    ]);
  }

  async function handleSaveIncome() {
    const val = parseFloat(draftIncome);
    if (isNaN(val) || val < 0) { Alert.alert(t('common.error'), t('settings.invalidAmount')); return; }
    const ok = await setIncome(val);
    if (ok) { PremiumHaptics.success(); setShowIncomeModal(false); }
  }

  // ── Dynamic styles ──────────────────────────────────────────
  const s = makeStyles(Colors);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>{t('settings.title')}</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Avatar row */}
        <View style={s.avatarRow}>
          <View style={s.avatar}>
            <Image
              source={require('../../../assets/mascot.jpg')}
              style={{ width: 64, height: 64, borderRadius: 32 }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={s.avatarName}>{profile.name}</Text>
            <Text style={s.avatarEmail}>{profile.email}</Text>
          </View>
          <Pressable style={s.editBtn} onPress={openProfileEditor}>
            <Text style={s.editBtnText}>{t('common.edit')}</Text>
          </Pressable>
        </View>

        <Text style={s.sectionLbl}>{t('settings.accountSecurity')}</Text>
        <View style={s.listSection}>
          <SettingsRow title={t('settings.identity')} value={profile.name} onPress={openProfileEditor} colors={Colors} />
          <SettingsRow title={t('settings.email')} value={profile.email} onPress={openProfileEditor} colors={Colors} />
          <SettingsRow
            title={t('settings.security')}
            value={state.features?.passcode ? t('settings.codeActive') : t('settings.noCode')}
            onPress={manageSecurity}
            colors={Colors}
          />
        </View>

        <Text style={s.sectionLbl}>{t('settings.finances')}</Text>
        <View style={s.listSection}>
          <SettingsRow
            title={t('settings.income')}
            value={`${state.income.toLocaleString()} ${state.currency || '€'}`}
            onPress={() => { setDraftIncome(state.income.toString()); setShowIncomeModal(true); }}
            colors={Colors}
          />
          <SettingsRow title={t('settings.currency')} value={state.currency || '€'} onPress={chooseCurrency} colors={Colors} />
        </View>

        <Text style={s.sectionLbl}>{t('settings.subscription')}</Text>
        <Pressable onPress={() => setShowPaywall(true)} style={s.subPillRow}>
          <View style={s.subIcon}>
            <Image
              source={require('../../../assets/icon.png')}
              style={{ width: 32, height: 32 }}
              resizeMode="contain"
            />
          </View>
          <Text style={s.subPillTitle}>
            {state.subscription ? t('settings.proActive') : t('settings.trialRemaining', { days: trialDaysLeft })}
          </Text>
          <Text style={s.chevronInline}>›</Text>
        </Pressable>

        <Text style={s.sectionLbl}>{t('settings.preferences')}</Text>
        <View style={s.listSection}>
          <SettingsRow
            title={t('settings.language')}
            value={getCurrentLanguage().name}
            onPress={() => setShowLanguageModal(true)}
            colors={Colors}
          />
          
          <SettingsRow
            title={t('settings.notifications')}
            value={notifLabels[state.notifLevel ?? 0]}
            onPress={() => {
              Alert.alert(t('settings.reminders'), t('settings.frequency'), [
                { text: t('settings.notificationLevels.silent'), onPress: () => handleSetNotifLevel(0) },
                { text: t('settings.notificationLevels.soft'), onPress: () => handleSetNotifLevel(1) },
                { text: t('settings.notificationLevels.aggressive'), onPress: () => handleSetNotifLevel(2) },
                { text: t('settings.notificationLevels.relentless'), onPress: () => handleSetNotifLevel(3) },
                { text: t('common.cancel'), style: 'cancel' },
              ]);
            }}
            colors={Colors}
          />

          <SettingsRow 
            title={t('settings.testNotification')} 
            value={t('settings.sendTest')} 
            onPress={handleTestNotification} 
            colors={Colors} 
          />

          {/* ── Theme picker avec Lottie Toggle ── */}
          <View style={s.themeRow}>
            <Text style={s.themeRowLabel}>{t('settings.appearance')}</Text>
            
            {/* Animation Lottie Toggle */}
            <Pressable
              onPress={() => {
                PremiumHaptics.selection();
                // Toggle entre light et dark
                const newTheme = isDark ? 'light' : 'dark';
                setTheme(newTheme);
              }}
              style={s.lottieToggleContainer}
            >
              <LottieView
                ref={lottieRef}
                source={require('../../../assets/theme-toggle.json')}
                loop={false}
                style={s.lottieToggle}
              />
            </Pressable>
          </View>

          {/* Option système séparée */}
          <SettingsRow 
            title={t('settings.followSystem')} 
            colors={Colors}
          >
            <Toggle
              value={userPreference === 'system'}
              onChange={(v) => {
                PremiumHaptics.selection();
                setTheme(v ? 'system' : (isDark ? 'dark' : 'light'));
              }}
            />
          </SettingsRow>

          <SettingsRow title={t('settings.biometricSecurity')} colors={Colors}>
            <Toggle
              value={state.features?.faceId || false}
              onChange={v => updateFeatures({ faceId: v })}
            />
          </SettingsRow>
        </View>

        <Text style={s.sectionLbl}>{t('settings.application')}</Text>
        <View style={s.listSection}>
          <SettingsRow title={t('settings.support')} onPress={contactSupport} colors={Colors} />
          <SettingsRow title={t('settings.reset')} danger onPress={resetApp} colors={Colors} />
          <SettingsRow title={t('settings.logout')} danger onPress={logout} colors={Colors} />
        </View>

        <Text style={s.legalTxt}>{t('settings.appVersion')}</Text>
      </ScrollView>

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} onSubscribe={subscribe} Colors={Colors} />
      <ProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        draftName={draftName}
        setDraftName={setDraftName}
        draftEmail={draftEmail}
        setDraftEmail={setDraftEmail}
        onSave={saveProfile}
        Colors={Colors}
      />
      <IncomeModal
        visible={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        draftIncome={draftIncome}
        setDraftIncome={setDraftIncome}
        onSave={handleSaveIncome}
        currency={state.currency || '€'}
        Colors={Colors}
      />
      <LanguageModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────

function LanguageModal({ visible, onClose, Colors }) {
  const { locale, changeLanguage, languages, t } = useLanguage();
  const s = makeStyles(Colors);

  const handleLanguageSelect = async (languageCode) => {
    await changeLanguage(languageCode);
    PremiumHaptics.selection();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.profileCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('settings.selectLanguage')}</Text>
            <SecondaryButton onPress={onClose} label="×" style={s.modalCloseBtn} />
          </View>
          <View style={{ gap: 12 }}>
            {languages.map((language) => (
              <Pressable
                key={language.code}
                style={[
                  s.languageOption,
                  locale === language.code && s.languageOptionActive,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
              >
                <Text style={s.languageFlag}>{language.flag}</Text>
                <Text style={[
                  s.languageName,
                  locale === language.code && s.languageNameActive,
                ]}>
                  {language.name}
                </Text>
                {locale === language.code && (
                  <Text style={s.languageCheck}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function IncomeModal({ visible, onClose, draftIncome, setDraftIncome, onSave, currency, Colors }) {
  const { t } = useLanguage();
  const s = makeStyles(Colors);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.profileCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('settings.income')}</Text>
            <SecondaryButton onPress={onClose} label="×" style={s.modalCloseBtn} />
          </View>
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>{t('settings.amount', { currency })}</Text>
            <TextInput
              value={draftIncome}
              onChangeText={setDraftIncome}
              style={s.input}
              placeholder={t('settings.amountPlaceholder')}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              autoFocus
            />
          </View>
          <PrimaryButton onPress={onSave} label={t('settings.updateBudget')} style={{ marginTop: Spacing.md }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProfileModal({ visible, onClose, draftName, setDraftName, draftEmail, setDraftEmail, onSave, Colors }) {
  const { t } = useLanguage();
  const s = makeStyles(Colors);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.profileCard}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{t('settings.editProfile')}</Text>
            <SecondaryButton onPress={onClose} label="×" style={s.modalCloseBtn} />
          </View>
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>{t('settings.name')}</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={s.input}
              placeholder={t('settings.yourName')}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>{t('settings.email')}</Text>
            <TextInput
              value={draftEmail}
              onChangeText={setDraftEmail}
              style={s.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={t('settings.yourEmail')}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <PrimaryButton onPress={onSave} label={t('common.save')} style={{ marginTop: Spacing.md }} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PaywallModal({ visible, onClose, onSubscribe, Colors }) {
  const { t } = useLanguage();
  const s = makeStyles(Colors);
  
  const features = [
    t('settings.paywall.unlimitedSubs'),
    t('settings.paywall.predictiveAnalysis'),
    t('settings.paywall.smartAlerts'),
    t('settings.paywall.accountingExports')
  ];
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.paywallWrap}>
        <View style={s.handle} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 40 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={s.paywallLogo}>
              <Image
                source={require('../../../assets/icon.png')}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
              />
            </View>
            <Text style={s.paywallTitle}>{t('settings.paywall.title')}</Text>
            <Text style={s.paywallSub}>{t('settings.paywall.subtitle')}</Text>
          </View>
          <View style={s.featureGrid}>
            {features.map(f => (
              <View key={f} style={s.featureItem}>
                <Text style={s.featureCheck}>✓</Text>
                <Text style={s.featureLabel}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 12, marginTop: 40 }}>
            <Pressable style={s.planBtn} onPress={() => onSubscribe('annual')}>
              <Text style={s.planTitle}>{t('settings.paywall.annualPlan')}</Text>
              <Text style={s.planPrice}>{t('settings.paywall.annualPrice')}</Text>
            </Pressable>
            <Pressable style={[s.planBtn, s.planBtnSec]} onPress={() => onSubscribe('monthly')}>
              <Text style={[s.planTitle, { color: Colors.text }]}>{t('settings.paywall.monthlyPlan')}</Text>
              <Text style={[s.planPrice, { color: Colors.textSecondary }]}>{t('settings.paywall.monthlyPrice')}</Text>
            </Pressable>
          </View>
          <Pressable onPress={onClose} style={s.paywallClose}>
            <Text style={s.paywallCloseText}>{t('settings.paywall.later')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Style factory ─────────────────────────────────────────────
function makeStyles(Colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    header: { 
      paddingHorizontal: Metrics.screenPadding, 
      paddingBottom: Spacing.md, 
      paddingTop: Metrics.headerTop,
    },
    title: { ...Fonts.primary, ...Fonts.black, fontSize: 24, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: Metrics.screenPadding, paddingBottom: Metrics.fabBottom },

    avatarRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.xl },
    avatar: {
      width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.surfaceAlt,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
      overflow: 'hidden',
    },
    avatarName: { ...Fonts.primary, ...Fonts.bold, fontSize: 18, color: Colors.text },
    avatarEmail: { ...Fonts.primary, fontSize: 13, color: Colors.textMuted, marginTop: 2 },
    editBtn: {
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.sm,
      backgroundColor: Colors.surface, minHeight: Metrics.minTouch, justifyContent: 'center',
    },
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
      flex: 1, backgroundColor: Colors.backdrop,
      justifyContent: 'center', paddingHorizontal: Metrics.screenPadding,
    },
    profileCard: {
      backgroundColor: Colors.surface, borderRadius: Radius.xl,
      padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderStrong,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
    modalTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 18, color: Colors.text },
    modalCloseBtn: { width: 40, height: 40, borderRadius: 20 },
    fieldBlock: { marginBottom: Spacing.md },
    fieldLabel: {
      ...Fonts.primary, ...Fonts.bold, fontSize: 12, color: Colors.textSecondary,
      marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6,
    },
    input: {
      ...Fonts.primary, fontSize: 15, color: Colors.text,
      backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.borderStrong,
      borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12,
    },

    paywallWrap: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: Metrics.screenPadding },
    handle: { width: 36, height: 4, backgroundColor: Colors.borderStrong, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
    paywallLogo: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface,
      alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    paywallTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 32, color: Colors.text, textTransform: 'uppercase' },
    paywallSub: { ...Fonts.primary, fontSize: 15, color: Colors.textSecondary, marginTop: 8 },
    featureGrid: { gap: 14, marginTop: 24 },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureCheck: { color: Colors.text, ...Fonts.black, fontSize: 16 },
    featureLabel: { ...Fonts.primary, fontSize: 15, color: Colors.textSecondary },

    planBtn: {
      backgroundColor: Colors.accent, borderRadius: Radius.md,
      padding: Spacing.mdLg, alignItems: 'center', minHeight: 72, justifyContent: 'center',
    },
    planBtnSec: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
    planTitle: { color: Colors.pureWhite, ...Fonts.primary, ...Fonts.bold, fontSize: 16 },
    planPrice: { color: Colors.textSecondary, ...Fonts.primary, fontSize: 13, marginTop: 4 },

    paywallClose: { marginTop: 20, padding: 16, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
    paywallCloseText: { ...Fonts.primary, fontSize: 14, color: Colors.textMuted },
    legalTxt: { ...Fonts.primary, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 48 },

    // ── Language picker ──────────────────────────────────────
    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: Radius.md,
      backgroundColor: Colors.surfaceAlt,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    languageOptionActive: {
      backgroundColor: Colors.accentSoft,
      borderColor: Colors.accent,
    },
    languageFlag: {
      fontSize: 28,
      marginRight: 12,
    },
    languageName: {
      flex: 1,
      ...Fonts.primary,
      ...Fonts.medium,
      fontSize: 16,
      color: Colors.text,
    },
    languageNameActive: {
      ...Fonts.bold,
      color: Colors.text,
    },
    languageCheck: {
      fontSize: 18,
      color: Colors.accent,
      ...Fonts.bold,
    },

    // ── Theme picker ──────────────────────────────────────
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      minHeight: 60,
    },
    themeRowLabel: {
      ...Fonts.primary, ...Fonts.medium, fontSize: 15, color: Colors.text,
    },
    lottieToggleContainer: {
      width: 60,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -8,
    },
    lottieToggle: {
      width: 70,
      height: 70,
    },
    themeSegment: {
      flexDirection: 'row',
      backgroundColor: Colors.surfaceAlt,
      borderRadius: Radius.md,
      padding: 3,
      gap: 2,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: Radius.sm,
    },
    themeOptionActive: {
      backgroundColor: Colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    themeOptionIcon: {
      fontSize: 13,
      color: Colors.textMuted,
    },
    themeOptionIconActive: {
      color: Colors.text,
    },
    themeOptionLabel: {
      ...Fonts.primary, ...Fonts.semiBold, fontSize: 12,
      color: Colors.textMuted,
    },
    themeOptionLabelActive: {
      color: Colors.text,
    },
  });
}
