// src/screens/Splash/SimpleSplashScreen.js
// Version simple avec animation du logo existant
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../theme';

export default function SimpleSplashScreen({ onFinish }) {
  const { Colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Durée du splash (2.5 secondes)
    const timer = setTimeout(() => {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onFinish) onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const styles = makeStyles(Colors);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.accent}
        translucent={false}
      />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>TRIMLY</Text>
        <Text style={styles.tagline}>Minimal Excellence</Text>
      </Animated.View>
    </View>
  );
}

function makeStyles(Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      alignItems: 'center',
      gap: 20,
    },
    logo: {
      width: 100,
      height: 100,
    },
    title: {
      ...Fonts.primary,
      ...Fonts.black,
      fontSize: 32,
      color: Colors.pureWhite,
      letterSpacing: 4,
    },
    tagline: {
      ...Fonts.primary,
      ...Fonts.light,
      fontSize: 14,
      color: Colors.pureWhite,
      opacity: 0.7,
      letterSpacing: 2,
    },
  });
}
