// src/screens/__tests__/ResponsiveTest.js
// Écran de test pour vérifier le système responsive

import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { ResponsiveContainer, ResponsiveGrid } from '../../components/ResponsiveContainer';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../context/ThemeContext';
import { 
  scaleFontSize, 
  scaleSpacing,
  getDeviceType,
  getScreenDimensions,
} from '../../utils/responsive';
import { Fonts, Metrics, Radius, Spacing } from '../../theme';

export default function ResponsiveTestScreen() {
  const { Colors } = useTheme();
  const responsive = useResponsive();
  const deviceType = getDeviceType();
  const { width, height } = getScreenDimensions();

  const showInfo = () => {
    Alert.alert(
      'Informations Responsive',
      `Type: ${deviceType}\n` +
      `Largeur: ${width}px\n` +
      `Hauteur: ${height}px\n` +
      `Padding: ${responsive.screenPadding}px\n` +
      `Petit: ${responsive.isSmallDevice ? 'Oui' : 'Non'}\n` +
      `Tablette: ${responsive.isTablet ? 'Oui' : 'Non'}`
    );
  };

  const styles = makeStyles(Colors, responsive);

  return (
    <ResponsiveContainer scroll>
      <View style={styles.header}>
        <Text style={styles.title}>Test Responsive</Text>
        <Pressable style={styles.infoButton} onPress={showInfo}>
          <Text style={styles.infoButtonText}>ℹ️ Info</Text>
        </Pressable>
      </View>

      {/* Device Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informations Appareil</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type:</Text>
          <Text style={styles.infoValue}>{deviceType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Dimensions:</Text>
          <Text style={styles.infoValue}>{width} × {height}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Padding écran:</Text>
          <Text style={styles.infoValue}>{responsive.screenPadding}px</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Petit écran:</Text>
          <Text style={styles.infoValue}>{responsive.isSmallDevice ? 'Oui' : 'Non'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tablette:</Text>
          <Text style={styles.infoValue}>{responsive.isTablet ? 'Oui' : 'Non'}</Text>
        </View>
      </View>

      {/* Font Sizes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tailles de Police</Text>
        <Text style={[styles.sampleText, { fontSize: scaleFontSize(12) }]}>
          12px → {scaleFontSize(12)}px
        </Text>
        <Text style={[styles.sampleText, { fontSize: scaleFontSize(16) }]}>
          16px → {scaleFontSize(16)}px
        </Text>
        <Text style={[styles.sampleText, { fontSize: scaleFontSize(22) }]}>
          22px → {scaleFontSize(22)}px
        </Text>
        <Text style={[styles.sampleText, { fontSize: scaleFontSize(32) }]}>
          32px → {scaleFontSize(32)}px
        </Text>
      </View>

      {/* Spacing */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Espacements</Text>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: scaleSpacing(40), height: scaleSpacing(40) }]}>
            <Text style={styles.spacingText}>40px</Text>
          </View>
          <View style={[styles.spacingBox, { width: scaleSpacing(60), height: scaleSpacing(60) }]}>
            <Text style={styles.spacingText}>60px</Text>
          </View>
          <View style={[styles.spacingBox, { width: scaleSpacing(80), height: scaleSpacing(80) }]}>
            <Text style={styles.spacingText}>80px</Text>
          </View>
        </View>
      </View>

      {/* Responsive Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grille Responsive</Text>
        <ResponsiveGrid gap={Spacing.md}>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>Item 1</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>Item 2</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>Item 3</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridItemText}>Item 4</Text>
          </View>
        </ResponsiveGrid>
      </View>

      {/* Button Sizes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tailles de Boutons</Text>
        <Pressable style={[styles.button, { height: responsive.buttonHeight.small }]}>
          <Text style={styles.buttonText}>Small ({responsive.buttonHeight.small}px)</Text>
        </Pressable>
        <Pressable style={[styles.button, { height: responsive.buttonHeight.medium }]}>
          <Text style={styles.buttonText}>Medium ({responsive.buttonHeight.medium}px)</Text>
        </Pressable>
        <Pressable style={[styles.button, { height: responsive.buttonHeight.large }]}>
          <Text style={styles.buttonText}>Large ({responsive.buttonHeight.large}px)</Text>
        </Pressable>
      </View>

      {/* Icon Sizes */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Tailles d'Icônes</Text>
        <View style={styles.iconRow}>
          <View style={[styles.iconBox, { 
            width: responsive.iconSize.small, 
            height: responsive.iconSize.small 
          }]}>
            <Text style={styles.iconText}>S</Text>
          </View>
          <View style={[styles.iconBox, { 
            width: responsive.iconSize.medium, 
            height: responsive.iconSize.medium 
          }]}>
            <Text style={styles.iconText}>M</Text>
          </View>
          <View style={[styles.iconBox, { 
            width: responsive.iconSize.large, 
            height: responsive.iconSize.large 
          }]}>
            <Text style={styles.iconText}>L</Text>
          </View>
        </View>
      </View>

      {/* Theme Values */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Valeurs du Thème</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Spacing.xs:</Text>
          <Text style={styles.infoValue}>{Spacing.xs}px</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Spacing.md:</Text>
          <Text style={styles.infoValue}>{Spacing.md}px</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Spacing.xl:</Text>
          <Text style={styles.infoValue}>{Spacing.xl}px</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Radius.md:</Text>
          <Text style={styles.infoValue}>{Radius.md}px</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Radius.xl:</Text>
          <Text style={styles.infoValue}>{Radius.xl}px</Text>
        </View>
      </View>
    </ResponsiveContainer>
  );
}

function makeStyles(Colors, responsive) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Metrics.headerTop,
      paddingBottom: Spacing.md,
      marginBottom: Spacing.lg,
    },
    title: {
      ...Fonts.primary,
      ...Fonts.black,
      fontSize: scaleFontSize(24),
      color: Colors.text,
    },
    infoButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      backgroundColor: Colors.surface,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    infoButtonText: {
      ...Fonts.primary,
      ...Fonts.medium,
      fontSize: scaleFontSize(12),
      color: Colors.text,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.xl,
      padding: Metrics.cardPadding,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cardTitle: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: scaleFontSize(14),
      color: Colors.text,
      marginBottom: Spacing.md,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    infoLabel: {
      ...Fonts.primary,
      ...Fonts.medium,
      fontSize: scaleFontSize(13),
      color: Colors.textSecondary,
    },
    infoValue: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: scaleFontSize(13),
      color: Colors.text,
    },
    sampleText: {
      ...Fonts.primary,
      color: Colors.text,
      marginBottom: Spacing.sm,
    },
    spacingDemo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: Spacing.md,
    },
    spacingBox: {
      backgroundColor: Colors.accent,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    spacingText: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: scaleFontSize(10),
      color: Colors.pureWhite,
    },
    section: {
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: scaleFontSize(16),
      color: Colors.text,
      marginBottom: Spacing.md,
    },
    gridItem: {
      backgroundColor: Colors.surface,
      borderRadius: Radius.lg,
      padding: Metrics.cardPadding,
      borderWidth: 1,
      borderColor: Colors.border,
      minHeight: responsive.isSmallDevice ? 80 : 100,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridItemText: {
      ...Fonts.primary,
      ...Fonts.medium,
      fontSize: scaleFontSize(14),
      color: Colors.text,
    },
    button: {
      backgroundColor: Colors.accent,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    buttonText: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: scaleFontSize(14),
      color: Colors.pureWhite,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingVertical: Spacing.md,
    },
    iconBox: {
      backgroundColor: Colors.accent,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      ...Fonts.primary,
      ...Fonts.bold,
      fontSize: scaleFontSize(12),
      color: Colors.pureWhite,
    },
  });
}
