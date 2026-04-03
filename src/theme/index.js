// src/theme/index.js
// Luna-inspired design system - Enhanced

export const Colors = {
  // Primary - Modern purple with depth
  purple: '#6366F1',
  purpleDark: '#4F46E5',
  purpleLight: '#E0E7FF',
  purpleXLight: '#F0F4FF',

  // Accent - Vibrant accent colors
  pink: '#EC4899',
  pinkLight: '#FCE7F3',
  pinkDark: '#BE185D',

  // Status colors - Refined
  green: '#10B981',
  greenLight: '#D1FAE5',
  greenDark: '#047857',
  red: '#EF4444',
  redLight: '#FEE2E2',
  redDark: '#DC2626',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  amberDark: '#B45309',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  blueDark: '#1D4ED8',

  // Neutral palette - Enhanced contrast
  bg: '#FAFAFA',
  bgSecondary: '#F3F4F6',
  white: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  borderDark: '#9CA3AF',

  // Dark mode support
  dark: '#0F172A',
  darkSecondary: '#1E293B',

  // Category icon backgrounds
  iconBg: (hex) => hex + '20',
};

export const Fonts = {
  black: { fontWeight: '900' },
  bold: { fontWeight: '700' },
  semiBold: { fontWeight: '600' },
  medium: { fontWeight: '500' },
  regular: { fontWeight: '400' },
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  pill: 100,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
};
