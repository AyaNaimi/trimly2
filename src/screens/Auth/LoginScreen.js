// src/screens/Auth/LoginScreen.js
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '../../utils/supabase';
import { Fonts, Radius, Shadow } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { PremiumHaptics } from '../../utils/haptics';
import {
  getGoogleQueryParams,
  getGoogleRedirectUri,
  getGoogleScopeString,
  parseOAuthRedirectUrl,
  storeGoogleProviderTokens,
} from '../../services/googleAuthService';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { Colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login');
  const [focusedField, setFocusedField] = useState(null);

  const deepLinkUrl = Linking.useURL();

  useEffect(() => {
    const handleUrl = (url) => {
      if (!url) return;
      processDeepLink(url);
    };

    const processDeepLink = async (url) => {
      try {
        WebBrowser.dismissBrowser();

        const {
          accessToken,
          refreshToken,
          providerAccessToken,
          providerRefreshToken,
        } = parseOAuthRedirectUrl(url);

        if (!accessToken || !refreshToken) {
          return;
        }

        setLoading(true);

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;

        const {
          data: { session },
        } = await supabase.auth.getSession();

        await storeGoogleProviderTokens({
          userId: session?.user?.id,
          email: session?.user?.email,
          accessToken: providerAccessToken || session?.provider_token,
          refreshToken: providerRefreshToken || session?.provider_refresh_token,
        });

        console.log('✅ Deep link processé avec succès');
      } catch (error) {
        console.error('❌ Erreur lors du processing du deep link:', error);
      } finally {
        setLoading(false);
      }
    };

    // Handle initial URL
    if (deepLinkUrl) handleUrl(deepLinkUrl);

    // Add listener for incoming URLs
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [deepLinkUrl]);

  async function handleAuth() {
    if (!email || !password) {
      PremiumHaptics.impact();
      Alert.alert('Champs requis', 'Veuillez remplir votre email et mot de passe.');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      PremiumHaptics.error();
      Alert.alert('Email invalide', 'Veuillez entrer une adresse email valide.');
      return;
    }

    // Validation du mot de passe (minimum 6 caractères)
    if (password.length < 6) {
      PremiumHaptics.error();
      Alert.alert('Mot de passe trop court', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        PremiumHaptics.success();
        Alert.alert(
          'Compte créé avec succès',
          'Si la confirmation email est activée, vérifiez votre boîte mail puis reconnectez-vous.',
          [{ text: 'OK' }]
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        PremiumHaptics.success();
      }
    } catch (error) {
      PremiumHaptics.error();
      
      // Gestion des erreurs spécifiques
      let errorTitle = 'Erreur de connexion';
      let errorMessage = error.message;

      if (error.message.includes('Invalid login credentials')) {
        errorTitle = 'Identifiants incorrects';
        errorMessage = 'L\'email ou le mot de passe est incorrect. Veuillez réessayer.';
      } else if (error.message.includes('Email not confirmed')) {
        errorTitle = 'Email non confirmé';
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter.';
      } else if (error.message.includes('User not found')) {
        errorTitle = 'Compte introuvable';
        errorMessage = 'Aucun compte n\'existe avec cet email. Voulez-vous créer un compte ?';
      } else if (error.message.includes('User already registered')) {
        errorTitle = 'Compte existant';
        errorMessage = 'Un compte existe déjà avec cet email. Essayez de vous connecter.';
      } else if (error.message.includes('Password')) {
        errorTitle = 'Mot de passe incorrect';
        errorMessage = 'Le mot de passe saisi est incorrect. Veuillez réessayer.';
      }

      Alert.alert(errorTitle, errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider) {
    setLoading(true);

    try {
      PremiumHaptics.selection();

      const redirectUri = getGoogleRedirectUri();
      const isGoogle = provider === 'google';

      console.log('🔐 Tentative de connexion avec:', provider);
      console.log('📍 Redirect URI:', redirectUri);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
          scopes: isGoogle ? getGoogleScopeString() : undefined,
          queryParams: isGoogle ? getGoogleQueryParams() : undefined,
        },
      });

      if (error) {
        console.error('❌ Erreur OAuth Supabase:', error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error('URL OAuth introuvable.');
      }

      console.log('🌐 Ouverture du navigateur OAuth...');
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri, {
        showInRecents: true,
      });

      console.log('📱 Résultat du navigateur (type):', result.type);
      if (result.url) {
        console.log('🔗 URL de retour reçue via le résultat:', result.url.substring(0, 50) + '...');
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        console.log('⚠️ Connexion annulée par l\'utilisateur');
        setLoading(false);
        return;
      }

      if (result.type !== 'success' || !result.url) {
        throw new Error('Connexion OAuth interrompue.');
      }

      console.log('✅ URL de retour reçue');

      const {
        accessToken,
        refreshToken,
        providerAccessToken,
        providerRefreshToken,
      } = parseOAuthRedirectUrl(result.url);

      if (!accessToken || !refreshToken) {
        throw new Error("Impossible de vérifier l'authentification (jetons manquants).");
      }

      console.log('🔑 Jetons reçus, création de la session...');

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        console.error('❌ Erreur de session:', sessionError);
        throw sessionError;
      }

      if (isGoogle) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        console.log('💾 Sauvegarde des jetons Google...');
        await storeGoogleProviderTokens({
          userId: session?.user?.id,
          email: session?.user?.email,
          accessToken: providerAccessToken || session?.provider_token,
          refreshToken: providerRefreshToken || session?.provider_refresh_token,
        });
      }

      console.log('✅ Connexion réussie !');
      PremiumHaptics.success();
    } catch (error) {
      console.error('❌ Erreur complète:', error);
      PremiumHaptics.error();
      
      let errorTitle = 'Erreur d\'authentification';
      let errorMessage = error.message || "Impossible d'ouvrir la connexion.";

      if (error.message.includes('OAuth')) {
        errorTitle = 'Erreur de connexion ' + (provider === 'google' ? 'Google' : 'Apple');
        errorMessage = 'La connexion a échoué. Veuillez réessayer ou utiliser une autre méthode.';
      } else if (error.message.includes('network')) {
        errorTitle = 'Erreur réseau';
        errorMessage = 'Vérifiez votre connexion internet et réessayez.';
      }

      Alert.alert(errorTitle, errorMessage, [
        { text: 'OK', style: 'default' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const styles = makeStyles(Colors);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image
              source={require('../../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>TRIMLY</Text>
            <Text style={styles.subtitle}>SOPHISTICATION ANALYTIQUE</Text>
          </View>

          <View style={styles.socialGroup}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => handleSocialLogin('google')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialButtonText}>Se connecter avec Google</Text>
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
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
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
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Se Connecter' : 'Creer un Compte'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeToggle}
              onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              <Text style={styles.modeToggleText}>
                {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Deja membre ? Se connecter'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(Colors) { return StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
    ...Shadow.medium,
  },
  title: { ...Fonts.primary, fontWeight: '900', fontSize: 30, color: Colors.text, letterSpacing: 3 },
  subtitle: { ...Fonts.primary, fontSize: 11, color: Colors.textSecondary, letterSpacing: 2, marginTop: 4, ...Fonts.bold },

  socialGroup: { gap: 12, marginBottom: 24 },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    ...Shadow.soft,
  },
  appleButton: { backgroundColor: Colors.text, borderColor: Colors.text },
  socialIcon: { fontSize: 20, fontWeight: 'bold', marginRight: 12, color: Colors.text },
  socialButtonText: { ...Fonts.primary, fontSize: 14, ...Fonts.bold, color: Colors.text },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { marginHorizontal: 16, color: Colors.textMuted, fontSize: 12, ...Fonts.bold },

  formCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: 24,
    ...Shadow.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: { ...Fonts.primary, fontSize: 10, color: Colors.textSecondary, marginBottom: 6, ...Fonts.black, textTransform: 'uppercase' },
  inputWrapper: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  inputFocused: { borderColor: Colors.text, backgroundColor: Colors.white, borderWidth: 1.5 },
  input: { ...Fonts.primary, fontSize: 14, color: Colors.text },

  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonLoading: { opacity: 0.8 },
  submitButtonText: { color: Colors.pureWhite, fontSize: 12, ...Fonts.black, textTransform: 'uppercase', letterSpacing: 1 },

  modeToggle: { marginTop: 16, alignItems: 'center' },
  modeToggleText: { ...Fonts.primary, fontSize: 13, color: Colors.textSecondary, textDecorationLine: 'underline' },
}); }
