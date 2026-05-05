import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../utils/supabase';
import { Fonts, Radius, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { EmailService } from '../../services/emailService';
import { getStoredGoogleProviderTokens } from '../../services/googleAuthService';

const addAlpha = (hex, opacity) => {
  if (!hex) return 'transparent';
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized.split('').map(c => c + c).join('');
  }
  const op = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${normalized}${op}`;
};

export default function EmailScannerModal({
  visible,
  onClose,
  onImport,
  initialEmail = '',
  autoPrompt = false,
  existingSubscriptionNames = [],
}) {
  const { Colors } = useTheme();
  const {
    state,
    pendingDetectedSubscriptions,
    saveEmailScanResult,
    importDetectedSubscription,
    dismissDetectedSubscription,
  } = useApp();

  const [step, setStep] = useState('choose');
  const [provider, setProvider] = useState(null);
  const [userEmail, setUserEmail] = useState(initialEmail);
  const [appPassword, setAppPassword] = useState('');
  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;

    setStep('choose');
    setProvider(null);
    setUserEmail(initialEmail || '');
    setAppPassword('');
    setFound([]);
    setSelected(new Set());
    setLogs([]);
    setLoading(false);
    setError(null);
  }, [visible, initialEmail]);

  const pendingForReview = useMemo(
    () => (pendingDetectedSubscriptions || []).filter((item) => item && item.status === 'pending'),
    [pendingDetectedSubscriptions]
  );

  const total = useMemo(
    () =>
      found
        .filter((_, index) => selected.has(index))
        .reduce((sum, item) => sum + (Number(item.displayAmount ?? item.amount) || 0), 0),
    [found, selected]
  );

  const providerChoices = EmailService.getProviderChoices();

  const addLog = (message) => {
    console.log('[ScannerLog]', message);
    setLogs((prev) => [...prev, message]);
  };

  const resetAndClose = () => {
    setStep('choose');
    setProvider(null);
    setAppPassword('');
    setFound([]);
    setSelected(new Set());
    setLogs([]);
    setLoading(false);
    setError(null);
    onClose();
  };

  const openReview = (items) => {
    setFound(items);
    setSelected(new Set(items.map((_, index) => index)));
    setStep('review');
  };

  const buildFriendlyNetworkError = (scanError) => {
    const message = scanError?.message || 'Erreur inconnue';

    if (message.includes('Network request failed')) {
      return "Impossible de joindre le service de scan. Vérifiez l'URL du backend ou l'adresse IP de votre machine.";
    }

    if (message.includes('timed out')) {
      return "Le scan a démarré mais a dépassé le délai. Vérifiez les logs du backend email-scanner ou testez avec moins d'emails.";
    }

    return message;
  };

  const formatResultDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatCycleLabel = (cycle) =>
    ({
      weekly: 'hebdo',
      monthly: 'mensuel',
      quarterly: 'trimestriel',
      annual: 'annuel',
    }[cycle] || cycle || 'mensuel');

  const getResultPrimaryLine = (item) => {
    const statusText = item.statusLabel || (item.isTrialActive ? 'Essai gratuit actif' : 'Abonnement actif');
    return [item.category || 'Autre', formatCycleLabel(item.cycle), statusText].filter(Boolean).join(' • ');
  };

  const getResultSecondaryLine = (item) => {
    const parts = [];
    const source = item.sourceFrom || item.sourceEmail || userEmail;

    if (source) {
      parts.push(source);
    }

    if (item.nextChargeDate) {
      parts.push(`${item.isTrialActive ? 'Facturation le' : 'Prochain débit'} ${formatResultDate(item.nextChargeDate)}`);
    }

    if (Number(item.nextChargeAmount) > 0) {
      parts.push(`${Number(item.nextChargeAmount).toFixed(2)} EUR`);
    }

    return parts.join(' • ');
  };

  const getConfidenceColor = (item) => {
    if (item.reviewStatus === 'confirmed') return '#166534';
    if (item.reviewStatus === 'probable') return '#B45309';
    return '#B91C1C';
  };

  const getConfidenceBg = (item) => {
    if (item.reviewStatus === 'confirmed') return '#DCFCE7';
    if (item.reviewStatus === 'probable') return '#FEF3C7';
    return '#FEE2E2';
  };

  const getStoredConnectionForProvider = (selectedProvider, email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    return (state.emailConnections || []).find((item) => {
      if (!item || item.provider !== selectedProvider) return false;
      if (!normalizedEmail) return item.status === 'connected';
      return String(item.email || '').trim().toLowerCase() === normalizedEmail;
    });
  };

  const getGoogleTokensForScan = async (session) => {
    const liveTokens = {
      accessToken: session?.provider_token || null,
      refreshToken: session?.provider_refresh_token || null,
    };

    if (liveTokens.accessToken || liveTokens.refreshToken) {
      return liveTokens;
    }

    const storedTokens = await getStoredGoogleProviderTokens();
    if (storedTokens?.accessToken || storedTokens?.refreshToken) {
      return {
        accessToken: storedTokens.accessToken || null,
        refreshToken: storedTokens.refreshToken || null,
      };
    }

    const savedConnection = getStoredConnectionForProvider('gmail', session?.user?.email);
    if (savedConnection?.access_token || savedConnection?.refresh_token) {
      return {
        accessToken: savedConnection.access_token || null,
        refreshToken: savedConnection.refresh_token || null,
      };
    }

    return {
      accessToken: null,
      refreshToken: null,
    };
  };

  const startOAuthScan = async (selectedProvider) => {
    setProvider(selectedProvider);
    setLoading(true);
    setError(null);
    setLogs([]);
    setStep('scanning');

    addLog(`Scan avec ${selectedProvider}...`);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Connectez-vous d'abord à votre compte.");
      }

      if (selectedProvider !== 'gmail') {
        throw new Error('Seul le scan Gmail via Google est configuré pour le moment.');
      }

      const mailboxEmail = (session.user.email || '').trim().toLowerCase();
      const { accessToken, refreshToken } = await getGoogleTokensForScan(session);

      if (!accessToken && !refreshToken) {
        throw new Error("Aucun jeton Gmail trouvé. Connectez-vous avec Google puis réessayez.");
      }

      setUserEmail(mailboxEmail);
      addLog(`Boite Gmail: ${mailboxEmail}`);
      addLog('Lecture des emails via Gmail API...');

      let providerProfile = {
        email: mailboxEmail,
        providerUserId: null,
      };

      if (accessToken) {
        try {
          providerProfile = await EmailService.fetchProviderProfile('gmail', accessToken);
        } catch (profileError) {
          console.warn('Unable to fetch Gmail profile from provider token:', profileError);
        }
      }

      const scanResult = await EmailService.runProviderScan({
        provider: selectedProvider,
        email: providerProfile.email || mailboxEmail,
        accessToken,
        refreshToken,
        existingNames: existingSubscriptionNames,
      });

      addLog(`${scanResult.raw?.matchedEmailCount || scanResult.emailCount || 0} emails pertinents trouvés`);
      addLog(`${scanResult.emailCount || 0} emails analysés en détail`);
      addLog(`${scanResult.subscriptions.length} abonnements trouvés`);

      const persisted = await saveEmailScanResult({
        provider: selectedProvider,
        sourceEmail: providerProfile.email || mailboxEmail,
        connection: {
          provider: selectedProvider,
          email: scanResult.raw?.connection?.email || providerProfile.email || mailboxEmail,
          providerUserId: scanResult.raw?.connection?.providerUserId || providerProfile.providerUserId,
          accessToken: scanResult.raw?.connection?.accessToken || accessToken,
          refreshToken: scanResult.raw?.connection?.refreshToken || refreshToken,
          scopes: scanResult.raw?.connection?.scopes || ['https://www.googleapis.com/auth/gmail.readonly'],
          status: 'connected',
        },
        emailsScanned: scanResult.emailCount || 0,
        items: scanResult.subscriptions,
        metadata: {
          mode: 'gmail-api',
          connectionSource: scanResult.raw?.connection?.source || 'google-oauth',
          matchedEmailCount: scanResult.raw?.matchedEmailCount || scanResult.emailCount || 0,
        },
      });

      openReview(persisted?.detectedSubscriptions || scanResult.subscriptions);
    } catch (scanError) {
      console.error('Scan Error:', scanError);
      setError(scanError.message || 'Erreur inconnue');
      addLog(`Erreur: ${scanError.message}`);
      setStep('choose');
    } finally {
      setLoading(false);
    }
  };

  const startManualScan = async () => {
    const email = userEmail.trim().toLowerCase();
    const password = appPassword.replace(/\s/g, '');

    if (!email) {
      setError('Veuillez renseigner une adresse email.');
      PremiumHaptics.error();
      return;
    }

    if (!password) {
      setError('Veuillez renseigner un App Password Gmail.');
      PremiumHaptics.error();
      return;
    }

    setProvider('manual');
    setLoading(true);
    setError(null);
    setLogs([]);
    setStep('scanning');

    addLog(`Boite mail cible: ${email}`);
    addLog('Connexion au scanner local...');

    try {
      const scanResult = await EmailService.runManualScan({
        email,
        appPassword: password,
        existingNames: existingSubscriptionNames,
      });

      const persisted = await saveEmailScanResult({
        provider: 'manual',
        sourceEmail: email,
        connection: {
          provider: 'manual',
          email,
          status: 'connected',
        },
        emailsScanned: scanResult.emailCount,
        items: scanResult.subscriptions,
        metadata: { mode: 'local-imap' },
      });

      addLog(`${scanResult.emailCount} emails analysés`);
      addLog(`${scanResult.subscriptions.length} abonnements détectés`);

      openReview(persisted?.detectedSubscriptions || scanResult.subscriptions);
    } catch (scanError) {
      console.error('Scan Error:', scanError);
      const friendlyError = buildFriendlyNetworkError(scanError);
      setError(friendlyError);
      addLog(`Erreur: ${friendlyError}`);

      await saveEmailScanResult({
        provider: 'manual',
        sourceEmail: email,
        connection: {
          provider: 'manual',
          email,
          status: 'error',
        },
        emailsScanned: 0,
        items: [],
        errorMessage: friendlyError,
        metadata: { mode: 'local-imap' },
      });

      setStep('manual');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index) => {
    const next = new Set(selected);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelected(next);
    PremiumHaptics.selection();
  };

  const handleImport = async () => {
    const selectedItems = found.filter((_, index) => selected.has(index));
    const skippedItems = found.filter((_, index) => !selected.has(index));

    if (!selectedItems.length && !skippedItems.length) {
      resetAndClose();
      return;
    }

    setLoading(true);

    try {
      let importedCount = 0;

      for (const item of selectedItems) {
        let success = false;

        if (item.id) {
          success = await importDetectedSubscription(item);
        } else if (onImport) {
          success = await onImport(item);
        }

        if (success) importedCount += 1;
      }

      for (const item of skippedItems) {
        if (item.id) {
          await dismissDetectedSubscription(item.id);
        }
      }

      PremiumHaptics.success();
      Alert.alert('Succès', `${importedCount} abonnements importés dans Trimly.`, [
        { text: 'Fermer', onPress: resetAndClose },
      ]);
    } catch (importError) {
      console.error('Import error:', importError);
      setError(importError.message || "Impossible d'importer les abonnements.");
    } finally {
      setLoading(false);
    }
  };

  const renderChooseStep = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentBody}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Flow hybride</Text>
        <Text style={styles.heroTitle}>
          {autoPrompt ? 'Connectez votre boite mail' : 'Détectez vos abonnements'}
        </Text>
        <Text style={styles.heroText}>
          Trimly peut scanner Gmail via Google OAuth ou utiliser un scan manuel local pour retrouver vos abonnements avant import.
        </Text>
      </View>

      {pendingForReview.length > 0 ? (
        <TouchableOpacity
          style={styles.pendingCard}
          onPress={() => openReview(pendingForReview)}
          activeOpacity={0.85}
        >
          <Text style={styles.pendingTitle}>Détections en attente</Text>
          <Text style={styles.pendingText}>
            {pendingForReview.length} abonnements attendent votre validation.
          </Text>
        </TouchableOpacity>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.choiceList}>
        {providerChoices.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.choiceCard}
            activeOpacity={0.85}
            onPress={() => {
              PremiumHaptics.selection();
              if (item.key === 'manual') setStep('manual');
              else startOAuthScan(item.key);
            }}
          >
            <View style={[styles.choiceIconWrap, { backgroundColor: addAlpha(item.color, 0.12) }]}>
              <Text style={styles.choiceIcon}>{item.icon}</Text>
            </View>
            <View style={styles.choiceTextWrap}>
              <Text style={styles.choiceTitle}>{item.name}</Text>
              <Text style={styles.choiceText}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderManualStep = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentBody}>
      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Configuration IMAP</Text>
        <Text style={styles.heroTitle}>Scan manuel Gmail</Text>
        <Text style={styles.heroText}>
          Utilisez un "Mot de passe d'application" Google pour permettre à Trimly de lire vos emails de facturation en toute sécurité.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>Adresse Email</Text>
        <TextInput
          style={styles.input}
          value={userEmail}
          onChangeText={setUserEmail}
          placeholder="votre@email.com"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>App Password Gmail</Text>
        <TextInput
          style={styles.input}
          value={appPassword}
          onChangeText={setAppPassword}
          placeholder="xxxx xxxx xxxx xxxx"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? (
          <View style={[styles.errorBox, { marginTop: 16 }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={startManualScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.pureWhite} />
          ) : (
            <Text style={styles.primaryButtonText}>Démarrer le scan manuel</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={() => setStep('choose')}>
        <Text style={styles.secondaryButtonText}>Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderScanningStep = () => (
    <View style={styles.scanningContainer}>
      <ActivityIndicator size="large" color={Colors.text} />
      <Text style={styles.scanningTitle}>Analyse en cours...</Text>
      <Text style={styles.scanningText}>
        Nous parcourons vos emails récents pour identifier les factures et confirmations d'abonnement.
      </Text>

      <View style={styles.logsCard}>
        <ScrollView>
          {logs.map((log, i) => (
            <Text key={i} style={styles.logLine}>
              • {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderReviewStep = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryValue}>{found.length}</Text>
          <Text style={styles.summaryLabel}>Détectés</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.summaryValue}>{total.toFixed(2)}€</Text>
          <Text style={styles.summaryLabel}>Total mensuel</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.resultList}>
        {found.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Rien trouvé</Text>
            <Text style={styles.emptyText}>
              Aucun abonnement n'a été détecté dans les emails analysés. Essayez une autre période ou un autre compte.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep('choose')}>
              <Text style={styles.primaryButtonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {found.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.resultCard, selected.has(index) && styles.resultCardSelected]}
                onPress={() => toggleItem(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, selected.has(index) && styles.checkboxActive]}>
                  {selected.has(index) && <Text style={styles.checkboxMark}>✓</Text>}
                </View>

                <View style={styles.resultIconWrap}>
                  <Text style={styles.resultIcon}>{item.emoji || '💳'}</Text>
                </View>

                <View style={styles.resultTextWrap}>
                  <Text style={styles.resultTitle}>{item.name}</Text>
                  <View style={styles.resultBadgeRow}>
                    <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceBg(item) }]}>
                      <Text style={[styles.confidenceBadgeText, { color: getConfidenceColor(item) }]}>
                        {item.confidenceLabel || 'Probable'}
                      </Text>
                    </View>
                    {item.confidence ? (
                      <Text style={styles.confidenceValue}>{Math.round(Number(item.confidence) * 100)}%</Text>
                    ) : null}
                  </View>
                  <Text style={styles.resultStatusText}>{getResultPrimaryLine(item)}</Text>
                  <Text style={styles.resultSubtitle} />
                  {item.sourceSubject ? <Text style={styles.resultSourceSubject}>{item.sourceSubject}</Text> : null}
                  <Text style={styles.resultMeta}>{getResultSecondaryLine(item)}</Text>
                  {item.alternatives?.length ? (
                    <Text style={styles.resultAltText}>Alternatives: {item.alternatives.join(', ')}</Text>
                  ) : null}
                </View>
                <Text style={styles.resultAmount}>{Number(item.displayAmount ?? item.amount).toFixed(2)} EUR</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {found.length > 0 ? (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleImport}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>Importer {selected.size} abonnements</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const styles = makeStyles(Colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={resetAndClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan intelligent</Text>
            <View style={{ width: 34 }} />
          </View>

          {step === 'choose' && renderChooseStep()}
          {step === 'manual' && renderManualStep()}
          {step === 'scanning' && renderScanningStep()}
          {step === 'review' && renderReviewStep()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    header: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.white,
    },
    headerTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 17, color: Colors.text },
    closeBtn: { padding: 8, marginLeft: -8 },
    closeTxt: { fontSize: 20, color: Colors.textSecondary },
    content: { flex: 1 },
    contentBody: { padding: 20 },
    heroCard: { marginBottom: 24 },
    heroEyebrow: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: 12,
      color: Colors.accent,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    heroTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 26, color: Colors.text, marginBottom: 8 },
    heroText: { ...Fonts.primary, fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
    pendingCard: {
      backgroundColor: Colors.surface,
      padding: 16,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: 20,
      ...Shadow.soft,
    },
    pendingTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 14, color: Colors.text },
    pendingText: { ...Fonts.primary, fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
    choiceList: { gap: 12 },
    choiceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.white,
      borderRadius: Radius.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Shadow.soft,
    },
    choiceIconWrap: {
      width: 50,
      height: 50,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    choiceIcon: { fontSize: 24 },
    choiceTextWrap: { flex: 1 },
    choiceTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
    choiceText: { ...Fonts.primary, fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginTop: 4 },
    formCard: {
      backgroundColor: Colors.white,
      borderRadius: Radius.lg,
      padding: 18,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Shadow.soft,
    },
    label: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: 11,
      color: Colors.textMuted,
      marginBottom: 8,
      marginTop: 10,
      textTransform: 'uppercase',
    },
    input: {
      minHeight: 52,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.borderStrong,
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      ...Fonts.primary,
      fontSize: 14,
      color: Colors.text,
    },
    primaryButton: {
      height: 54,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.text,
      marginTop: 18,
    },
    primaryButtonText: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: 14,
      color: Colors.pureWhite,
      textTransform: 'uppercase',
    },
    secondaryButton: {
      height: 50,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.borderStrong,
    },
    secondaryButtonText: { ...Fonts.primary, ...Fonts.bold, fontSize: 13, color: Colors.text },
    scanningContainer: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center' },
    scanningTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 22, color: Colors.text, marginTop: 20 },
    scanningText: {
      ...Fonts.primary,
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },
    logsCard: {
      width: '100%',
      height: 220,
      marginTop: 24,
      borderRadius: Radius.lg,
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: 16,
    },
    logLine: { ...Fonts.primary, fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
    errorBox: {
      backgroundColor: '#FFF1F1',
      borderWidth: 1,
      borderColor: '#FFE0E0',
      borderRadius: Radius.md,
      padding: 16,
    },
    errorText: { ...Fonts.primary, fontSize: 13, color: Colors.error, lineHeight: 20 },
    summaryCard: {
      margin: 24,
      marginBottom: 14,
      backgroundColor: Colors.text,
      borderRadius: Radius.xl,
      padding: 22,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...Shadow.medium,
    },
    summaryValue: { ...Fonts.primary, ...Fonts.black, fontSize: 24, color: Colors.white },
    summaryLabel: { ...Fonts.primary, fontSize: 10, color: '#94A3B8', marginTop: 4, textTransform: 'uppercase' },
    summaryDivider: { width: 1, height: 40, backgroundColor: '#334155' },
    resultList: { gap: 12, paddingHorizontal: 24, paddingBottom: 16 },
    resultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.white,
      borderRadius: Radius.md,
      padding: 14,
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    resultCardSelected: { borderColor: Colors.text, backgroundColor: Colors.surface },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: Colors.borderStrong,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: { backgroundColor: Colors.text, borderColor: Colors.text },
    checkboxMark: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
    resultIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: Colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    resultIcon: { fontSize: 20 },
    resultTextWrap: { flex: 1 },
    resultTitle: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
    resultBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    confidenceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    confidenceBadgeText: { ...Fonts.primary, ...Fonts.bold, fontSize: 10, textTransform: 'uppercase' },
    confidenceValue: { ...Fonts.primary, ...Fonts.bold, fontSize: 11, color: Colors.textSecondary },
    resultStatusText: { ...Fonts.primary, ...Fonts.medium, fontSize: 11, color: Colors.textSecondary, marginTop: 3 },
    resultSubtitle: { ...Fonts.primary, fontSize: 0, color: 'transparent', marginTop: 0, lineHeight: 0, height: 0 },
    resultSourceSubject: { ...Fonts.primary, fontSize: 11, color: Colors.textMuted, marginTop: 4 },
    resultMeta: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
    resultAltText: { ...Fonts.primary, fontSize: 11, color: Colors.accent, marginTop: 4 },
    resultAmount: { ...Fonts.primary, ...Fonts.bold, fontSize: 14, color: Colors.text },
    emptyBox: { padding: 24, alignItems: 'center' },
    emptyTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 18, color: Colors.text },
    emptyText: {
      ...Fonts.primary,
      fontSize: 14,
      color: Colors.textSecondary,
      marginTop: 10,
      lineHeight: 22,
      textAlign: 'center',
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors.white,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 38 : 20,
    },
    buttonDisabled: { opacity: 0.7 },
  });
}
