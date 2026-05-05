// src/services/emailService.js
// Shared service for provider and manual email subscription scans
import { QUICK_SUBSCRIPTIONS } from '../data/initialData';
import { supabase } from '../utils/supabase';
import { formatDate, getNextBilling } from '../utils/dateUtils';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const LOCAL_EMAIL_SCANNER_URL = process.env.EXPO_PUBLIC_EMAIL_SCANNER_URL || 'http://localhost:3001';

const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    icon: '📧',
    color: '#EA4335',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata',
    ],
    clientId: process.env.EXPO_PUBLIC_GMAIL_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  },
  outlook: {
    name: 'Outlook',
    icon: '📨',
    color: '#0078D4',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['openid', 'profile', 'email', 'offline_access', 'Mail.Read'],
    clientId: process.env.EXPO_PUBLIC_OUTLOOK_CLIENT_ID || '',
  },
  manual: {
    name: 'Scan manuel',
    icon: '@',
    color: '#0F172A',
    authUrl: '',
    tokenUrl: '',
    scopes: [],
    clientId: '',
  },
};

const SERVICE_ICONS = {
  Netflix: '🎬',
  Spotify: '🎵',
  'Disney+': '🏰',
  ChatGPT: '🤖',
  OpenAI: '🤖',
  Amazon: '📦',
  YouTube: '▶️',
  Apple: '🍎',
  Microsoft: '💻',
  Adobe: '🎨',
  Dropbox: '📁',
  Notion: '📝',
  iCloud: '☁️',
  Google: '🔍',
  'Canal+': '📺',
  Deezer: '🎶',
  NordVPN: '🔒',
  Slack: '💬',
  Zoom: '📹',
};

const SERVICE_ALTERNATIVES = {
  Netflix: ['Disney+', 'Prime Video', 'Canal+'],
  Spotify: ['Deezer', 'YouTube Music', 'Apple Music'],
  'Disney+': ['Netflix', 'Prime Video', 'Canal+'],
  'Amazon Prime': ['Netflix', 'Canal+', 'Disney+'],
  'YouTube Premium': ['Spotify', 'Deezer', 'Apple Music'],
  ChatGPT: ['Claude Pro', 'Gemini Advanced', 'Perplexity Pro'],
  Adobe: ['Canva Pro', 'Affinity', 'Figma Pro'],
  'Microsoft 365': ['Google Workspace', 'Notion', 'LibreOffice'],
  'Google One': ['iCloud+', 'Dropbox', 'OneDrive'],
  'Apple iCloud+': ['Google One', 'Dropbox', 'OneDrive'],
  Notion: ['Obsidian Sync', 'ClickUp', 'Evernote'],
  Dropbox: ['Google Drive', 'OneDrive', 'iCloud+'],
  Slack: ['Discord', 'Microsoft Teams', 'Google Chat'],
  Zoom: ['Google Meet', 'Microsoft Teams', 'Whereby'],
};

function getBestMatchIcon(name = '') {
  const lower = name.toLowerCase();

  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key.toLowerCase())) {
      return icon;
    }
  }

  return '📦';
}

function getBestMatchColor(name = '') {
  const lower = name.toLowerCase();
  const quick = QUICK_SUBSCRIPTIONS.find((item) => lower.includes(item.name.toLowerCase()));
  return quick?.color || '#0F172A';
}

export function getSuggestedAlternatives(name = '') {
  const lower = String(name || '').toLowerCase();

  for (const [service, alternatives] of Object.entries(SERVICE_ALTERNATIVES)) {
    if (lower.includes(service.toLowerCase())) {
      return alternatives;
    }
  }

  return [];
}

function normalizeCycle(value = '') {
  const lower = String(value || '').toLowerCase();

  if (lower.includes('week')) return 'weekly';
  if (lower.includes('quarter')) return 'quarterly';
  if (lower.includes('year') || lower.includes('annual') || lower.includes('annuel')) return 'annual';
  return 'monthly';
}

function normalizeAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeTrialDays(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function getRawPayloadValue(item = {}, key) {
  return item?.rawPayload?.[key] ?? item?.raw_payload?.[key] ?? null;
}

function cycleLabel(cycle = 'monthly') {
  return {
    weekly: 'hebdo',
    monthly: 'mensuel',
    quarterly: 'trimestriel',
    annual: 'annuel',
  }[cycle] || 'mensuel';
}

function buildDetectionInsights(item, { amount, cycle, startDate, trialDays, trialEndsAt }) {
  const explicitStatus = String(item.status || getRawPayloadValue(item, 'status') || '').toLowerCase();
  const recurringAmount = normalizeAmount(
    item.regularAmount ?? getRawPayloadValue(item, 'regularAmount') ?? amount
  );

  let nextChargeDate = normalizeDate(item.nextChargeDate ?? getRawPayloadValue(item, 'nextChargeDate'));
  let nextChargeAmount = normalizeAmount(
    item.nextChargeAmount ?? getRawPayloadValue(item, 'nextChargeAmount') ?? recurringAmount
  );
  let isTrialActive = explicitStatus === 'trial';

  if (startDate) {
    try {
      const billing = getNextBilling({
        amount: recurringAmount,
        cycle,
        startDate,
        trialDays,
        active: true,
      });

      isTrialActive = billing.isTrial || isTrialActive;
      nextChargeDate = nextChargeDate || normalizeDate(billing.nextChargeDate);
      nextChargeAmount = nextChargeAmount || normalizeAmount(billing.nextChargeAmount);
    } catch (error) {
      console.warn('[EmailService] Unable to compute detection billing insights:', error);
    }
  }

  const status = explicitStatus === 'inactive' ? 'inactive' : isTrialActive ? 'trial' : 'active';
  const statusLabel =
    status === 'trial'
      ? `Essai gratuit${trialEndsAt || nextChargeDate ? ` jusqu'au ${formatDate(trialEndsAt || nextChargeDate)}` : ''}`
      : `Abonnement ${cycleLabel(cycle)}${nextChargeDate ? ` • prochain le ${formatDate(nextChargeDate)}` : ''}`;

  return {
    amount: recurringAmount,
    displayAmount: status === 'trial' ? 0 : recurringAmount,
    nextChargeDate,
    nextChargeAmount: nextChargeAmount || recurringAmount,
    status,
    statusLabel,
    isTrialActive: status === 'trial',
  };
}

export function mapDetectedSubscriptionToApp(item = {}) {
  const serviceName = (item.serviceName || item.name || '').trim();
  if (!serviceName) return null;

  const amount = normalizeAmount(item.amount);
  const trialDays = normalizeTrialDays(item.trialDays ?? getRawPayloadValue(item, 'trialDays'));
  const startDate =
    normalizeDate(item.startDate) ||
    normalizeDate(getRawPayloadValue(item, 'startDate')) ||
    new Date().toISOString().split('T')[0];
  const trialEndsAt = normalizeDate(item.trialEndsAt ?? getRawPayloadValue(item, 'trialEndsAt'));
  const insights = buildDetectionInsights(item, {
    amount,
    cycle: normalizeCycle(item.billingFrequency || item.cycle || 'monthly'),
    startDate,
    trialDays,
    trialEndsAt,
  });

  return {
    id: item.id,
    name: serviceName,
    amount: insights.amount,
    displayAmount: insights.displayAmount,
    cycle: normalizeCycle(item.billingFrequency || item.cycle || 'monthly'),
    category: item.category || 'Autre',
    icon: item.icon || getBestMatchIcon(serviceName),
    color: item.color || getBestMatchColor(serviceName),
    startDate,
    trialDays,
    active: item.active ?? true,
    provider: item.provider,
    sourceEmail: item.sourceEmail,
    confidence: item.confidence,
    trialEndsAt,
    nextChargeDate: insights.nextChargeDate,
    nextChargeAmount: insights.nextChargeAmount,
    status: insights.status,
    statusLabel: insights.statusLabel,
    isTrialActive: insights.isTrialActive,
    alternatives: item.alternatives || getRawPayloadValue(item, 'alternatives') || getSuggestedAlternatives(serviceName),
    rawPayload: item.rawPayload || item,
  };
}

export function prepareDetectedSubscriptions(items = [], existingNames = []) {
  const existing = new Set(
    existingNames
      .map((name) => String(name || '').trim().toLowerCase())
      .filter(Boolean)
  );
  const seen = new Set();

  return items.reduce((acc, item) => {
    const mapped = mapDetectedSubscriptionToApp(item);
    const key = mapped?.name?.trim().toLowerCase();

    const canKeep =
      mapped.status !== 'inactive' &&
      (mapped.amount > 0 || mapped.isTrialActive || mapped.trialDays > 0 || !!mapped.trialEndsAt);

    if (!mapped || !key || !canKeep || existing.has(key) || seen.has(key)) {
      return acc;
    }

    seen.add(key);
    acc.push(mapped);
    return acc;
  }, []);
}

export const EmailService = {
  getProviderConfig(provider = 'gmail') {
    return EMAIL_PROVIDERS[provider];
  },

  getProviderChoices() {
    return ['gmail', 'manual'].map((provider) => ({
      key: provider,
      ...EMAIL_PROVIDERS[provider],
    }));
  },

  buildOAuthUrl(provider, redirectUri) {
    const config = EMAIL_PROVIDERS[provider];
    if (!config || provider === 'manual') {
      throw new Error('Provider non supporte');
    }

    const common = {
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: config.scopes.join(' '),
      state: `email_scan_${provider}`,
    };

    if (!config.clientId) {
      throw new Error(`Client ID manquant pour ${config.name}`);
    }

    if (provider === 'gmail') {
      return `${config.authUrl}?${new URLSearchParams({
        ...common,
        include_granted_scopes: 'true',
        prompt: 'consent',
      }).toString()}`;
    }

    if (provider === 'outlook') {
      return `${config.authUrl}?${new URLSearchParams({
        ...common,
        response_mode: 'fragment',
      }).toString()}`;
    }

    throw new Error('Provider non implemente');
  },

  async fetchProviderProfile(provider, accessToken) {
    if (provider === 'gmail') {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Impossible de recuperer le profil Gmail');
      const data = await response.json();
      return {
        email: data.email,
        providerUserId: data.id,
      };
    }

    if (provider === 'outlook') {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Impossible de recuperer le profil Outlook');
      const data = await response.json();
      return {
        email: data.mail || data.userPrincipalName,
        providerUserId: data.id,
      };
    }

    throw new Error('Provider non supporte');
  },

  async scanEmails({ email, provider = 'gmail', providerAccessToken = null, providerRefreshToken = null }) {
    console.log('[EmailService] Scanning emails for:', email, 'provider:', provider);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Session utilisateur introuvable.');
    }

    if (!SUPABASE_ANON_KEY) {
      throw new Error('Clé Supabase anon introuvable.');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email,
        provider,
        accessToken: providerAccessToken,
        refreshToken: providerRefreshToken,
        providerAccessToken,
        providerRefreshToken,
        sessionAccessToken: session.access_token,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EmailService] Scan failed:', errorText);

      try {
        const parsed = JSON.parse(errorText);
        throw new Error(parsed.error || 'Erreur lors du scan');
      } catch {
        throw new Error(errorText || 'Erreur lors du scan');
      }
    }

    return response.json();
  },

  async scanMailbox(email, appPassword) {
    const response = await fetch(`${LOCAL_EMAIL_SCANNER_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        appPassword,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Erreur lors de l analyse de la boite mail');
    }

    return response.json();
  },

  async runProviderScan({
    provider,
    email,
    accessToken,
    refreshToken,
    existingNames = [],
  }) {
    const result = await this.scanEmails({
      email,
      provider,
      providerAccessToken: accessToken,
      providerRefreshToken: refreshToken,
    });

    return {
      subscriptions: prepareDetectedSubscriptions(result.subscriptions || [], existingNames),
      emailCount: result.emailCount || 0,
      raw: result,
    };
  },

  async runManualScan({ email, appPassword, existingNames = [] }) {
    const result = await this.scanMailbox(email, appPassword);
    return {
      subscriptions: prepareDetectedSubscriptions(result.subscriptions || [], existingNames),
      emailCount: result.emailCount || 0,
      raw: result,
    };
  },

  async scanTextContent(textContent) {
    console.log('[EmailService] Scanning text content');

    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      return {
        subscriptions: [
          { serviceName: 'Netflix', amount: 15.99, billingFrequency: 'monthly', category: 'Streaming' },
          { serviceName: 'Spotify', amount: 9.99, billingFrequency: 'monthly', category: 'Musique' },
        ],
      };
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: `Extrait les abonnements de ce texte. JSON uniquement:
{"subscriptions": [{"serviceName": "Nom", "amount": 0.00, "billingFrequency": "monthly", "category": "Cat"}]}`,
            },
            {
              role: 'user',
              content: textContent,
            },
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      }
    } catch (error) {
      console.error('[EmailService] Groq error:', error);
    }

    return { subscriptions: [] };
  },

  async runSupabaseScan({ email, existingNames = [] }) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Session non disponible');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-emails-supabase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Erreur lors du scan');
    }

    const result = await response.json();
    return {
      subscriptions: prepareDetectedSubscriptions(result.subscriptions || [], existingNames),
      emailCount: result.emailCount || 0,
      raw: result,
    };
  },
};

export default EmailService;
