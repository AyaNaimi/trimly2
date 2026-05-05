// src/context/AppContext.js
import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
import { DatabaseService } from '../services/databaseService';
import { EmailService } from '../services/emailService';
import {
  clearGoogleProviderTokens,
  getStoredGoogleProviderTokens,
  storeGoogleProviderTokens,
} from '../services/googleAuthService';
import { DEFAULT_APP_STATE, DEFAULT_CATEGORIES } from '../data/initialData';
import { scheduleAllSubscriptionNotifications, scheduleDailyReminders } from '../utils/notifications';
import { todayISO } from '../utils/dateUtils';

const AppContext = createContext(null);

const STORAGE_KEY = '@trimly_state';
const EMAIL_SCAN_PROMPT_PREFIX = '@trimly_email_scan_prompted_';
const AUTO_EMAIL_SCAN_PREFIX = '@trimly_auto_email_scan_';

// ── Initial State ──
const initialState = {
  ...DEFAULT_APP_STATE,
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  subscriptions: [],
  emailConnections: [],
  scanHistory: [],
  detectedSubscriptions: [],
  emailScanPrompt: null,
  profile: null,
  session: null,
  guestMode: false,
  onboardingComplete: false,
  syncing: false,
  loaded: false,
};

function createFreshState(overrides = {}) {
  return {
    ...DEFAULT_APP_STATE,
    categories: DEFAULT_CATEGORIES,
    subscriptions: [],
    transactions: [],
    emailConnections: [],
    scanHistory: [],
    detectedSubscriptions: [],
    emailScanPrompt: null,
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

    case 'SET_EMAIL_SCAN_PROMPT':
      return { ...state, emailScanPrompt: action.payload };

    case 'CLEAR_EMAIL_SCAN_PROMPT':
      return { ...state, emailScanPrompt: null };

    case 'SET_EMAIL_CONNECTIONS':
      return { ...state, emailConnections: action.payload };

    case 'SET_SCAN_HISTORY':
      return { ...state, scanHistory: action.payload };

    case 'SET_DETECTED_SUBSCRIPTIONS':
      return { ...state, detectedSubscriptions: action.payload };

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
          s.id === action.payload ? { ...s, active: false } : s
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

    case 'SET_SUBSCRIPTION_PLAN':
      return { ...state, subscription: action.payload, trial: { ...state.trial, active: false } };

    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    case 'SET_PROFILE':
      return { ...state, profile: action.payload };

    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'SET_SUBSCRIPTIONS':
      return { ...state, subscriptions: action.payload };

    case 'UPDATE_FEATURES':
      return { ...state, features: { ...state.features, ...action.payload } };


    case 'RESET_PERIOD':
      return {
        ...state,
        categories: state.categories.map(c => ({ ...c, spent: 0 })),
        income: 0,
        transactions: [],
      };

    case 'RESET_APP':
      return createFreshState({ onboardingComplete: true });

    case 'SET_GUEST_MODE':
      return { ...state, guestMode: true };

    case 'LOG_OUT':
      return createFreshState({ onboardingComplete: false, subscription: null, guestMode: false });

    default:
      return state;
  }
}

// ── Provider ──
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const autoScanInFlightRef = useRef(false);

  const getEmailPromptStorageKey = (userId) => `${EMAIL_SCAN_PROMPT_PREFIX}${userId}`;
  const getAutoScanStorageKey = (userId) => `${AUTO_EMAIL_SCAN_PREFIX}${userId}`;

  const maybePromptEmailScan = async (session) => {
    const userId = session?.user?.id;
    const email = session?.user?.email?.trim();

    if (!userId || !email) return;

    try {
      const hasPrompted = await AsyncStorage.getItem(getEmailPromptStorageKey(userId));
      if (hasPrompted === '1') return;

      dispatch({
        type: 'SET_EMAIL_SCAN_PROMPT',
        payload: {
          userId,
          email,
          createdAt: Date.now(),
        },
      });
    } catch (error) {
      console.error('Error preparing email scan prompt:', error);
    }
  };

  const dismissAuthEmailScanPrompt = async () => {
    const userId = state.session?.user?.id || state.emailScanPrompt?.userId;

    try {
      if (userId) {
        await AsyncStorage.setItem(getEmailPromptStorageKey(userId), '1');
      }
    } catch (error) {
      console.error('Error saving email scan prompt state:', error);
    } finally {
      dispatch({ type: 'CLEAR_EMAIL_SCAN_PROMPT' });
    }
  };

  const getStoredConnectionForProvider = (provider, email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    return (state.emailConnections || []).find((item) => {
      if (!item || item.provider !== provider) return false;
      if (!normalizedEmail) return item.status === 'connected';
      return String(item.email || '').trim().toLowerCase() === normalizedEmail;
    });
  };

  const getGoogleTokensForAutomaticScan = async (session) => {
    const liveTokens = {
      accessToken: session?.provider_token || null,
      refreshToken: session?.provider_refresh_token || null,
    };

    if (liveTokens.accessToken || liveTokens.refreshToken) {
      return liveTokens;
    }

    const storedTokens = await getStoredGoogleProviderTokens();
    if (storedTokens?.accessToken || storedTokens?.refreshToken) {
      return {
        accessToken: storedTokens.accessToken || null,
        refreshToken: storedTokens.refreshToken || null,
      };
    }

    const savedConnection = getStoredConnectionForProvider('gmail', session?.user?.email);
    if (savedConnection?.access_token || savedConnection?.refresh_token) {
      return {
        accessToken: savedConnection.access_token || null,
        refreshToken: savedConnection.refresh_token || null,
      };
    }

    return {
      accessToken: null,
      refreshToken: null,
    };
  };

  // 1. Handle Supabase Auth Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      dispatch({ type: 'SET_SESSION', payload: session });
      if (session) {
        maybePromptEmailScan(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({ type: 'SET_SESSION', payload: session });

      if (session?.provider_token || session?.provider_refresh_token) {
        storeGoogleProviderTokens({
          userId: session?.user?.id,
          email: session?.user?.email,
          accessToken: session?.provider_token,
          refreshToken: session?.provider_refresh_token,
        });
      }

      if (session && (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION')) {
        maybePromptEmailScan(session);
      }
      if (_event === 'SIGNED_OUT') {
        clearGoogleProviderTokens();
        dispatch({ type: 'CLEAR_EMAIL_SCAN_PROMPT' });
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
      const [profile, categories, transactions, subscriptions, emailConnections, scanHistory, detectedSubscriptions] = await Promise.all([
        DatabaseService.getProfile(userId),
        DatabaseService.getCategories(userId),
        DatabaseService.getTransactions(userId),
        DatabaseService.getSubscriptions(userId),
        DatabaseService.getEmailConnections(userId).catch(() => []),
        DatabaseService.getScanHistory(userId).catch(() => []),
        DatabaseService.getDetectedSubscriptions(userId).catch(() => []),
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
      dispatch({ type: 'SET_EMAIL_CONNECTIONS', payload: emailConnections || [] });
      dispatch({ type: 'SET_SCAN_HISTORY', payload: scanHistory || [] });
      dispatch({ type: 'SET_DETECTED_SUBSCRIPTIONS', payload: detectedSubscriptions || [] });
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
    const syncNotifications = async () => {
      try {
        if (state.notifLevel > 0 && state.subscriptions.length > 0) {
          await scheduleAllSubscriptionNotifications(state.subscriptions);
        }
        await scheduleDailyReminders(state.notifLevel);
      } catch (error) {
        console.error('Notification scheduling failed:', error);
      }
    };

    syncNotifications();
  }, [state.subscriptions, state.notifLevel, state.loaded]);

  useEffect(() => {
    if (!state.loaded || !state.session?.user?.id) return undefined;

    maybeRunAutomaticEmailScan('session-ready');

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        maybeRunAutomaticEmailScan('app-foreground');
      }
    });

    return () => subscription.remove();
  }, [state.loaded, state.session?.user?.id, state.session?.user?.email, state.emailConnections, state.subscriptions]);

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

  const saveEmailScanResult = async ({
    provider,
    sourceEmail,
    connection = null,
    emailsScanned = 0,
    items = [],
    errorMessage = null,
    metadata = {},
  }) => {
    try {
      if (!state.session) {
        return {
          connection: connection || null,
          scan: null,
          detectedSubscriptions: items,
        };
      }

      const userId = state.session.user.id;
      let savedConnection = null;

      if (connection || sourceEmail) {
        savedConnection = await DatabaseService.upsertEmailConnection(userId, {
          provider,
          email: sourceEmail || connection?.email || state.session.user.email,
          providerUserId: connection?.providerUserId,
          accessToken: connection?.accessToken,
          refreshToken: connection?.refreshToken,
          scopes: connection?.scopes || [],
          status: errorMessage ? 'error' : (connection?.status || 'connected'),
          lastError: errorMessage,
          lastScannedAt: new Date().toISOString(),
        });
      }

      const scan = await DatabaseService.createScanHistory(userId, {
        connectionId: savedConnection?.id || null,
        provider,
        sourceEmail: sourceEmail || connection?.email || state.session.user.email,
        status: errorMessage ? 'failed' : (items.length ? 'completed' : 'empty'),
        emailsScanned,
        subscriptionsFound: items.length,
        errorMessage,
        metadata,
      });

      const detectedSubscriptions = await DatabaseService.replaceDetectedSubscriptions(
        userId,
        items.map(item => ({
          ...item,
          provider,
          sourceEmail: sourceEmail || connection?.email || state.session.user.email,
        })),
        {
          provider,
          sourceEmail: sourceEmail || connection?.email || state.session.user.email,
          scanId: scan.id,
        }
      );

      const [emailConnections, scanHistory, allDetectedSubscriptions] = await Promise.all([
        DatabaseService.getEmailConnections(userId).catch(() => state.emailConnections),
        DatabaseService.getScanHistory(userId).catch(() => state.scanHistory),
        DatabaseService.getDetectedSubscriptions(userId).catch(() => detectedSubscriptions),
      ]);

      dispatch({ type: 'SET_EMAIL_CONNECTIONS', payload: emailConnections });
      dispatch({ type: 'SET_SCAN_HISTORY', payload: scanHistory });
      dispatch({ type: 'SET_DETECTED_SUBSCRIPTIONS', payload: allDetectedSubscriptions });

      return {
        connection: savedConnection,
        scan,
        detectedSubscriptions,
      };
    } catch (error) {
      console.error('Error saving email scan result:', error);
      return null;
    }
  };

  const maybeRunAutomaticEmailScan = async (reason = 'auto') => {
    const session = state.session;
    const userId = session?.user?.id;
    const userEmail = session?.user?.email?.trim().toLowerCase();

    if (!state.loaded || !session || !userId || !userEmail || autoScanInFlightRef.current) {
      return false;
    }

    const storageKey = getAutoScanStorageKey(userId);
    const today = todayISO();

    try {
      const alreadyScannedToday = await AsyncStorage.getItem(storageKey);
      if (alreadyScannedToday === today) {
        return false;
      }

      const { accessToken, refreshToken } = await getGoogleTokensForAutomaticScan(session);
      if (!accessToken && !refreshToken) {
        return false;
      }

      autoScanInFlightRef.current = true;

      const existingNames = (state.subscriptions || []).map((item) => item?.name).filter(Boolean);
      const scanResult = await EmailService.runProviderScan({
        provider: 'gmail',
        email: userEmail,
        accessToken,
        refreshToken,
        existingNames,
      });

      await saveEmailScanResult({
        provider: 'gmail',
        sourceEmail: scanResult.raw?.connection?.email || userEmail,
        connection: {
          provider: 'gmail',
          email: scanResult.raw?.connection?.email || userEmail,
          providerUserId: scanResult.raw?.connection?.providerUserId || userId,
          accessToken: scanResult.raw?.connection?.accessToken || accessToken,
          refreshToken: scanResult.raw?.connection?.refreshToken || refreshToken,
          scopes: scanResult.raw?.connection?.scopes || ['https://www.googleapis.com/auth/gmail.readonly'],
          status: 'connected',
        },
        emailsScanned: scanResult.emailCount || 0,
        items: scanResult.subscriptions,
        metadata: {
          automatic: true,
          reason,
          mode: 'gmail-api-auto',
          matchedEmailCount: scanResult.raw?.matchedEmailCount || scanResult.emailCount || 0,
        },
      });

      await AsyncStorage.setItem(storageKey, today);
      return true;
    } catch (error) {
      console.error('Automatic Gmail scan failed:', error);
      return false;
    } finally {
      autoScanInFlightRef.current = false;
    }
  };

  const dismissDetectedSubscription = async (id) => {
    try {
      if (state.session) {
        await DatabaseService.markDetectedSubscriptionStatus(id, { status: 'dismissed' });
      }

      dispatch({
        type: 'SET_DETECTED_SUBSCRIPTIONS',
        payload: state.detectedSubscriptions.map(item =>
          item.id === id ? { ...item, status: 'dismissed' } : item
        ),
      });
      return true;
    } catch (error) {
      console.error('Error dismissing detected subscription:', error);
      return false;
    }
  };

  const importDetectedSubscription = async (detectedSub) => {
    try {
      const ok = await addSubscription({
        name: detectedSub.name,
        icon: detectedSub.icon,
        color: detectedSub.color,
        amount: detectedSub.amount,
        cycle: detectedSub.cycle,
        category: detectedSub.category,
        startDate: detectedSub.startDate,
        trialDays: detectedSub.trialDays || 0,
        active: true,
      });

      if (!ok) return false;

      if (state.session && detectedSub.id) {
        const latestSubscriptions = await DatabaseService.getSubscriptions(state.session.user.id);
        const imported = latestSubscriptions.find(item =>
          item.name === detectedSub.name &&
          Number(item.amount) === Number(detectedSub.amount) &&
          item.cycle === detectedSub.cycle
        );

        await DatabaseService.markDetectedSubscriptionStatus(detectedSub.id, {
          status: 'imported',
          importedSubscriptionId: imported?.id || null,
        });

        dispatch({
          type: 'SET_DETECTED_SUBSCRIPTIONS',
          payload: state.detectedSubscriptions.map(item =>
            item.id === detectedSub.id
              ? { ...item, status: 'imported', importedSubscriptionId: imported?.id || null }
              : item
          ),
        });
      }

      return true;
    } catch (error) {
      console.error('Error importing detected subscription:', error);
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
      const updates = { active: false };
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

  const updateFeatures = async (updates) => {
    try {
      const newFeatures = { ...state.features, ...updates };
      if (state.session) {
        await DatabaseService.updateProfile(state.session.user.id, { features: newFeatures });
      }
      dispatch({ type: 'UPDATE_FEATURES', payload: updates });
      return true;
    } catch (error) {
      console.error('Error updating features:', error);
      return false;
    }
  };

  const setSubscriptionPlan = async (plan) => {
    try {
      if (state.session) {
        await DatabaseService.updateProfile(state.session.user.id, { subscription_plan: plan });
      }
      dispatch({ type: 'SET_SUBSCRIPTION_PLAN', payload: plan });
      return true;
    } catch (error) {
      console.error('Error setting subscription plan:', error);
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


  // ── Helper selectors ──
  const totalMonthlySpent = state.categories.reduce((a, c) => a + c.spent, 0);
  const totalMonthlyBudget = state.categories.reduce((a, c) => a + c.budget, 0);

  const activeSubscriptions = (state.subscriptions || []).filter(s => s && s.active);
  const pendingDetectedSubscriptions = (state.detectedSubscriptions || []).filter(item => item?.status === 'pending');
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
        pendingDetectedSubscriptions,
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
        updateFeatures,
        setSubscriptionPlan,
        dismissAuthEmailScanPrompt,
        saveEmailScanResult,
        dismissDetectedSubscription,
        importDetectedSubscription,
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
