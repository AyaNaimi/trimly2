// src/components/ResponsiveContainer.js
// Conteneur responsive pour adapter le layout selon la taille de l'écran

import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

/**
 * Conteneur responsive avec SafeArea et gestion du clavier
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu du conteneur
 * @param {boolean} props.scroll - Activer le scroll (défaut: false)
 * @param {boolean} props.keyboardAware - Gérer le clavier (défaut: false)
 * @param {Object} props.style - Styles personnalisés
 * @param {Object} props.contentContainerStyle - Styles du contenu (pour ScrollView)
 * @param {boolean} props.edges - Edges SafeArea (défaut: ['top', 'bottom'])
 */
export function ResponsiveContainer({
  children,
  scroll = false,
  keyboardAware = false,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  ...props
}) {
  const { Colors } = useTheme();
  const { screenPadding, isSmallDevice, isTablet } = useResponsive();

  const containerStyle = [
    styles.container,
    { backgroundColor: Colors.bg },
    style,
  ];

  const contentStyle = [
    styles.content,
    { paddingHorizontal: screenPadding },
    contentContainerStyle,
  ];

  // Conteneur de base
  const Container = (
    <SafeAreaView style={containerStyle} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          {...props}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={contentStyle} {...props}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );

  // Avec gestion du clavier
  if (keyboardAware) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {Container}
      </KeyboardAvoidingView>
    );
  }

  return Container;
}

/**
 * Grille responsive pour afficher des éléments en colonnes
 * @param {Object} props
 * @param {React.ReactNode} props.children - Éléments de la grille
 * @param {number} props.columns - Nombre de colonnes (auto si non spécifié)
 * @param {number} props.gap - Espacement entre les éléments
 * @param {Object} props.style - Styles personnalisés
 */
export function ResponsiveGrid({ children, columns, gap = 16, style }) {
  const { isSmallDevice, isTablet, screenWidth } = useResponsive();

  // Déterminer le nombre de colonnes automatiquement
  const numColumns = columns || (isTablet ? 3 : isSmallDevice ? 1 : 2);

  const gridStyle = [
    styles.grid,
    {
      gap,
    },
    style,
  ];

  return (
    <View style={gridStyle}>
      {React.Children.map(children, (child, index) => {
        if (!child) return null;
        
        const itemStyle = {
          flex: 1,
          minWidth: (screenWidth - gap * (numColumns + 1)) / numColumns,
          maxWidth: numColumns === 1 ? '100%' : `${100 / numColumns - 2}%`,
        };

        return (
          <View key={index} style={itemStyle}>
            {child}
          </View>
        );
      })}
    </View>
  );
}

/**
 * Conteneur avec largeur maximale pour les grands écrans
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu
 * @param {number} props.maxWidth - Largeur maximale (défaut: 600)
 * @param {Object} props.style - Styles personnalisés
 */
export function ResponsiveMaxWidth({ children, maxWidth = 600, style }) {
  const { screenWidth, isTablet } = useResponsive();

  const containerStyle = [
    styles.maxWidthContainer,
    {
      maxWidth: isTablet ? maxWidth : screenWidth,
      width: '100%',
      alignSelf: 'center',
    },
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

/**
 * Espaceur responsive
 * @param {Object} props
 * @param {number} props.size - Taille de l'espace (multiplié par le facteur responsive)
 * @param {boolean} props.horizontal - Espacement horizontal (défaut: false)
 */
export function ResponsiveSpacer({ size = 16, horizontal = false }) {
  const { isSmallDevice } = useResponsive();
  
  const adjustedSize = isSmallDevice ? size * 0.75 : size;
  
  return (
    <View
      style={{
        width: horizontal ? adjustedSize : undefined,
        height: !horizontal ? adjustedSize : undefined,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  maxWidthContainer: {
    flex: 1,
  },
});

export default ResponsiveContainer;
