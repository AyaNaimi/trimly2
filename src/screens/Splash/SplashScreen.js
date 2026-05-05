// src/screens/Splash/SplashScreen.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SplashScreen({ onFinish }) {
  const { Colors } = useTheme();
  const animationRef = useRef(null);

  useEffect(() => {
    // Lancer l'animation
    if (animationRef.current) {
      animationRef.current.play();
    }

    // Durée du splash (3 secondes)
    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 3000);

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
      
      {/* Animation Lottie */}
      <LottieView
        ref={animationRef}
        source={require('../../../assets/splash-animation.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />
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
    animation: {
      width: 250,
      height: 250,
    },
  });
}
