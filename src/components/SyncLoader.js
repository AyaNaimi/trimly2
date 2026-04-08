import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { useApp } from '../context/AppContext';
import { Colors, Fonts, Shadow } from '../theme';

export default function SyncLoader() {
  const { state } = useApp();

  if (!state.isLoading) return null;

  return (
    <Modal transparent visible={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.text}>Synchronisation Cloud...</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 24,
    alignItems: 'center',
    gap: 16,
    ...Shadow.premium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  text: {
    ...Fonts.sans,
    fontSize: 14,
    ...Fonts.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
});
