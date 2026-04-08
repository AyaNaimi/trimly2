// src/context/AppContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { DatabaseService } from '../services/databaseService';
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
  session: null,
  loaded: false,
};

function createFreshState(overrides = {}) {
  return {
    ...DEFAULT_APP_STATE,
    categories: DEFAULT_CATEGORIES,
    subscriptions: [],
    transactions: [],
    session: null,
    loaded: true,
    ...overrides,
  };
}

// ── Reducer ──
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_STATE':
      return { ...state, ...action.payload, loaded: true };

    case 'SET_SESSION':
      return { ...state, session: action.payload };

    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };

    case 'SET_ONBOARDING_STATUS':
      return { ...state, onboardingComplete: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      };

    case 'DELETE_CATEGORY': {
      const remainingTransactions = state.transactions.filter(t => t.category_id !== action.payload);
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
        transactions: remainingTransactions,
      };
    }

    case 'ADD_TRANSACTION': {
      const tx = action.payload;
      const updatedCats = state.categories.map(c => {
        if (c.id === tx.category_id && tx.type === 'expense') {
          return { ...c, spent: Math.round((c.spent + tx.amount) * 100) / 100 };
        }
        return c;
      });
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        categories: updatedCats,
      };
    }

    case 'DELETE_TRANSACTION': {
      const tx = state.transactions.find(t => t.id === action.payload);
      if (!tx) return state;
      const updatedCats = state.categories.map(c => {
        if (c.id === tx.category_id && tx.type === 'expense') {
          return { ...c, spent: Math.max(0, Math.round((c.spent - tx.amount) * 100) / 100) };
        }
        return c;
      });
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        categories: updatedCats,
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

    case 'SET_CURRENCY':
      return { ...state, currency: action.payload };

    case 'UPDATE_PROFILE':
    case 'SET_PROFILE':
      return { ...state, ...action.payload };

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };

    case 'UPDATE_FEATURES':
      return { ...state, features: { ...state.features, ...action.payload } };

    case 'SET_SUBSCRIPTION_PLAN':
      return { ...state, subscription: action.payload, trial: { ...state.trial, active: false } };

    case 'RESET_PERIOD':
      return {
        ...state,
        categories: state.categories.map(c => ({ ...c, spent: 0 })),
        income: 0,
        transactions: [],
      };

    case 'RESET_APP':
      return createFreshState({ onboardingComplete: true });

    case 'LOG_OUT':
      return createFreshState({ onboardingComplete: false, subscription: null });

    default:
      return state;
  }
}

// ── Provider ──
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // 1. Handle Supabase Auth Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (_event === 'SIGNED_OUT') {
        dispatch({ type: 'LOG_OUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load State (Local or Cloud)
  useEffect(() => {
    if (state.session) {
      syncCloud(state.session.user.id);
    } else {
      loadLocalState();
    }
  }, [state.session]);

  const loadLocalState = async () => {
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
  };

  const syncCloud = async (userId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [profile, categories, transactions, subscriptions] = await Promise.all([
        DatabaseService.getProfile(userId),
        DatabaseService.getCategories(userId),
        DatabaseService.getTransactions(userId),
        DatabaseService.getSubscriptions(userId)
      ]);

      if (profile) {
        dispatch({ type: 'SET_INCOME', payload: profile.income || 0 });
        dispatch({ type: 'SET_CURRENCY', payload: profile.currency || '€' });
        dispatch({ type: 'SET_NOTIF_LEVEL', payload: profile.notif_level || 1 });
        dispatch({ type: 'SET_ONBOARDING_STATUS', payload: !!profile.onboarding_complete });
      }

      // If new user (no categories), seed defaults
      if (categories && categories.length === 0) {
        const defaultCats = await DatabaseService.seedDefaultCategories(userId);
        dispatch({ type: 'SET_CATEGORIES', payload: defaultCats });
      } else {
        dispatch({ type: 'SET_CATEGORIES', payload: categories || [] });
      }

      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions || [] });
      dispatch({ type: 'SET_SUBSCRIPTIONS', payload: subscriptions || [] });
    } catch (error) {
      console.error('Initial Cloud Sync Error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 3. Persist Local State (only if not logged in)
  useEffect(() => {
    if (!state.loaded || state.session) return;
    const { loaded, session, ...toSave } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave)).catch(() => {});
  }, [state, state.session]);

  // 4. Re-schedule notifications
  useEffect(() => {
    if (!state.loaded) return;
    if (state.notifLevel > 0 && state.subscriptions.length > 0) {
      scheduleAllSubscriptionNotifications(state.subscriptions);
    }
    scheduleDailyReminders(state.notifLevel);
  }, [state.subscriptions, state.notifLevel, state.loaded]);

  const completeOnboarding = async () => {
    try {
      if (state.session) {
        await DatabaseService.updateProfile(state.session.user.id, { onboarding_complete: true });
      }
      dispatch({ type: 'COMPLETE_ONBOARDING' });
      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  };

  // ── Sync Actions ──

  const setIncome = async (income) => {
    try {
      if (state.session) {
        await DatabaseService.updateProfile(state.session.user.id, { income });
      }
      dispatch({ type: 'SET_INCOME', payload: income });
      return true;
    } catch (error) {
      console.error('Error sharing income:', error);
      return false;
    }
  };

  const setCurrency = async (currency) => {
    try {
      if (state.session) {
        await DatabaseService.updateProfile(state.session.user.id, { currency });
      }
      dispatch({ type: 'SET_CURRENCY', payload: currency });
      return true;
    } catch (error) {
      console.error('Error sharing currency:', error);
      return false;
    }
  };

  const setNotifLevel = async (level) => {
    try {
      if (state.session) {
        await DatabaseService.updateProfile(state.session.user.id, { notif_level: level });
      }
      dispatch({ type: 'SET_NOTIF_LEVEL', payload: level });
      scheduleDailyReminders(level);
      return true;
    } catch (error) {
      console.error('Error sharing notification level:', error);
      return false;
    }
  };

  const addTransaction = async (tx) => {
    try {
      if (state.session) {
        const cloudTx = await DatabaseService.addTransaction(state.session.user.id, tx);
        dispatch({ type: 'ADD_TRANSACTION', payload: cloudTx });
      } else {
        dispatch({ type: 'ADD_TRANSACTION', payload: { ...tx, id: `tx_${Date.now()}` } });
      }
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return false;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      if (state.session) {
        await DatabaseService.deleteTransaction(id);
      }
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
  };

  const addSubscription = async (sub) => {
    try {
      if (state.session) {
        const cloudSub = await DatabaseService.addSubscription(state.session.user.id, sub);
        dispatch({ type: 'ADD_SUBSCRIPTION', payload: cloudSub });
      } else {
        dispatch({ type: 'ADD_SUBSCRIPTION', payload: { ...sub, id: `sub_${Date.now()}` } });
      }
      return true;
    } catch (error) {
      console.error('Error adding subscription:', error);
      return false;
    }
  };

  const updateSubscription = async (id, updates) => {
    try {
      if (state.session) {
        await DatabaseService.updateSubscription(id, updates);
      }
      dispatch({ type: 'UPDATE_SUBSCRIPTION', payload: { id, ...updates } });
      return true;
    } catch (error) {
      console.error('Error updating subscription:', error);
      return false;
    }
  };

  const cancelSubscription = async (id) => {
    try {
      const updates = { active: false, cancelledAt: todayISO() };
      if (state.session) {
        await DatabaseService.updateSubscription(id, updates);
      }
      dispatch({ type: 'CANCEL_SUBSCRIPTION', payload: id });
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  };

  const deleteSubscription = async (id) => {
    try {
      if (state.session) {
        await DatabaseService.deleteSubscription(id);
      }
      dispatch({ type: 'DELETE_SUBSCRIPTION', payload: id });
      return true;
    } catch (error) {
      console.error('Error deleting subscription:', error);
      return false;
    }
  };

  const addCategory = async (cat) => {
    try {
      if (state.session) {
        const cloudCat = await DatabaseService.addCategory(state.session.user.id, cat);
        dispatch({ type: 'ADD_CATEGORY', payload: cloudCat });
      } else {
        dispatch({ type: 'ADD_CATEGORY', payload: { ...cat, id: `cat_${Date.now()}` } });
      }
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      return false;
    }
  };

  const updateCategory = async (id, updates) => {
    try {
      if (state.session) {
        await DatabaseService.updateCategory(id, updates);
      }
      dispatch({ type: 'UPDATE_CATEGORY', payload: { id, ...updates } });
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  };

  const deleteCategory = async (id) => {
    try {
      if (state.session) {
        await DatabaseService.deleteCategory(id);
      }
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (state.session) {
        await DatabaseService.updateProfile(state.session.user.id, updates);
      }
      dispatch({ type: 'UPDATE_PROFILE', payload: updates });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };
  // ── Helper selectors ──
  const totalMonthlySpent = state.categories.reduce((a, c) => a + c.spent, 0);
  const totalMonthlyBudget = state.categories.reduce((a, c) => a + c.budget, 0);

  const activeSubscriptions = (state.subscriptions || []).filter(s => s && s.active);
  const totalMonthlySubscriptions = activeSubscriptions.reduce((a, s) => {
    const monthly = { weekly: (s.amount * 52) / 12, monthly: s.amount, quarterly: s.amount / 3, annual: s.amount / 12 };
    return a + (monthly[s.cycle] || s.amount);
  }, 0);

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
    <AppContext.Provider
      value={{
        state,
        dispatch,
        totalMonthlySpent,
        totalMonthlyBudget,
        totalMonthlySubscriptions,
        activeSubscriptions,
        trialDaysLeft: trialDaysLeft(),
        isPro: isPro(),
        // New sync actions
        completeOnboarding,
        setIncome,
        setCurrency,
        setNotifLevel,
        addTransaction,
        deleteTransaction,
        addSubscription,
        updateSubscription,
        cancelSubscription,
        deleteSubscription,
        addCategory,
        updateCategory,
        deleteCategory,
        updateProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}


export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

