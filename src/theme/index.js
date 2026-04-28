// src/theme/index.js
// Trimly-Minimal: Understated Luxury & Professional Simplicity

import { Platform } from 'react-native';

export const Colors = {
  // Monochrome Sophistication
  bg: '#FFFFFF',
  surface: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  
  // Professional Accent (Deep Slate / Royal)
  accent: '#1E293B',
  accentSecondary: '#334155',
  accentMuted: '#F1F5F9',
  accentSoft: '#F8FAFC',
  
  // Semantic (Simplified)
  success: '#020617', // Use dark for positive instead of green
  error: '#BE123C',   // Refined deep red
  warning: '#D97706',
  
  // Budget Health System
  budgetHealthy: '#10B981',      // Green - on track
  budgetWarning: '#F59E0B',      // Amber - caution zone
  budgetOver: '#EF4444',         // Red - over budget
  budgetCritical: '#BE123C',     // Deep red - significantly over
  
  // Structural
  border: '#F1F5F9',
  borderStrong: '#E2E8F0',
  borderSoft: '#F1F5F9',
  errorSoft: '#FFE4E6',
};

Colors.glass = (alpha = 0.72) => `rgba(255, 255, 255, ${alpha})`;

export const Fonts = {
  // Balanced professional sans-serif for everything
  primary: {
    fontFamily: Platform.select({ ios: 'HelveticaNeue', android: 'sans-serif' }),
    letterSpacing: -0.2,
  },
  // Keep secondary for metadata but keep it clean
  secondary: {
    fontFamily: Platform.select({ ios: 'HelveticaNeue-Light', android: 'sans-serif-light' }),
  },
  
  // Standard Weights for professional look
  black: { fontWeight: '800' },
  bold: { fontWeight: '700' },
  semiBold: { fontWeight: '600' },
  medium: { fontWeight: '500' },
  regular: { fontWeight: '400' },
  light: { fontWeight: '300' },
};

Fonts.sans = Fonts.primary;
Fonts.serif = {
  fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
  letterSpacing: -0.3,
};

export const Radius = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  pill: 9999,
};

export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  mdLg: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Metrics = {
  screenPadding: Spacing.md,
  sectionGap: Spacing.lg,
  cardGap: Spacing.md,
  headerTop: 20,
  fabBottom: 108,
  fabBottomElevated: 124,
  minTouch: 44,
};

export const Shadow = {
  // Almost invisible, high-end shadows
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
  // Flattened premium
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

export const Layout = {
  // Minimal card style
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.soft,
  },
  // Flat list item
  listItem: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  // For key actions
  actionButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
};

Layout.interactiveCard = {
  ...Layout.card,
  backgroundColor: Colors.white,
};

Layout.premiumCard = {
  ...Layout.card,
  borderColor: Colors.borderStrong,
  ...Shadow.medium,
};

Layout.glassCard = {
  ...Layout.card,
  backgroundColor: Colors.glass(),
};
