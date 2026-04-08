// src/screens/Auth/LoginScreen.js
import React, { useState } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../utils/supabase';
import { Colors, Fonts, Radius, Spacing, Metrics, Shadow } from '../../theme';
import { PremiumHaptics } from '../../utils/haptics';

// Ensure the browser can return to the app
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); 
  const [focusedField, setFocusedField] = useState(null);

  async function handleAuth() {
    if (!email || !password) {
      PremiumHaptics.impact();
      Alert.alert('Champs requis', 'Veuillez remplir votre email et mot de passe.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        PremiumHaptics.success();
        Alert.alert('Succès', "Si la confirmation est activée, vérifiez vos emails. Sinon, connectez-vous !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        PremiumHaptics.success();
      }
    } catch (error) {
      PremiumHaptics.error();
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider) {
    setLoading(true);
    try {
      PremiumHaptics.selection();
      
      // Let Expo determine the correct redirect URI (handles Expo Go vs Standalone)
      const redirectUri = makeRedirectUri();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true, 
        }
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        
        if (res.type === 'success' && res.url) {
          // Robust parsing of tokens from the return URL
          const urlObj = new URL(res.url.replace('#', '?'));
          const params = urlObj.searchParams;
          const refresh_token = params.get('refresh_token');
          const access_token = params.get('access_token');

          if (refresh_token && access_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            PremiumHaptics.success();
          }
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur Authentification', "Impossible d'ouvrir la connexion Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View style={styles.logoBadge}><Text style={styles.logoSymbol}>✦</Text></View>
            <Text style={styles.title}>TRIMLY</Text>
            <Text style={styles.subtitle}>JOURNAL FINANCIER ÉLÉGANT</Text>
          </View>

          {/* Social Auth Section */}
          <View style={styles.socialGroup}>
            <TouchableOpacity 
              style={styles.socialButton} 
              onPress={() => handleSocialLogin('google')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.socialButton, styles.appleButton]} 
              onPress={() => handleSocialLogin('apple')}
              activeOpacity={0.8}
            >
              <Text style={[styles.socialIcon, { color: Colors.white }]}></Text>
              <Text style={[styles.socialButtonText, { color: Colors.white }]}>Continuer avec Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form Section */}
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse Email</Text>
              <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe</Text>
              <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.buttonLoading]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Se Connecter' : 'Créer un Compte'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modeToggle}
              onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              <Text style={styles.modeToggleText}>
                {mode === 'login' ? "Pas de compte ? S'inscrire" : "Déjà membre ? Se connecter"}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBadge: {
    width: 60, height: 60, borderRadius: 20, backgroundColor: Colors.text,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    ...Shadow.medium,
  },
  logoSymbol: { color: Colors.white, fontSize: 36 },
  title: { ...Fonts.primary, fontWeight: '900', fontSize: 30, color: Colors.text, letterSpacing: 3 },
  subtitle: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, letterSpacing: 2, marginTop: 4, ...Fonts.bold },
  
  socialGroup: { gap: 12, marginBottom: 24 },
  socialButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: Radius.md, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.borderStrong, ...Shadow.soft,
  },
  appleButton: { backgroundColor: Colors.text, borderColor: Colors.text },
  socialIcon: { fontSize: 20, fontWeight: 'bold', marginRight: 12, color: Colors.text },
  socialButtonText: { ...Fonts.primary, fontSize: 14, ...Fonts.bold, color: Colors.text },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 16, color: Colors.textMuted, fontSize: 12, ...Fonts.bold },

  formCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 24,
    ...Shadow.medium, borderWidth: 1, borderColor: Colors.border,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { ...Fonts.primary, fontSize: 10, color: Colors.textSecondary, marginBottom: 6, ...Fonts.black, textTransform: 'uppercase' },
  inputWrapper: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, height: 50,
    justifyContent: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: Colors.borderStrong,
  },
  inputFocused: { borderColor: Colors.text, backgroundColor: Colors.white, borderWidth: 1.5 },
  input: { ...Fonts.primary, fontSize: 14, color: Colors.text },
  
  submitButton: { backgroundColor: Colors.text, borderRadius: Radius.md, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  buttonLoading: { opacity: 0.8 },
  submitButtonText: { color: Colors.white, fontSize: 12, ...Fonts.black, textTransform: 'uppercase', letterSpacing: 1 },
  
  modeToggle: { marginTop: 16, alignItems: 'center' },
  modeToggleText: { ...Fonts.primary, fontSize: 13, color: Colors.textSecondary, textDecorationLine: 'underline' },
});
