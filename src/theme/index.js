// src/theme/index.js
// Luna-inspired design system

export const Colors = {
  // Primary
  purple: '#5B3BF5',
  purpleLight: '#EDE9FE',
  purpleXLight: '#F5F3FF',

  // Accent
  pink: '#FF2D78',
  pinkLight: '#FFF0F5',

  // Semantic
  green: '#16A34A',
  greenLight: '#DCFCE7',
  red: '#EF4444',
  redLight: '#FEE2E2',
  amber: '#F59E0B',
  amberLight: '#FEF3C7',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',

  // Neutral
  bg: '#ffffffff',
  white: '#FFFFFF',
  text: '#0F0F1A',
  textSecondary: '#8E8EA0',
  border: '#EEEEF2',
  borderStrong: '#D1D5DB',

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
  lg: 16,
  xl: 20,
  pill: 100,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
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
};
