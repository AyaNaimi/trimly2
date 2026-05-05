// src/utils/responsive.js
// Système de dimensionnement responsive pour différents téléphones

import { Dimensions, Platform, PixelRatio } from 'react-native';

// ── Dimensions de référence (iPhone 11 Pro / iPhone X) ──────
const REFERENCE_WIDTH = 375;
const REFERENCE_HEIGHT = 812;

// ── Obtenir les dimensions actuelles de l'écran ─────────────
export function getScreenDimensions() {
  const { width, height } = Dimensions.get('window');
  return { width, height };
}

// ── Détection du type d'appareil ────────────────────────────
export function getDeviceType() {
  const { width, height } = getScreenDimensions();
  const aspectRatio = height / width;
  
  // Petit téléphone (iPhone SE, iPhone 8)
  if (width <= 375 && height <= 667) {
    return 'small';
  }
  
  // Téléphone standard (iPhone 11, iPhone 12/13/14)
  if (width <= 390 && height <= 844) {
    return 'medium';
  }
  
  // Grand téléphone (iPhone 14 Plus, iPhone 15 Pro Max)
  if (width <= 430 && height <= 932) {
    return 'large';
  }
  
  // Tablette
  if (width >= 600) {
    return 'tablet';
  }
  
  return 'medium'; // Par défaut
}

// ── Échelle responsive basée sur la largeur ─────────────────
export function scaleWidth(size) {
  const { width } = getScreenDimensions();
  return (width / REFERENCE_WIDTH) * size;
}

// ── Échelle responsive basée sur la hauteur ─────────────────
export function scaleHeight(size) {
  const { height } = getScreenDimensions();
  return (height / REFERENCE_HEIGHT) * size;
}

// ── Échelle modérée (compromis entre largeur et hauteur) ────
export function scaleModerate(size, factor = 0.5) {
  const scaledWidth = scaleWidth(size);
  return size + (scaledWidth - size) * factor;
}

// ── Échelle pour les polices ────────────────────────────────
export function scaleFontSize(size) {
  const deviceType = getDeviceType();
  const { width } = getScreenDimensions();
  
  // Facteur d'échelle basé sur le type d'appareil
  let scaleFactor = 1;
  
  switch (deviceType) {
    case 'small':
      scaleFactor = 0.9; // Réduire légèrement pour petits écrans
      break;
    case 'medium':
      scaleFactor = 1.0; // Taille de référence
      break;
    case 'large':
      scaleFactor = 1.1; // Augmenter légèrement pour grands écrans
      break;
    case 'tablet':
      scaleFactor = 1.3; // Augmenter pour tablettes
      break;
  }
  
  const scaled = size * scaleFactor;
  
  // Arrondir au pixel près pour éviter le flou
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

// ── Espacement responsive ────────────────────────────────────
export function scaleSpacing(size) {
  const deviceType = getDeviceType();
  
  switch (deviceType) {
    case 'small':
      return Math.max(size * 0.85, size - 4); // Réduire l'espacement
    case 'large':
      return size * 1.1; // Augmenter l'espacement
    case 'tablet':
      return size * 1.3; // Augmenter davantage pour tablettes
    default:
      return size;
  }
}

// ── Dimensions adaptatives pour les composants ───────────────
export function getAdaptiveDimensions() {
  const deviceType = getDeviceType();
  const { width, height } = getScreenDimensions();
  
  return {
    // Padding de l'écran
    screenPadding: deviceType === 'small' ? 12 : deviceType === 'tablet' ? 24 : 16,
    
    // Hauteur du header
    headerHeight: deviceType === 'small' ? 50 : deviceType === 'tablet' ? 70 : 60,
    
    // Taille des icônes
    iconSize: {
      small: deviceType === 'small' ? 16 : deviceType === 'tablet' ? 22 : 18,
      medium: deviceType === 'small' ? 20 : deviceType === 'tablet' ? 28 : 24,
      large: deviceType === 'small' ? 28 : deviceType === 'tablet' ? 40 : 32,
    },
    
    // Taille des boutons
    buttonHeight: {
      small: deviceType === 'small' ? 36 : deviceType === 'tablet' ? 48 : 40,
      medium: deviceType === 'small' ? 44 : deviceType === 'tablet' ? 56 : 48,
      large: deviceType === 'small' ? 52 : deviceType === 'tablet' ? 64 : 56,
    },
    
    // Taille des cartes
    cardPadding: deviceType === 'small' ? 12 : deviceType === 'tablet' ? 20 : 16,
    cardRadius: deviceType === 'small' ? 12 : deviceType === 'tablet' ? 20 : 16,
    
    // FAB
    fabSize: deviceType === 'small' ? 52 : deviceType === 'tablet' ? 64 : 56,
    fabBottom: deviceType === 'small' ? 90 : deviceType === 'tablet' ? 120 : 108,
    
    // Dimensions de l'écran
    screenWidth: width,
    screenHeight: height,
    isSmallDevice: deviceType === 'small',
    isLargeDevice: deviceType === 'large',
    isTablet: deviceType === 'tablet',
    deviceType,
  };
}

// ── Vérifier si l'écran est petit ───────────────────────────
export function isSmallScreen() {
  return getDeviceType() === 'small';
}

// ── Vérifier si l'écran est grand ───────────────────────────
export function isLargeScreen() {
  return getDeviceType() === 'large' || getDeviceType() === 'tablet';
}

// ── Obtenir la hauteur de la zone sûre ──────────────────────
export function getSafeAreaInsets() {
  const { height } = getScreenDimensions();
  const deviceType = getDeviceType();
  
  // Estimation des insets pour différents appareils
  if (Platform.OS === 'ios') {
    if (deviceType === 'small') {
      return { top: 20, bottom: 0 }; // iPhone SE, 8
    }
    return { top: 44, bottom: 34 }; // iPhone X et plus récents
  }
  
  return { top: 24, bottom: 0 }; // Android
}

// ── Valeurs responsive pour le thème ────────────────────────
export function getResponsiveTheme() {
  const dimensions = getAdaptiveDimensions();
  const deviceType = getDeviceType();
  
  return {
    // Spacing
    spacing: {
      none: 0,
      xs: scaleSpacing(4),
      sm: scaleSpacing(8),
      smd: scaleSpacing(12),
      md: scaleSpacing(16),
      mdLg: scaleSpacing(20),
      lg: scaleSpacing(24),
      xl: scaleSpacing(32),
      xxl: scaleSpacing(48),
    },
    
    // Font sizes
    fontSize: {
      xs: scaleFontSize(10),
      sm: scaleFontSize(12),
      md: scaleFontSize(14),
      lg: scaleFontSize(16),
      xl: scaleFontSize(18),
      xxl: scaleFontSize(22),
      xxxl: scaleFontSize(28),
      huge: scaleFontSize(38),
    },
    
    // Border radius
    radius: {
      none: 0,
      xs: deviceType === 'small' ? 4 : 6,
      sm: deviceType === 'small' ? 6 : 8,
      md: deviceType === 'small' ? 10 : 12,
      lg: deviceType === 'small' ? 14 : 16,
      xl: deviceType === 'small' ? 20 : 24,
      xxl: deviceType === 'small' ? 28 : 32,
      pill: 9999,
    },
    
    // Dimensions
    dimensions,
  };
}

// ── Hook pour écouter les changements de dimensions ──────────
export function useResponsive() {
  const [dimensions, setDimensions] = React.useState(getAdaptiveDimensions());
  
  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getAdaptiveDimensions());
    });
    
    return () => subscription?.remove();
  }, []);
  
  return dimensions;
}

// ── Utilitaires pour les styles conditionnels ───────────────
export function conditionalStyle(baseStyle, smallStyle, largeStyle) {
  const deviceType = getDeviceType();
  
  if (deviceType === 'small' && smallStyle) {
    return { ...baseStyle, ...smallStyle };
  }
  
  if ((deviceType === 'large' || deviceType === 'tablet') && largeStyle) {
    return { ...baseStyle, ...largeStyle };
  }
  
  return baseStyle;
}

// ── Calcul de colonnes pour les grilles ─────────────────────
export function getGridColumns(minColumnWidth = 150) {
  const { width } = getScreenDimensions();
  const deviceType = getDeviceType();
  
  // Padding horizontal total
  const horizontalPadding = deviceType === 'small' ? 24 : deviceType === 'tablet' ? 48 : 32;
  
  // Largeur disponible
  const availableWidth = width - horizontalPadding;
  
  // Nombre de colonnes
  const columns = Math.floor(availableWidth / minColumnWidth);
  
  return Math.max(1, Math.min(columns, deviceType === 'tablet' ? 4 : 2));
}

// ── Largeur de colonne pour les grilles ─────────────────────
export function getColumnWidth(columns = 2, gap = 16) {
  const { width } = getScreenDimensions();
  const dimensions = getAdaptiveDimensions();
  
  const totalGap = gap * (columns - 1);
  const totalPadding = dimensions.screenPadding * 2;
  
  return (width - totalPadding - totalGap) / columns;
}

export default {
  scaleWidth,
  scaleHeight,
  scaleModerate,
  scaleFontSize,
  scaleSpacing,
  getDeviceType,
  getScreenDimensions,
  getAdaptiveDimensions,
  isSmallScreen,
  isLargeScreen,
  getSafeAreaInsets,
  getResponsiveTheme,
  conditionalStyle,
  getGridColumns,
  getColumnWidth,
};
