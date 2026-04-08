// src/services/emailService.js
// Service pour la connexion OAuth aux emails et le scan

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const EMAIL_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    icon: '📧',
    color: '#EA4335',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata',
    ],
  },
  outlook: {
    name: 'Outlook',
    icon: '📨',
    color: '#0078D4',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scopes: ['Mail.Read', 'offline_access'],
  },
};

export const EmailService = {
  // Initiate OAuth flow
  async initiateOAuth(provider = 'gmail') {
    const config = EMAIL_PROVIDERS[provider];
    if (!config) throw new Error('Provider non supporté');

    const redirectUri = `${SUPABASE_URL}/functions/v1/callback`;

    if (provider === 'gmail') {
      const params = new URLSearchParams({
        client_id: process.env.EXPO_PUBLIC_GMAIL_CLIENT_ID || '',
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: config.scopes.join(' '),
        include_granted_scopes: 'true',
        state: 'email_scan',
      });
      return `${config.authUrl}?${params.toString()}`;
    }

    if (provider === 'outlook') {
      const params = new URLSearchParams({
        client_id: process.env.EXPO_PUBLIC_OUTLOOK_CLIENT_ID || '',
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: config.scopes.join(' '),
        response_mode: 'fragment',
        state: 'email_scan',
      });
      return `${config.authUrl}?${params.toString()}`;
    }

    throw new Error('Provider non implémenté');
  },

  // Scan emails via Supabase Edge Function
  async scanEmails(email, accessToken, provider = 'gmail') {
    console.log('[EmailService] Scanning emails for:', email, 'provider:', provider);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/scan-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email,
        accessToken,
        provider,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EmailService] Scan failed:', error);
      throw new Error(error || 'Erreur lors du scan');
    }

    const data = await response.json();
    console.log('[EmailService] Found subscriptions:', data.subscriptions?.length);
    return data;
  },

  // Alternative: Scan using browser-extracted email content
  async scanTextContent(textContent) {
    console.log('[EmailService] Scanning text content');

    const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      // Fallback to mock data
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
          'Authorization': `Bearer ${apiKey}`,
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
};

export default EmailService;
