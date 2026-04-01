// src/data/initialData.js
import { todayISO } from '../utils/dateUtils';

// Default expense categories matching Luna's design
export const DEFAULT_CATEGORIES = [
  {
    id: 'cat_eating_out',
    name: 'Eating out',
    icon: '🍽️',
    color: '#FF2D78',
    budget: 0,
    spent: 0,
    cycle: 'weekly',
  },
  {
    id: 'cat_entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: '#F59E0B',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_gas',
    name: 'Gas',
    icon: '⛽',
    color: '#22C55E',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_groceries',
    name: 'Groceries',
    icon: '🛒',
    color: '#EF4444',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_internet',
    name: 'Internet',
    icon: '🌐',
    color: '#FF2D78',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_medicine',
    name: 'Medicine',
    icon: '💊',
    color: '#F59E0B',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_personal_care',
    name: 'Personal Care',
    icon: '🧴',
    color: '#22C55E',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_phone',
    name: 'Phone Bill',
    icon: '📱',
    color: '#3B82F6',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_transport',
    name: 'Public Transport',
    icon: '🚇',
    color: '#3B82F6',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_rent',
    name: 'Rent',
    icon: '🏠',
    color: '#6B7280',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
  },
  {
    id: 'cat_savings',
    name: 'Savings',
    icon: '🏦',
    color: '#16A34A',
    budget: 0,
    spent: 0,
    cycle: 'monthly',
    type: 'savings',
  },
];

// Onboarding category suggestions grouped by section (like Luna)
export const ONBOARDING_CAT_GROUPS = [
  {
    label: 'Essentiels',
    color: '#FF2D78',
    items: [
      { name: 'Loyer', icon: '🏠', color: '#6B7280', cycle: 'monthly' },
      { name: 'Électricité', icon: '💡', color: '#F59E0B', cycle: 'monthly' },
      { name: 'Forfait mobile', icon: '📱', color: '#3B82F6', cycle: 'monthly' },
      { name: 'Internet', icon: '🌐', color: '#FF2D78', cycle: 'monthly' },
      { name: 'Assurance', icon: '🛡️', color: '#6B7280', cycle: 'monthly' },
    ],
  },
  {
    label: 'Alimentation',
    color: '#FF9500',
    items: [
      { name: 'Café', icon: '☕', color: '#92400E', cycle: 'weekly' },
      { name: 'Restaurants', icon: '🍽️', color: '#FF2D78', cycle: 'weekly' },
      { name: 'Courses', icon: '🛒', color: '#EF4444', cycle: 'monthly' },
    ],
  },
  {
    label: 'Transport',
    color: '#5B3BF5',
    items: [
      { name: 'Essence', icon: '⛽', color: '#22C55E', cycle: 'monthly' },
      { name: 'Uber/Taxi', icon: '🚗', color: '#000', cycle: 'weekly' },
      { name: 'Transports', icon: '🚇', color: '#3B82F6', cycle: 'monthly' },
    ],
  },
  {
    label: 'Divertissement & Loisirs',
    color: '#FF2D78',
    items: [
      { name: 'Sorties', icon: '🎉', color: '#5B3BF5', cycle: 'monthly' },
      { name: 'Sport', icon: '🏋️', color: '#22C55E', cycle: 'monthly' },
      { name: 'Jeux', icon: '🎮', color: '#5B3BF5', cycle: 'monthly' },
    ],
  },
  {
    label: 'Santé & Bien-être',
    color: '#22C55E',
    items: [
      { name: 'Pharmacie', icon: '💊', color: '#F59E0B', cycle: 'monthly' },
      { name: 'Médecin', icon: '🏥', color: '#EF4444', cycle: 'monthly' },
      { name: 'Soins perso', icon: '🧴', color: '#22C55E', cycle: 'monthly' },
    ],
  },
];

// Quick-add popular subscriptions
export const QUICK_SUBSCRIPTIONS = [
  { name: 'Netflix', icon: '🎬', color: '#E50914', amount: 15.99, cycle: 'monthly', category: 'Streaming' },
  { name: 'Spotify', icon: '🎵', color: '#1DB954', amount: 9.99, cycle: 'monthly', category: 'Musique' },
  { name: 'Disney+', icon: '🏰', color: '#113CCF', amount: 8.99, cycle: 'monthly', category: 'Streaming' },
  { name: 'Apple TV+', icon: '🍎', color: '#000000', amount: 4.99, cycle: 'monthly', category: 'Streaming' },
  { name: 'YouTube Premium', icon: '▶️', color: '#FF0000', amount: 11.99, cycle: 'monthly', category: 'Streaming' },
  { name: 'Amazon Prime', icon: '📦', color: '#FF9900', amount: 69.99, cycle: 'annual', category: 'Shopping' },
  { name: 'Adobe CC', icon: '🎨', color: '#FF0000', amount: 59.99, cycle: 'monthly', category: 'Productivité' },
  { name: 'Microsoft 365', icon: '🖥️', color: '#0078D4', amount: 6.99, cycle: 'monthly', category: 'Productivité' },
  { name: 'iCloud+', icon: '☁️', color: '#0A84FF', amount: 0.99, cycle: 'monthly', category: 'Stockage' },
  { name: 'Google One', icon: '🔵', color: '#4285F4', amount: 1.99, cycle: 'monthly', category: 'Stockage' },
  { name: 'Deezer', icon: '🎶', color: '#FF0092', amount: 9.99, cycle: 'monthly', category: 'Musique' },
  { name: 'Canal+', icon: '📺', color: '#000000', amount: 24.99, cycle: 'monthly', category: 'Streaming' },
  { name: 'Notion', icon: '📝', color: '#000000', amount: 8.00, cycle: 'monthly', category: 'Productivité' },
  { name: 'Dropbox', icon: '📁', color: '#0061FF', amount: 9.99, cycle: 'monthly', category: 'Stockage' },
  { name: 'NordVPN', icon: '🔒', color: '#4687FF', amount: 4.49, cycle: 'monthly', category: 'Sécurité' },
  { name: 'ChatGPT Plus', icon: '🤖', color: '#10A37F', amount: 20.00, cycle: 'monthly', category: 'IA' },
];

// Default subscription categories
export const SUB_CATEGORIES = ['Streaming', 'Musique', 'Stockage', 'Productivité', 'Santé & Sport', 'Sécurité', 'IA', 'Shopping', 'Autre'];

// Color palette for category creation (like Luna)
export const CATEGORY_COLORS = [
  '#EF4444', '#FF2D78', '#EC4899', '#A855F7', '#5B3BF5',
  '#3B82F6', '#06B6D4', '#22C55E', '#84CC16', '#F59E0B',
  '#F97316', '#6B7280', '#0F172A',
];

// Default app state
export const DEFAULT_APP_STATE = {
  onboardingComplete: false,
  income: 0,
  incomeCycle: 'monthly',
  currency: '€',
  notifLevel: 1, // 0=off, 1=gentle, 2=aggressive, 3=relentless
  trial: {
    active: true,
    startDate: todayISO(),
    durationDays: 14,
  },
  subscription: null, // null = free/trial, 'monthly'|'annual'|'lifetime'
  features: {
    budgeting: true,
    incomeTracking: true,
    reports: true,
    rounding: false,
    faceId: false,
  },
};
