// src/theme/index.js
// Trimly — Understated Luxury: Monochrome Sophistication

import { Platform } from 'react-native';
import { 
  scaleFontSize, 
  scaleSpacing, 
  getAdaptiveDimensions,
  getDeviceType 
} from '../utils/responsive';

// ── Light Colors (Refined Monochrome) ─────────────────────────
export const LightColors = {
  // ── Backgrounds ──────────────────────────────────────────
  bg: '#FFFFFF',
  surface: '#F8FAFC',     // Slate 50
  surfaceAlt: '#F1F5F9',  // Slate 100
  white: '#FFFFFF',

  // ── Text ─────────────────────────────────────────────────
  text: '#0F172A',         // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8',    // Slate 400

  // ── Primary Accent ────────────────────────────────────────
  accent: '#1E293B',       // Slate 800
  accentDeep: '#0F172A',   // Slate 900
  accentSecondary: '#334155',
  accentMuted: '#F1F5F9',
  accentSoft: 'rgba(30, 41, 59, 0.05)',

  // ── Semantic ─────────────────────────────────────────────
  income: '#10B981',       // Emerald 500
  incomeSoft: 'rgba(16, 185, 129, 0.10)',
  expense: '#E11D48',      // Rose 600
  expenseSoft: 'rgba(225, 29, 72, 0.10)',

  // Legacy aliases
  success: '#10B981',
  error: '#E11D48',
  warning: '#F59E0B',
  warningSoft: 'rgba(245, 158, 11, 0.10)',

  // ── Structural ───────────────────────────────────────────
  border: '#F1F5F9',       // Slate 100
  borderStrong: '#E2E8F0', // Slate 200
  borderSoft: '#F8FAFC',   // Slate 50
  errorSoft: 'rgba(225, 29, 72, 0.08)',
  backdrop: 'rgba(0,0,0,0.18)',
  shimmer: 'rgba(255, 255, 255, 0.65)',
  shimmerBg: '#F1F5F9',

  // ── Constant ─────────────────────────────────────────────
  pureWhite: '#FFFFFF',
  pureBlack: '#000000',
};

LightColors.glass = (alpha = 0.72) => `rgba(255, 255, 255, ${alpha})`;

// ── Dark Colors (Analytical Chic / Logo-Inspired) ────────────
export const DarkColors = {
  // ── Backgrounds (Midnight Blue Palette) ────────────────────
  bg: '#000814',           // Logo Match (Deepest Midnight)
  surface: '#050B18',      // Slate-Blue Card BG
  surfaceAlt: '#0A1128',   // Lighter layer
  white: '#050B18',        // Standard card bg

  // ── Text ─────────────────────────────────────────────────
  text: '#F8FAFC',         // Slate 50
  textSecondary: '#94A3B8', // Slate 400
  textMuted: '#475569',    // Slate 600

  // ── Primary Accents (Logo Gradient: Indigo to Orange) ─────
  accent: '#5B3BF5',       // Logo Indigo
  accentDeep: '#3C096C',   // Deep Purple
  accentSecondary: '#FF9100', // Logo Orange (Vibrant Contrast)
  accentMuted: '#0A1128',
  accentSoft: 'rgba(91, 59, 245, 0.12)',

  // ── Semantic (Neon/Vibrant Palette) ───────────────────────
  income: '#00F5D4',       // Neon Teal
  incomeSoft: 'rgba(0, 245, 212, 0.12)',
  expense: '#F15BB5',      // Neon Magenta
  expenseSoft: 'rgba(241, 91, 181, 0.12)',

  // Legacy aliases
  success: '#00F5D4',
  error: '#F15BB5',
  warning: '#FF9E00',
  warningSoft: 'rgba(255, 158, 0, 0.12)',

  // ── Structural ───────────────────────────────────────────
  border: '#0D1B2A',       // Deep Blue Border
  borderStrong: '#1B263B', // Mid Blue Border
  borderSoft: '#050B18',
  errorSoft: 'rgba(241, 91, 181, 0.10)',
  backdrop: 'rgba(0,0,0,0.85)',
  shimmer: 'rgba(255, 255, 255, 0.04)',
  shimmerBg: '#050B18',

  // ── Constant ─────────────────────────────────────────────
  pureWhite: '#FFFFFF',
  pureBlack: '#000000',
};

DarkColors.glass = (alpha = 0.72) => `rgba(0, 8, 20, ${alpha})`;

// ── Legacy export (defaults to light for backward compat) ────
export const Colors = LightColors;

// ── Typography ──────────────────────────────────────────────
export const Fonts = {
  primary: {
    fontFamily: Platform.select({ ios: 'HelveticaNeue', android: 'sans-serif' }),
    letterSpacing: -0.2,
  },
  secondary: {
    fontFamily: Platform.select({ ios: 'HelveticaNeue-Light', android: 'sans-serif-light' }),
  },
  black:    { fontWeight: '800' },
  bold:     { fontWeight: '700' },
  semiBold: { fontWeight: '600' },
  medium:   { fontWeight: '500' },
  regular:  { fontWeight: '400' },
  light:    { fontWeight: '300' },
};

Fonts.sans  = Fonts.primary;
Fonts.serif = {
  fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  letterSpacing: -0.3,
};

// ── Border Radius (Responsive) ──────────────────────────────
const adaptiveDimensions = getAdaptiveDimensions();
const deviceType = getDeviceType();

export const Radius = {
  none: 0,
  xs:   deviceType === 'small' ? 4 : 6,
  sm:   deviceType === 'small' ? 6 : 8,
  md:   deviceType === 'small' ? 10 : 12,
  lg:   deviceType === 'small' ? 14 : 16,
  xl:   deviceType === 'small' ? 20 : 24,
  xxl:  deviceType === 'small' ? 28 : 32,
  pill: 9999,
};

// ── Spacing (Responsive) ────────────────────────────────────
export const Spacing = {
  none: 0,
  xs:   scaleSpacing(4),
  sm:   scaleSpacing(8),
  smd:  scaleSpacing(12),
  md:   scaleSpacing(16),
  mdLg: scaleSpacing(20),
  lg:   scaleSpacing(24),
  xl:   scaleSpacing(32),
  xxl:  scaleSpacing(48),
};

// ── Metrics (Responsive) ────────────────────────────────────
export const Metrics = {
  screenPadding:     adaptiveDimensions.screenPadding,
  sectionGap:        Spacing.lg,
  cardGap:           Spacing.md,
  headerTop:         deviceType === 'small' ? 16 : 20,
  fabBottom:         adaptiveDimensions.fabBottom,
  fabBottomElevated: adaptiveDimensions.fabBottom + 16,
  minTouch:          44, // Respecter les guidelines d'accessibilité
  iconSize:          adaptiveDimensions.iconSize,
  buttonHeight:      adaptiveDimensions.buttonHeight,
  cardPadding:       adaptiveDimensions.cardPadding,
};

// ── Shadows ──────────────────────────────────────────────────
export const Shadow = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  premium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
};

Shadow.sm = Shadow.soft;
Shadow.md = Shadow.medium;
Shadow.lg = Shadow.premium;

// ── Layout Presets (light defaults — use makeLayout(Colors) for dynamic) ──
export const Layout = {
  card: {
    backgroundColor: LightColors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     LightColors.border,
    ...Shadow.soft,
  },
  listItem: {
    backgroundColor:    LightColors.white,
    paddingVertical:    Spacing.md,
    borderBottomWidth:  1,
    borderBottomColor:  LightColors.border,
  },
  actionButton: {
    backgroundColor: LightColors.accent,
    borderRadius:    Radius.md,
    padding:         Spacing.md,
    alignItems:      'center',
    justifyContent:  'center',
  },
};

Layout.interactiveCard = { ...Layout.card, backgroundColor: LightColors.white };
Layout.premiumCard     = { ...Layout.card, borderColor: LightColors.borderStrong, ...Shadow.medium };
Layout.glassCard       = { ...Layout.card, backgroundColor: LightColors.glass() };

/** Helper: build dynamic layout presets from a Colors object */
export function makeLayout(Colors) {
  const card = {
    backgroundColor: Colors.white,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    borderWidth:     1,
    borderColor:     Colors.border,
    ...Shadow.soft,
  };
  return {
    card,
    listItem: {
      backgroundColor:    Colors.white,
      paddingVertical:    Spacing.md,
      borderBottomWidth:  1,
      borderBottomColor:  Colors.border,
    },
    actionButton: {
      backgroundColor: Colors.accent,
      borderRadius:    Radius.md,
      padding:         Spacing.md,
      alignItems:      'center',
      justifyContent:  'center',
    },
    interactiveCard: { ...card },
    premiumCard:     { ...card, borderColor: Colors.borderStrong, ...Shadow.medium },
    glassCard:       { ...card, backgroundColor: Colors.glass() },
  };
}
