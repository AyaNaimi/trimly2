// src/screens/Splash/AnimatedSplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../theme';

export default function AnimatedSplashScreen({ onFinish }) {
  const { Colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef(null);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Play Lottie animation
    if (lottieRef.current) {
      lottieRef.current.play();
    }

    // Auto finish after animation duration (approximately 10 seconds based on 294 frames at 30fps)
    const timer = setTimeout(() => {
      if (onFinish) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => onFinish());
      }
    }, 9800); // 9.8 seconds

    return () => clearTimeout(timer);
  }, []);

  const styles = makeStyles(Colors);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.animationContainer}>
        <LottieView
          ref={lottieRef}
          source={require('../../../assets/splash-animation.json')}
          style={styles.animation}
          loop={false}
          autoPlay={false}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>TRIMLY</Text>
        <Text style={styles.tagline}>Sophistication Analytique</Text>
      </View>
    </Animated.View>
  );
}

function makeStyles(Colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    animationContainer: {
      width: 300,
      height: 300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    animation: {
      width: '100%',
      height: '100%',
    },
    textContainer: {
      marginTop: 40,
      alignItems: 'center',
      gap: 8,
    },
    title: {
      ...Fonts.primary,
      ...Fonts.black,
      fontSize: 32,
      color: Colors.text,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    tagline: {
      ...Fonts.primary,
      fontSize: 12,
      color: Colors.textMuted,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
  });
}
