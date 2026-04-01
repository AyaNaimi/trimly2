// src/context/AppContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_APP_STATE, DEFAULT_CATEGORIES } from '../data/initialData';
import { scheduleAllSubscriptionNotifications, scheduleDailyReminders } from '../utils/notifications';
import { todayISO } from '../utils/dateUtils';

const AppContext = createContext(null);

const STORAGE_KEY = '@trimly_state';

// ── Initial State ──
const initialState = {
  ...DEFAULT_APP_STATE,
  categories: DEFAULT_CATEGORIES,
  subscriptions: [],
  transactions: [],
  loaded: false,
};

// ── Reducer ──
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload, loaded: true };

    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };

    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };

    case 'ADD_TRANSACTION': {
      const tx = action.payload;
      const updatedCats = state.categories.map(c => {
        if (c.id === tx.categoryId && tx.type === 'expense') {
          return { ...c, spent: Math.round((c.spent + tx.amount) * 100) / 100 };
        }
        return c;
      });
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        categories: updatedCats,
        income: tx.type === 'income' ? state.income + tx.amount : state.income,
      };
    }

    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find(t => t.id === action.payload);
      if (!tx) return state;
      const updatedCats = state.categories.map(c => {
        if (c.id === tx.categoryId && tx.type === 'expense') {
          return { ...c, spent: Math.max(0, Math.round((c.spent - tx.amount) * 100) / 100) };
        }
        return c;
      });
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        categories: updatedCats,
        income: tx.type === 'income' ? state.income - tx.amount : state.income,
      };
    }

    case 'ADD_SUBSCRIPTION':
      return { ...state, subscriptions: [...state.subscriptions, action.payload] };

    case 'UPDATE_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.map(s =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        ),
      };

    case 'CANCEL_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: state.subscriptions.map(s =>
          s.id === action.payload ? { ...s, active: false, cancelledAt: todayISO() } : s
        ),
      };

    case 'DELETE_SUBSCRIPTION':
      return { ...state, subscriptions: state.subscriptions.filter(s => s.id !== action.payload) };

    case 'SET_INCOME':
      return { ...state, income: action.payload };

    case 'SET_NOTIF_LEVEL':
      return { ...state, notifLevel: action.payload };

    case 'UPDATE_FEATURES':
      return { ...state, features: { ...state.features, ...action.payload } };

    case 'SET_SUBSCRIPTION_PLAN':
      return { ...state, subscription: action.payload, trial: { ...state.trial, active: false } };

    case 'RESET_PERIOD':
      // Called at start of new week/month to reset spent amounts
      return {
        ...state,
        categories: state.categories.map(c => ({ ...c, spent: 0 })),
        income: 0,
        transactions: [],
      };

    default:
      return state;
  }
}

// ── Provider ──
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          dispatch({ type: 'LOAD_STATE', payload: JSON.parse(saved) });
        } else {
          dispatch({ type: 'LOAD_STATE', payload: {} });
        }
      } catch {
        dispatch({ type: 'LOAD_STATE', payload: {} });
      }
    })();
  }, []);

  // Persist state on every change
  useEffect(() => {
    if (!state.loaded) return;
    const { loaded, ...toSave } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state]);

  // Re-schedule notifications when subscriptions or notif level changes
  useEffect(() => {
    if (!state.loaded) return;
    if (state.notifLevel > 0 && state.subscriptions.length > 0) {
      scheduleAllSubscriptionNotifications(state.subscriptions);
    }
    scheduleDailyReminders(state.notifLevel);
  }, [state.subscriptions, state.notifLevel, state.loaded]);

  // ── Helper selectors ──
  const totalMonthlySpent = state.categories.reduce((a, c) => a + c.spent, 0);
  const totalMonthlyBudget = state.categories.reduce((a, c) => a + c.budget, 0);

  const activeSubscriptions = state.subscriptions.filter(s => s.active);
  const totalMonthlySubscriptions = activeSubscriptions.reduce((a, s) => {
    const monthly = { weekly: s.amount * 52 / 12, monthly: s.amount, quarterly: s.amount / 3, annual: s.amount / 12 };
    return a + (monthly[s.cycle] || s.amount);
  }, 0);

  // Trial status
  const trialDaysLeft = () => {
    if (!state.trial?.active) return 0;
    const start = new Date(state.trial.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (state.trial.durationDays || 14));
    const today = new Date();
    return Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
  };

  const isPro = () => {
    if (state.subscription) return true;
    return trialDaysLeft() > 0;
  };

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      totalMonthlySpent,
      totalMonthlyBudget,
      totalMonthlySubscriptions,
      activeSubscriptions,
      trialDaysLeft: trialDaysLeft(),
      isPro: isPro(),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
