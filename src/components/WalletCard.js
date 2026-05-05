// src/components/WalletCard.js
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Fonts, Radius, Spacing } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { PremiumHaptics } from '../utils/haptics';

export default function WalletCard({ balance, currency = '€', totalIncome = 0, totalExpenses = 0, userName = 'Utilisateur' }) {
  const { Colors } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animations pour les cartes
  const stripeAnim = useRef(new Animated.Value(0)).current;
  const wiseAnim = useRef(new Animated.Value(0)).current;
  const paypalAnim = useRef(new Animated.Value(0)).current;
  const balanceOpacity = useRef(new Animated.Value(0)).current;
  const starsOpacity = useRef(new Animated.Value(1)).current;
  const walletScale = useRef(new Animated.Value(1)).current;

  const toggleCards = () => {
    PremiumHaptics.selection();
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);

    Animated.parallel([
      // Wallet lift
      Animated.spring(walletScale, {
        toValue: isExpanded ? 1 : 1.02,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      // Cards spread
      Animated.spring(stripeAnim, {
        toValue,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }),
      Animated.spring(wiseAnim, {
        toValue,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
        delay: 30,
      }),
      Animated.spring(paypalAnim, {
        toValue,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
        delay: 60,
      }),
      // Balance reveal
      Animated.timing(balanceOpacity, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(starsOpacity, {
        toValue: isExpanded ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const stripeTranslate = stripeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -60], // Sort de la poche
  });

  const wiseTranslate = wiseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -70], // Sort de la poche
  });

  const paypalTranslate = paypalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -60], // Sort de la poche
  });

  const stripeRotate = stripeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-3deg'],
  });

  const wiseRotate = wiseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg'],
  });

  const stripeScale = stripeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const wiseScale = wiseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const paypalScale = paypalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  // Les cartes sont toujours visibles (pas d'opacité)
  // Seule leur position change

  const styles = makeStyles(Colors);

  return (
    <Pressable onPress={toggleCards} style={styles.container}>
      <Animated.View style={[styles.wallet, { transform: [{ scale: walletScale }] }]}>
        
        {/* Wallet Back (Derrière) - z-index le plus bas */}
        <View style={styles.walletBackLayer} />

        {/* Cards - au milieu, sortent de la poche */}
        {/* Card Stripe */}
        <Animated.View
          style={[
            styles.card,
            styles.cardStripe,
            { 
              transform: [
                { translateY: stripeTranslate },
                { rotate: stripeRotate },
                { scale: stripeScale },
              ] 
            },
          ]}
        >
          <View style={styles.cardInner}>
            <View style={styles.cardTop}>
              <Text style={styles.cardBrand}>STRIPE</Text>
              <View style={styles.chip} />
            </View>
            <View style={styles.cardBottom}>
              <View>
                <Text style={styles.cardLabel}>Holder</Text>
                <Text style={styles.cardValue}>{userName.toUpperCase()}</Text>
              </View>
              <View style={styles.cardNumberWrapper}>
                <Text style={styles.cardNumber}>
                  {isExpanded ? '5524 9910 4242' : '**** 4242'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Card Wise */}
        <Animated.View
          style={[
            styles.card,
            styles.cardWise,
            { 
              transform: [
                { translateY: wiseTranslate },
                { rotate: wiseRotate },
                { scale: wiseScale },
              ] 
            },
          ]}
        >
          <View style={styles.cardInner}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardBrand, { color: '#1e3a1e' }]}>WISE</Text>
              <View style={[styles.chip, { backgroundColor: 'rgba(30, 58, 30, 0.2)' }]} />
            </View>
            <View style={styles.cardBottom}>
              <View>
                <Text style={[styles.cardLabel, { color: 'rgba(30, 58, 30, 0.7)' }]}>Business</Text>
                <Text style={[styles.cardValue, { color: '#1e3a1e' }]}>{userName.toUpperCase()}</Text>
              </View>
              <View style={styles.cardNumberWrapper}>
                <Text style={[styles.cardNumber, { color: '#1e3a1e' }]}>
                  {isExpanded ? '9012 4432 8810' : '**** 8810'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Card PayPal */}
        <Animated.View
          style={[
            styles.card,
            styles.cardPaypal,
            { 
              transform: [
                { translateY: paypalTranslate },
                { scale: paypalScale },
              ] 
            },
          ]}
        >
          <View style={styles.cardInner}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardBrand, { color: '#003087' }]}>
                Pay<Text style={{ fontWeight: 'bold', color: '#0079C1' }}>Pal</Text>
              </Text>
              <View style={[styles.chip, { backgroundColor: 'rgba(0, 0, 0, 0.05)' }]} />
            </View>
            <View style={styles.cardBottom}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardLabel, { color: '#8c979d' }]}>Account</Text>
                <Text style={[styles.cardValue, { color: '#003087' }]} numberOfLines={1}>
                  {userName}
                </Text>
              </View>
              <View style={styles.cardNumberWrapper}>
                <Text style={[styles.cardNumber, { color: '#003087' }]}>
                  {isExpanded ? '3312 0045 0094' : '**** 0094'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Wallet Front (Devant) - Poche avec ouverture - z-index le plus haut */}
        <View style={styles.walletFront}>
          <View style={styles.pocketContent}>
            {/* Balance Display */}
            <View style={styles.balanceContainer}>
              <Animated.Text style={[styles.balanceStars, { opacity: starsOpacity }]}>
                ******
              </Animated.Text>
              <Animated.Text style={[styles.balanceReal, { opacity: balanceOpacity }]}>
                {balance.toLocaleString()} {currency}
              </Animated.Text>
            </View>
            <Text style={styles.balanceLabel}>Solde Net</Text>
            
            {/* Stats Row - Visible when expanded */}
            <Animated.View style={[styles.statsRow, { opacity: balanceOpacity }]}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Entrées</Text>
                <Text style={styles.statValueIncome}>
                  +{totalIncome.toLocaleString()} {currency}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Sorties</Text>
                <Text style={styles.statValueExpense}>
                  -{totalExpenses.toLocaleString()} {currency}
                </Text>
              </View>
            </Animated.View>
          </View>
        </View>

      </Animated.View>

      <Text style={styles.hint}>
        {isExpanded ? 'Appuyez pour ranger les cartes' : 'Appuyez pour sortir vos cartes'}
      </Text>
    </Pressable>
  );
}

function makeStyles(Colors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      marginVertical: Spacing.lg,
      paddingTop: 40, // Espace pour les cartes qui sortent
    },
    wallet: {
      width: 280,
      height: 180,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    walletBackLayer: {
      position: 'absolute',
      bottom: 0,
      width: 280,
      height: 180,
      backgroundColor: '#0f1e0f',
      borderRadius: 22,
      borderBottomLeftRadius: 50,
      borderBottomRightRadius: 50,
      zIndex: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
    walletFront: {
      position: 'absolute',
      bottom: 0,
      width: 280,
      height: 180,
      backgroundColor: '#1e341e',
      borderRadius: 22,
      borderBottomLeftRadius: 50,
      borderBottomRightRadius: 50,
      zIndex: 100, // Au-dessus des cartes
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.4,
      shadowRadius: 25,
      elevation: 15,
      // Couture pointillée à l'intérieur - avec padding interne
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: '#4a6642',
      padding: 8, // Espace intérieur pour la bordure
      alignSelf: 'center',
    },
    pocketContent: {
      position: 'absolute',
      top: 30,
      left: 0,
      right: 0,
      alignItems: 'center',
      gap: 8,
      zIndex: 101, // Au-dessus du front
      paddingHorizontal: 10,
    },
    balanceContainer: {
      height: 30,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    balanceStars: {
      color: '#839e7b',
      fontSize: 24,
      letterSpacing: 4,
      fontWeight: 'bold',
    },
    balanceReal: {
      color: '#a7c59e',
      fontSize: 22,
      fontWeight: '600',
      position: 'absolute',
    },
    balanceLabel: {
      color: '#698263',
      fontSize: 12,
      fontWeight: '500',
    },
    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 12,
      paddingHorizontal: 20,
      gap: 16,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      color: '#698263',
      fontSize: 9,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    statValueIncome: {
      color: '#00F5D4',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    statValueExpense: {
      color: '#F15BB5',
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: '#3d5635',
      opacity: 0.5,
    },
    card: {
      position: 'absolute',
      width: 260,
      height: 140,
      borderRadius: 16,
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 15,
      elevation: 8,
      alignSelf: 'center',
    },
    cardStripe: {
      backgroundColor: '#635bff',
      bottom: 50, // Position de départ dans la poche
      zIndex: 50,
    },
    cardWise: {
      backgroundColor: '#9bd86a',
      bottom: 50,
      zIndex: 60,
    },
    cardPaypal: {
      backgroundColor: '#ffffff',
      bottom: 50,
      zIndex: 70,
    },
    cardInner: {
      flex: 1,
      justifyContent: 'space-between',
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardBrand: {
      fontSize: 14,
      color: '#ffffff',
      fontWeight: '600',
      letterSpacing: 1,
    },
    chip: {
      width: 32,
      height: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    cardLabel: {
      fontSize: 8,
      color: 'rgba(255, 255, 255, 0.7)',
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    cardValue: {
      fontSize: 10,
      color: '#ffffff',
      fontWeight: '500',
    },
    cardNumberWrapper: {
      alignItems: 'flex-end',
    },
    cardNumber: {
      fontSize: 14,
      color: '#ffffff',
      letterSpacing: 1,
      fontFamily: 'monospace',
    },
    hint: {
      marginTop: 16,
      fontSize: 12,
      color: Colors.textMuted,
      fontStyle: 'italic',
    },
  });
}
