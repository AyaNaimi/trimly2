import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import { Colors, Fonts, Radius, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';
import { QUICK_SUBSCRIPTIONS } from '../../data/initialData';

const SUPABASE_URL = 'https://xsxgfdmmtqojuduwrwlq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzeGdmZG1tdHFvanVkdXdyd2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzI5OTIsImV4cCI6MjA5MDkwODk5Mn0.5trHlJczCO7s7KOqiU_3JrfqJ8rRAfJIIEWo8yIm_1c';
const GROQ_API_KEY = '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';

const SERVICE_ICONS = {
  'Netflix': '🎬',
  'Spotify': '🎵',
  'Disney+': '🏰',
  'ChatGPT': '🤖',
  'OpenAI': '🤖',
  'Amazon': '📦',
  'YouTube': '▶️',
  'Apple': '🍎',
  'Microsoft': '💻',
  'Adobe': '🎨',
  'Dropbox': '📁',
  'Notion': '📝',
  'iCloud': '☁️',
  'Google': '🔍',
  'Canal+': '📺',
  'Deezer': '🎶',
  'NordVPN': '🔒',
  'Slack': '💬',
  'Zoom': '📹',
};

function getBestMatchIcon(name) {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key.toLowerCase())) return icon;
  }
  return '📦';
}

function getBestMatchColor(name) {
  const lower = name.toLowerCase();
  const quick = QUICK_SUBSCRIPTIONS.find(q => lower.includes(q.name.toLowerCase()));
  if (quick) return quick.color;
  return Colors.accent;
}

export default function EmailScannerModal({ visible, onClose, onImport }) {
  const [step, setStep] = useState('select');
  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState(null);

  const addLog = (msg) => {
    console.log('[ScannerLog]', msg);
    setLogs(prev => [...prev, msg]);
  };
  
  const resetState = () => {
    setStep('select');
    setFound([]);
    setSelected(new Set());
    setLogs([]);
    setLoading(false);
    setUserEmail('');
    setError(null);
  };

  const POPULAR_SUBSCRIPTIONS = [
    { serviceName: 'Netflix', amount: 15.99, billingFrequency: 'monthly', category: 'Streaming' },
    { serviceName: 'Spotify Premium', amount: 9.99, billingFrequency: 'monthly', category: 'Musique' },
    { serviceName: 'ChatGPT Plus', amount: 20.00, billingFrequency: 'monthly', category: 'IA' },
    { serviceName: 'Amazon Prime', amount: 69.99, billingFrequency: 'annual', category: 'Shopping' },
    { serviceName: 'Disney+', amount: 8.99, billingFrequency: 'monthly', category: 'Streaming' },
    { serviceName: 'YouTube Premium', amount: 11.99, billingFrequency: 'monthly', category: 'Streaming' },
    { serviceName: 'Apple TV+', amount: 4.99, billingFrequency: 'monthly', category: 'Streaming' },
    { serviceName: 'Microsoft 365', amount: 6.99, billingFrequency: 'monthly', category: 'Productivite' },
    { serviceName: 'Adobe Creative Cloud', amount: 59.99, billingFrequency: 'monthly', category: 'Productivite' },
    { serviceName: 'Dropbox Plus', amount: 11.99, billingFrequency: 'monthly', category: 'Stockage' },
    { serviceName: 'Canal+', amount: 29.99, billingFrequency: 'monthly', category: 'Streaming' },
    { serviceName: 'Deezer Premium', amount: 10.99, billingFrequency: 'monthly', category: 'Musique' },
    { serviceName: 'iCloud+', amount: 2.99, billingFrequency: 'monthly', category: 'Stockage' },
    { serviceName: 'Google One', amount: 2.99, billingFrequency: 'monthly', category: 'Stockage' },
    { serviceName: 'NordVPN', amount: 11.99, billingFrequency: 'monthly', category: 'Securite' },
    { serviceName: 'Nintendo Switch Online', amount: 3.99, billingFrequency: 'monthly', category: 'Jeux' },
    { serviceName: 'PlayStation Plus', amount: 9.99, billingFrequency: 'monthly', category: 'Jeux' },
    { serviceName: 'Xbox Game Pass', amount: 12.99, billingFrequency: 'monthly', category: 'Jeux' },
  ];

  const startGoogleScan = async () => {
    Alert.alert(
      'Scanner Email',
      'IMPORTANT: Pour scanner vos vrais emails, vous devez d\'abord lancer le serveur local.\n\nDans un terminal, executez:\n\ncd email-scanner\nnpm install\nnpm start\n\nEnsuite, entrez votre email Gmail et App Password.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Continuer', onPress: () => startScan() }
      ]
    );
  };

  const startScan = () => {
    Alert.prompt(
      'Connexion Gmail',
      'Entrez votre adresse email Gmail:',
      async (userEmailInput) => {
        if (!userEmailInput) return;
        
        Alert.prompt(
          'App Password',
          'Entrez votre App Password Gmail (16 caracteres):\n\nPour le creer: Google Account > Security > 2-Step Verification > App Passwords',
          async (appPassword) => {
            if (!appPassword) {
              Alert.alert('Erreur', 'App Password requis');
              return;
            }
            
            if (appPassword.length !== 16) {
              Alert.alert('Erreur', 'App Password doit avoir 16 caracteres');
              return;
            }
            
            setLoading(true);
            setError(null);
            setStep('scanning');
            setUserEmail(userEmailInput);
            addLog(`Email: ${userEmailInput}`);
            addLog("Connexion IMAP...");
            
            try {
              addLog("Connexion serveur local...");
              
              const response = await fetch('http://localhost:3001/scan', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: userEmailInput,
                  appPassword: appPassword,
                }),
              });

              if (!response.ok) {
                const err = await response.text();
                throw new Error(err || 'Erreur serveur');
              }

              const result = await response.json();
              
              addLog(`${result.subscriptions?.length || 0} abonnements trouves`);
              
              if (result.subscriptions && result.subscriptions.length > 0) {
                setFound(result.subscriptions);
                setSelected(new Set(result.subscriptions.map((_, i) => i)));
              } else {
                addLog("Aucun abonnement trouve dans vos emails");
                setFound([]);
                setSelected(new Set());
              }
              
              setStep('review');
              
            } catch (err) {
              console.error('Scan Error:', err);
              setError(err.message);
              addLog(`Erreur: ${err.message}`);
              setFound([]);
              setSelected(new Set());
              setStep('review');
            } finally {
              setLoading(false);
            }
          },
          'secure-text'
        );
      }
    );
  };

  async function analyzeWithAI(emails) {
    // AI analysis is now done in the Edge Function
    return null;
  }

  function findSubscriptions(emails) {
    return [];
  }

  const toggleItem = (i) => {
    const s = new Set(selected);
    if (s.has(i)) s.delete(i);
    else s.add(i);
    setSelected(s);
    PremiumHaptics.selection();
  };

  const handleImport = async () => {
    const toImport = found.filter((_, i) => selected.has(i));
    
    if (toImport.length === 0) {
      onClose();
      return;
    }

    setLoading(true);
    addLog(`Importation de ${toImport.length} abonnements...`);
    
    let okCount = 0;
    for (const item of toImport) {
      try {
        const subData = {
          name: item.serviceName,
          amount: parseFloat(item.amount) || 0,
          cycle: (item.billingFrequency || 'monthly').toLowerCase(),
          category: item.category || 'Autre',
          icon: getBestMatchIcon(item.serviceName),
          color: getBestMatchColor(item.serviceName),
          startDate: item.startDate || new Date().toISOString().split('T')[0],
          active: true
        };
        
        const success = await onImport(subData);
        if (success) okCount++;
      } catch (e) {
        console.error('Import item error:', e);
      }
    }

    setLoading(false);
    PremiumHaptics.success();
    Alert.alert('Succes', `${okCount} abonnements ajoutes a votre dashboard !`, [
      { text: 'Super', onPress: () => { resetState(); onClose(); } }
    ]);
  };

  const total = found
    .filter((_, i) => selected.has(i))
    .reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetState}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => { resetState(); onClose(); }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SCANNER EMAILS</Text>
          <View style={{ width: 40 }} />
        </View>

        {step === 'select' && (
          <View style={styles.content}>
            <View style={styles.hero}>
              <View style={styles.heroIconWrap}>
                <Text style={styles.heroEmoji}>🔍</Text>
              </View>
              <Text style={styles.heroTitle}>Scan Intelligent</Text>
              <Text style={styles.heroDesc}>
                L'IA analyse vos reçus Gmail pour retrouver automatiquement vos abonnements et leurs tarifs.
              </Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.googleBtn, loading && { opacity: 0.7 }]} 
              onPress={startGoogleScan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.googleBtnText}>Scanner mes emails Gmail</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              Vos données sont traitées de manière sécurisée et ne sont jamais stockées en dehors de votre application.
            </Text>
          </View>
        )}

        {step === 'scanning' && (
          <View style={styles.scanningContainer}>
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.accent} />
            </View>
            <Text style={styles.scanningTitle}>Analyse en cours...</Text>
            <Text style={styles.scanningSub}>Cela peut prendre jusqu'à 30 secondes</Text>
            
            <View style={styles.logsBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {logs.map((log, i) => (
                  <Text key={i} style={styles.logLine}>• {log}</Text>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {step === 'review' && (
          <View style={{ flex: 1 }}>
            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
              {userEmail ? (
                <View style={styles.emailBadge}>
                  <Text style={styles.emailBadgeText}>Bienvenue: {userEmail}</Text>
                </View>
              ) : null}

              <View style={styles.summaryCard}>
                <View>
                  <Text style={styles.summaryVal}>{found.length}</Text>
                  <Text style={styles.summaryLbl}>Suggestions</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.summaryVal}>{total.toFixed(2)}€</Text>
                  <Text style={styles.summaryLbl}>Total / mois</Text>
                </View>
              </View>

              {found.length === 0 ? (
                <View style={styles.emptyResults}>
                  <Text style={styles.emptyResultsEmoji}>🤷‍♂️</Text>
                  <Text style={styles.emptyResultsTitle}>Aucune suggestion</Text>
                  <Text style={styles.emptyResultsDesc}>
                    Selectionnez vos abonnements dans la liste ci-dessus.
                  </Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => setStep('select')}>
                    <Text style={styles.retryBtnText}>Retour</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: 12, marginTop: 10 }}>
                  <Text style={styles.listLabel}>Selectionnez les abonnements a importer :</Text>
                  {found.map((item, i) => (
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.item, selected.has(i) && styles.itemSelected]} 
                      onPress={() => toggleItem(i)}
                    >
                      <View style={[styles.checkbox, selected.has(i) && styles.checkboxActive]}>
                        {selected.has(i) && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      
                      <View style={styles.itemIconBox}>
                        <Text style={{ fontSize: 20 }}>{getBestMatchIcon(item.serviceName)}</Text>
                      </View>

                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.serviceName}</Text>
                        <Text style={styles.itemCat}>{item.category} • {item.billingFrequency}</Text>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.itemPrice}>{parseFloat(item.amount).toFixed(2)}€</Text>
                        <Text style={styles.itemCycle}>/mois</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            {found.length > 0 && (
              <View style={styles.footer}>
                <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
                  <Text style={styles.importBtnText}>IMPORTER {selected.size} ABONNEMENTS</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, height: 60, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.white
  },
  headerTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 13, letterSpacing: 1, color: Colors.text },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 20, color: Colors.textSecondary },
  
  content: { flex: 1, padding: 24 },
  
  hero: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  heroIconWrap: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    borderWidth: 1, borderColor: Colors.border
  },
  heroEmoji: { fontSize: 32 },
  heroTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 24, color: Colors.text, marginBottom: 12 },
  heroDesc: { ...Fonts.primary, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  
  googleBtn: { 
    backgroundColor: Colors.text, padding: 18, borderRadius: Radius.md, alignItems: 'center', 
    marginTop: 20, ...Shadow.medium 
  },
  googleBtnText: { color: Colors.white, ...Fonts.primary, ...Fonts.bold, fontSize: 15 },
  
  privacyNote: { ...Fonts.primary, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 24, lineHeight: 16 },
  
  errorBox: { backgroundColor: '#FFF1F1', padding: 16, borderRadius: Radius.md, marginBottom: 20, borderWidth: 1, borderColor: '#FFE0E0' },
  errorText: { ...Fonts.primary, fontSize: 13, color: Colors.error },

  scanningContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loaderWrap: { marginBottom: 32 },
  scanningTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 20, color: Colors.text, marginBottom: 8 },
  scanningSub: { ...Fonts.primary, fontSize: 13, color: Colors.textSecondary, marginBottom: 40 },
  
  logsBox: { 
    width: '100%', height: 200, backgroundColor: Colors.white, borderRadius: Radius.lg, 
    padding: 16, borderWidth: 1, borderColor: Colors.border, ...Shadow.soft
  },
  logLine: { ...Fonts.primary, fontSize: 12, color: Colors.textSecondary, marginBottom: 8 },
  
  emailBadge: { backgroundColor: Colors.surface, padding: 10, borderRadius: Radius.sm, marginBottom: 20, alignItems: 'center' },
  emailBadgeText: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, ...Fonts.bold },
  
  summaryCard: { 
    flexDirection: 'row', backgroundColor: Colors.text, borderRadius: Radius.lg, 
    padding: 24, marginBottom: 24, alignItems: 'center', ...Shadow.medium
  },
  summaryVal: { ...Fonts.primary, ...Fonts.black, fontSize: 24, color: Colors.white },
  summaryLbl: { ...Fonts.primary, fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginTop: 4 },
  summaryDivider: { width: 1, height: 40, backgroundColor: '#334155', marginHorizontal: 24 },
  
  listLabel: { ...Fonts.primary, ...Fonts.bold, fontSize: 12, color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase' },
  
  item: { 
    flexDirection: 'row', alignItems: 'center', padding: 14, 
    backgroundColor: Colors.white, borderRadius: Radius.md, 
    borderWidth: 1.5, borderColor: Colors.border
  },
  itemSelected: { borderColor: Colors.text, backgroundColor: Colors.surface },
  checkbox: { 
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, 
    borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginRight: 14 
  },
  checkboxActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  checkmark: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  
  itemIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
  itemCat: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: { ...Fonts.primary, ...Fonts.bold, fontSize: 15, color: Colors.text },
  itemCycle: { ...Fonts.primary, fontSize: 10, color: Colors.textMuted },
  
  footer: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: 20, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20
  },
  importBtn: { backgroundColor: Colors.accent, padding: 18, borderRadius: Radius.md, alignItems: 'center', ...Shadow.medium },
  importBtnText: { color: Colors.white, ...Fonts.primary, ...Fonts.bold, fontSize: 14 },

  emptyResults: { alignItems: 'center', paddingVertical: 60 },
  emptyResultsEmoji: { fontSize: 48, marginBottom: 16 },
  emptyResultsTitle: { ...Fonts.primary, ...Fonts.black, fontSize: 18, color: Colors.text, marginBottom: 8 },
  emptyResultsDesc: { ...Fonts.primary, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.pill, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  retryBtnText: { ...Fonts.primary, ...Fonts.bold, fontSize: 13, color: Colors.text },
});
