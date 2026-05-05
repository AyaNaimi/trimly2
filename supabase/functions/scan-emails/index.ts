const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  "Content-Type": "application/json",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-70b-8192";
const GOOGLE_GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const GMAIL_SEARCH_QUERIES = [
  'newer_than:5y (subscription OR abonnement OR receipt OR invoice OR billing OR payment OR facturation OR renewal OR renouvellement OR "free trial" OR essai)',
  'newer_than:5y (category:purchases OR label:^smartlabel_receipt)',
  "newer_than:5y category:promotions",
  "in:anywhere newer_than:5y -in:chats",
];
const LIST_PAGE_SIZE = 100;
const MAX_MESSAGES_TO_SCAN = 600;
const DETAIL_BATCH_SIZE = 15;
const MAX_AI_EMAILS = 48;
const AI_CHUNK_SIZE = 8;
const MIN_RELEVANT_MESSAGES_BEFORE_FALLBACK = 25;

interface AuthUser {
  id: string;
  email?: string;
}

interface GmailProfile {
  emailAddress: string;
  messagesTotal?: number;
  threadsTotal?: number;
  historyId?: string;
}

interface ScanRequest {
  email?: string;
  provider?: string;
  accessToken?: string | null;
  refreshToken?: string | null;
  providerAccessToken?: string | null;
  providerRefreshToken?: string | null;
  sessionAccessToken?: string | null;
}

interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  snippet: string;
  date: string;
}

interface Subscription {
  serviceName: string;
  amount: number;
  billingFrequency: "weekly" | "monthly" | "quarterly" | "annual";
  category: string;
  startDate?: string;
  trialDays?: number;
  trialEndsAt?: string | null;
  confidence?: number;
  regularAmount?: number;
  nextChargeDate?: string | null;
  nextChargeAmount?: number;
  status?: "trial" | "active" | "inactive";
  alternatives?: string[];
}

type ServiceHint = {
  name: string;
  category: string;
  patterns: RegExp[];
};

const SERVICE_HINTS: ServiceHint[] = [
  { name: "Netflix", category: "Streaming", patterns: [/netflix/i, /@netflix/i] },
  { name: "Spotify", category: "Musique", patterns: [/spotify/i] },
  { name: "Disney+", category: "Streaming", patterns: [/disney\+/i, /disneyplus/i] },
  { name: "Amazon Prime", category: "Shopping", patterns: [/amazon\s*prime/i] },
  { name: "YouTube Premium", category: "Streaming", patterns: [/youtube\s*premium/i] },
  { name: "Google One", category: "Cloud", patterns: [/google\s*one/i] },
  { name: "ChatGPT", category: "IA", patterns: [/chatgpt/i, /openai/i] },
  { name: "Adobe", category: "Productivite", patterns: [/adobe/i, /creative\s*cloud/i] },
  { name: "Microsoft 365", category: "Productivite", patterns: [/microsoft\s*365/i, /office\s*365/i] },
  { name: "Apple iCloud+", category: "Cloud", patterns: [/icloud/i, /apple\s*services/i] },
  { name: "Canal+", category: "Streaming", patterns: [/canal\+/i] },
  { name: "Deezer", category: "Musique", patterns: [/deezer/i] },
  { name: "Dropbox", category: "Cloud", patterns: [/dropbox/i] },
  { name: "Notion", category: "Productivite", patterns: [/notion/i] },
  { name: "NordVPN", category: "Securite", patterns: [/nordvpn/i] },
  { name: "Slack", category: "Communication", patterns: [/slack/i] },
  { name: "Zoom", category: "Communication", patterns: [/zoom/i] },
];

const SERVICE_ALTERNATIVES: Record<string, string[]> = {
  Netflix: ["Disney+", "Prime Video", "Canal+"],
  Spotify: ["Deezer", "YouTube Music", "Apple Music"],
  "Disney+": ["Netflix", "Prime Video", "Canal+"],
  "Amazon Prime": ["Netflix", "Canal+", "Disney+"],
  "YouTube Premium": ["Spotify", "Deezer", "Apple Music"],
  ChatGPT: ["Claude Pro", "Gemini Advanced", "Perplexity Pro"],
  Adobe: ["Canva Pro", "Affinity", "Figma Pro"],
  "Microsoft 365": ["Google Workspace", "Notion", "LibreOffice"],
  "Google One": ["iCloud+", "Dropbox", "OneDrive"],
  "Apple iCloud+": ["Google One", "Dropbox", "OneDrive"],
  Notion: ["Obsidian Sync", "ClickUp", "Evernote"],
  Dropbox: ["Google Drive", "OneDrive", "iCloud+"],
  Slack: ["Discord", "Microsoft Teams", "Google Chat"],
  Zoom: ["Google Meet", "Microsoft Teams", "Whereby"],
};

const NON_SUBSCRIPTION_PATTERNS = [
  /login/i,
  /log in/i,
  /sign in/i,
  /new sign-?in/i,
  /connexion/i,
  /connectez-vous/i,
  /security alert/i,
  /account security/i,
  /verify/i,
  /verification/i,
  /code de verification/i,
  /one[- ]time code/i,
  /\botp\b/i,
  /mot de passe/i,
  /password/i,
  /magic link/i,
  /device/i,
  /appareil/i,
  /welcome/i,
  /bienvenue/i,
  /newsletter/i,
  /digest/i,
  /activity/i,
  /account access/i,
  /workspace invite/i,
];

const STRONG_SUBSCRIPTION_PATTERNS = [
  /subscription active/i,
  /abonnement actif/i,
  /invoice/i,
  /receipt/i,
  /billing/i,
  /payment/i,
  /facturation/i,
  /facture/i,
  /charged/i,
  /prelevement/i,
  /renewal/i,
  /renouvellement/i,
  /renews/i,
  /next charge/i,
  /next billing/i,
  /free trial/i,
  /essai gratuit/i,
  /trial ends/i,
  /end of trial/i,
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const {
      email,
      provider = "gmail",
      accessToken,
      refreshToken,
      providerAccessToken,
      providerRefreshToken,
      sessionAccessToken,
    } = (await req.json()) as ScanRequest;

    if (provider !== "gmail") {
      return jsonResponse({ error: "Seul Gmail est supporte pour le moment." }, 400);
    }

    const user = await getAuthenticatedUser(sessionAccessToken);
    const googleSession = await ensureGoogleAccess({
      accessToken: providerAccessToken || accessToken || null,
      refreshToken: providerRefreshToken || refreshToken || null,
    });

    const mailbox = await fetchGmailEmails(googleSession.accessToken);
    const subscriptions = await detectSubscriptions(mailbox.emails);

    return jsonResponse({
      subscriptions,
      emailCount: mailbox.emails.length,
      matchedEmailCount: mailbox.matchedMessageCount,
      connection: {
        email: googleSession.profile.emailAddress || email || user.email || null,
        providerUserId: user.id,
        accessToken: googleSession.accessToken,
        refreshToken: providerRefreshToken || refreshToken || null,
        scopes: [GOOGLE_GMAIL_SCOPE],
        source: providerAccessToken || accessToken ? "google-provider-token" : "google-refresh-token",
      },
    });
  } catch (error) {
    console.error("scan-emails error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Erreur interne." }, 500);
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: CORS_HEADERS });
}

async function getAuthenticatedUser(sessionAccessToken: string | null | undefined): Promise<AuthUser> {
  if (!sessionAccessToken) {
    throw new Error("Session utilisateur requise.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Secrets Supabase manquants dans la fonction Edge.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${sessionAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Session Supabase invalide.");
  }

  return (await response.json()) as AuthUser;
}

async function ensureGoogleAccess({
  accessToken,
  refreshToken,
}: {
  accessToken: string | null;
  refreshToken: string | null;
}) {
  let activeAccessToken = accessToken;

  if (!activeAccessToken && refreshToken) {
    activeAccessToken = await refreshGoogleAccessToken(refreshToken);
  }

  if (!activeAccessToken) {
    throw new Error("Aucun access token Google disponible.");
  }

  let profileResponse = await fetchGmailProfile(activeAccessToken);

  if (profileResponse.status === 401 && refreshToken) {
    activeAccessToken = await refreshGoogleAccessToken(refreshToken);
    profileResponse = await fetchGmailProfile(activeAccessToken);
  }

  if (!profileResponse.ok) {
    const errorText = await profileResponse.text();
    throw new Error(`Impossible d'acceder a Gmail API: ${errorText}`);
  }

  const profile = (await profileResponse.json()) as GmailProfile;

  return { accessToken: activeAccessToken, profile };
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID") || Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET") || Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Client Google manquant pour rafraichir le token Gmail.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || "Refresh token Google invalide.");
  }

  return String(data.access_token);
}

function fetchGmailProfile(accessToken: string) {
  return fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function fetchGmailEmails(accessToken: string) {
  const messageIds = new Set<string>();
  let matchedMessageCount = 0;

  for (let queryIndex = 0; queryIndex < GMAIL_SEARCH_QUERIES.length; queryIndex++) {
    const query = GMAIL_SEARCH_QUERIES[queryIndex];
    let pageToken: string | undefined;

    while (messageIds.size < MAX_MESSAGES_TO_SCAN) {
      const pageUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
      pageUrl.searchParams.set("q", query);
      pageUrl.searchParams.set("maxResults", String(Math.min(LIST_PAGE_SIZE, MAX_MESSAGES_TO_SCAN - messageIds.size)));
      if (pageToken) pageUrl.searchParams.set("pageToken", pageToken);

      const listResponse = await fetch(pageUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        throw new Error(`Lecture Gmail impossible: ${errorText}`);
      }

      const listData = await listResponse.json();
      const messages = Array.isArray(listData?.messages) ? listData.messages : [];
      if (!messages.length) break;

      matchedMessageCount += messages.length;

      for (const message of messages) {
        if (message?.id) {
          messageIds.add(String(message.id));
        }
        if (messageIds.size >= MAX_MESSAGES_TO_SCAN) break;
      }

      pageToken = listData?.nextPageToken;
      if (!pageToken || messageIds.size >= MAX_MESSAGES_TO_SCAN) break;
    }

    const shouldContinueToFullMailbox =
      queryIndex < GMAIL_SEARCH_QUERIES.length - 1 &&
      (messageIds.size < MIN_RELEVANT_MESSAGES_BEFORE_FALLBACK || queryIndex < 2);

    if (!shouldContinueToFullMailbox || messageIds.size >= MAX_MESSAGES_TO_SCAN) {
      break;
    }
  }

  const emails: EmailMessage[] = [];
  const idList = Array.from(messageIds);

  for (let index = 0; index < idList.length; index += DETAIL_BATCH_SIZE) {
    const batchIds = idList.slice(index, index + DETAIL_BATCH_SIZE);
    const batchResults = await Promise.all(
      batchIds.map(async (messageId) => {
        const response = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (!response.ok) return null;

        const detail = await response.json();
        return parseGmailMessage(detail);
      }),
    );

    for (const parsed of batchResults) {
      if (parsed) emails.push(parsed);
    }
  }

  return {
    emails,
    matchedMessageCount: Math.max(matchedMessageCount, messageIds.size, emails.length),
  };
}

function parseGmailMessage(payload: any): EmailMessage | null {
  try {
    const headers = payload?.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((header: any) => String(header?.name || "").toLowerCase() === name.toLowerCase())?.value || "";

    const body = sanitizeEmailText(extractBody(payload?.payload));

    return {
      id: String(payload?.id || crypto.randomUUID()),
      from: getHeader("from"),
      subject: getHeader("subject"),
      body: body.slice(0, 6000),
      snippet: String(payload?.snippet || "").slice(0, 700),
      date: payload?.internalDate
        ? new Date(Number(payload.internalDate)).toISOString()
        : new Date().toISOString(),
    };
  } catch (error) {
    console.error("parseGmailMessage error:", error);
    return null;
  }
}

function extractBody(node: any): string {
  if (!node) return "";

  if (node.body?.data && isReadableMimeType(node.mimeType)) {
    return decodeBase64Url(node.body.data);
  }

  if (Array.isArray(node.parts)) {
    for (const part of node.parts) {
      const extracted = extractBody(part);
      if (extracted) return extracted;
    }
  }

  return "";
}

function isReadableMimeType(mimeType: string | undefined) {
  if (!mimeType) return true;
  return mimeType.includes("text/plain") || mimeType.includes("text/html");
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(normalized);
}

function sanitizeEmailText(text: string) {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function detectSubscriptions(emails: EmailMessage[]): Promise<Subscription[]> {
  const heuristicSubscriptions = extractSubscriptionsWithPatterns(emails);
  const aiSubscriptions = await analyzeEmailsWithAI(emails);
  return enrichSubscriptions(mergeSubscriptions([...heuristicSubscriptions, ...aiSubscriptions]))
    .filter((item) => item.status !== "inactive");
}

async function analyzeEmailsWithAI(emails: EmailMessage[]): Promise<Subscription[]> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  if (!groqApiKey || !emails.length) {
    return [];
  }

  const aiCandidates = pickAiCandidateEmails(emails).slice(0, MAX_AI_EMAILS);
  const results: Subscription[] = [];

  for (let index = 0; index < aiCandidates.length; index += AI_CHUNK_SIZE) {
    const chunk = aiCandidates.slice(index, index + AI_CHUNK_SIZE);
    const prompt = chunk
      .map(
        (email, chunkIndex) =>
          `Email ${chunkIndex + 1}\nDate: ${email.date}\nDe: ${email.from}\nSujet: ${email.subject}\nExtrait: ${email.snippet}\nContenu: ${email.body.slice(0, 2200)}`,
      )
      .join("\n\n---\n\n");

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.1,
          max_tokens: 1800,
          messages: [
            {
              role: "system",
              content:
                'Tu extrais uniquement des abonnements reellement actifs ou en essai depuis des emails de facturation. Ignore strictement les emails de connexion, securite, verification, bienvenue, newsletters, acces compte ou notifications normales. Ne retourne un abonnement que si le mail prouve un paiement, une facture, un renouvellement, une fin d essai ou un plan payant actif. Retourne uniquement du JSON valide: {"subscriptions":[{"serviceName":"Nom","amount":0.00,"regularAmount":0.00,"billingFrequency":"monthly","category":"Streaming","startDate":"YYYY-MM-DD","trialDays":0,"trialEndsAt":null,"nextChargeDate":null,"nextChargeAmount":0.00,"status":"active","confidence":0.0}]}. billingFrequency doit etre weekly, monthly, quarterly ou annual. status doit etre trial, active ou inactive. Si aucune preuve forte n existe, retourne {"subscriptions":[]}. Ne renvoie jamais autre chose que le JSON.',
            },
            { role: "user", content: prompt },
          ],
        }),
      });

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (typeof content === "string") {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed?.subscriptions)) {
            results.push(...parsed.subscriptions);
          }
        }
      }
    } catch (error) {
      console.error("Groq analysis error:", error);
    }
  }

  return results;
}

function pickAiCandidateEmails(emails: EmailMessage[]) {
  return [...emails]
    .filter((email) => {
      const text = `${email.subject} ${email.snippet} ${email.body}`.toLowerCase();
      return !isNonSubscriptionEmail(text) && hasStrongSubscriptionEvidence(text);
    })
    .sort((left, right) => scoreEmailForAi(right) - scoreEmailForAi(left));
}

function scoreEmailForAi(email: EmailMessage) {
  const text = `${email.subject} ${email.snippet} ${email.body}`.toLowerCase();
  let score = 0;
  if (/subscription|abonnement|invoice|receipt|billing|payment|trial|essai|membership|plan|premium|auto-renew/.test(text)) score += 4;
  if (/€|\$|eur|usd|mad/.test(text)) score += 3;
  if (/monthly|annual|year|month|hebdo|mensuel|annuel|trial ends|renews|semaine|trimestre|per month|per year/.test(text)) score += 2;
  if (SERVICE_HINTS.some((hint) => hint.patterns.some((pattern) => pattern.test(text)))) score += 2;
  if (isNonSubscriptionEmail(text)) score -= 6;
  return score;
}

function extractSubscriptionsWithPatterns(emails: EmailMessage[]): Subscription[] {
  const results: Subscription[] = [];

  for (const email of emails) {
    const candidate = extractSubscriptionFromEmail(email);
    if (candidate) results.push(candidate);
  }

  return mergeSubscriptions(results);
}

function extractSubscriptionFromEmail(email: EmailMessage): Subscription | null {
  const text = `${email.from} ${email.subject} ${email.snippet} ${email.body}`;
  const normalized = text.toLowerCase();
  const serviceHint = findServiceHint(text);

  if (isNonSubscriptionEmail(normalized)) {
    return null;
  }

  if (!serviceHint && !looksLikeBillingEmail(normalized)) {
    return null;
  }

  const amount = extractAmount(text);
  const trialInfo = extractTrialInfo(text);
  const statusInfo = extractStatusInfo(text, trialInfo);
  const keepTrialWithoutAmount = statusInfo.status === "trial" && !!(trialInfo.trialDays || trialInfo.trialEndsAt);
  const hasBillingProofWithAmount =
    amount > 0 &&
    /invoice|receipt|charged|payment successful|renew|renewal|subscription|abonnement|facture|billing cycle|next charge|next billing|prelevement/.test(normalized);
  const hasStrongEvidence = hasStrongSubscriptionEvidence(normalized) || hasBillingProofWithAmount || keepTrialWithoutAmount;

  if (!hasStrongEvidence) {
    return null;
  }

  if (amount <= 0 && !keepTrialWithoutAmount) {
    return null;
  }

  const explicitStartDate = extractContextualDate(text, [
    "started",
    "commence",
    "debut",
    "subscription date",
    "purchase date",
    "date de commande",
    "activation",
  ]);
  const chargeDate = extractContextualDate(text, [
    "next billing",
    "next charge",
    "renews",
    "renouvellement",
    "will renew",
    "charged on",
    "facture le",
  ]);
  const emailDate = toIsoDate(email.date);
  const startDate =
    explicitStartDate ||
    inferStartDateFromTrial(trialInfo, emailDate) ||
    chargeDate ||
    emailDate;
  const serviceName = serviceHint?.name || inferServiceName(text);
  const regularAmount = amount > 0 ? amount : 0;

  const candidate: Subscription = {
    serviceName,
    amount: regularAmount,
    regularAmount,
    billingFrequency: inferFrequency(text),
    category: serviceHint?.category || inferCategory(text),
    startDate,
    trialDays: trialInfo.trialDays,
    trialEndsAt: trialInfo.trialEndsAt,
    nextChargeDate: statusInfo.nextChargeDate || trialInfo.trialEndsAt || chargeDate || null,
    nextChargeAmount: regularAmount,
    status: statusInfo.status,
    alternatives: getAlternativesForService(serviceName),
    confidence: computeConfidence({
      hasServiceHint: !!serviceHint,
      hasAmount: amount > 0 || keepTrialWithoutAmount,
      hasTrialInfo: trialInfo.trialDays > 0 || !!trialInfo.trialEndsAt,
      hasDate: !!startDate,
    }),
  };

  return candidate.serviceName ? candidate : null;
}

function looksLikeBillingEmail(text: string) {
  return /subscription|abonnement|receipt|invoice|billing|payment|facturation|renewal|trial|essai|membership|plan|premium|auto-renew|renews|next charge|prochain prelevement|prelevement|renew/.test(text);
}

function isNonSubscriptionEmail(text: string) {
  return NON_SUBSCRIPTION_PATTERNS.some((pattern) => pattern.test(text));
}

function hasStrongSubscriptionEvidence(text: string) {
  if (STRONG_SUBSCRIPTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  const hasPlanWord = /subscription|abonnement|membership|plan|premium|plus|pro|family/.test(text);
  const hasMoney = /€|\$|eur|usd|mad|\b\d{1,4}[.,]\d{2}\b/.test(text);
  const hasChargeWindow = /monthly|annual|yearly|mensuel|annuel|hebdo|weekly|quarterly|par mois|per month|per year/.test(text);

  return (hasPlanWord && hasMoney) || (hasMoney && hasChargeWindow);
}

function findServiceHint(text: string) {
  return SERVICE_HINTS.find((hint) => hint.patterns.some((pattern) => pattern.test(text)));
}

function inferServiceName(text: string) {
  const match = text.match(/\b([A-Z][A-Za-z0-9+&.-]{2,}(?:\s+[A-Z][A-Za-z0-9+&.-]{2,}){0,2})\b/);
  return match ? match[1].trim() : "";
}

function inferCategory(text: string) {
  const normalized = text.toLowerCase();
  if (/music|musique|spotify|deezer/.test(normalized)) return "Musique";
  if (/cloud|storage|stockage|icloud|dropbox|google one/.test(normalized)) return "Cloud";
  if (/security|vpn|securite/.test(normalized)) return "Securite";
  if (/productiv|adobe|office|microsoft|notion/.test(normalized)) return "Productivite";
  if (/chatgpt|openai|ai|ia/.test(normalized)) return "IA";
  return "Streaming";
}

function getAlternativesForService(serviceName: string) {
  const lower = String(serviceName || "").toLowerCase();

  for (const [service, alternatives] of Object.entries(SERVICE_ALTERNATIVES)) {
    if (lower.includes(service.toLowerCase())) {
      return alternatives;
    }
  }

  return [];
}

function extractAmount(text: string) {
  const patterns = [
    /(\d{1,4}(?:[.,]\d{1,2})?)\s?(€|eur|usd|\$|mad)\b/i,
    /\b(€|eur|usd|\$|mad)\s?(\d{1,4}(?:[.,]\d{1,2})?)\b/i,
    /(?:price|amount|total|monthly|annual|mensuel|annuel|facture|billing)[^0-9]{0,12}(\d{1,4}(?:[.,]\d{1,2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const rawValue = match[2] && /\d/.test(match[2]) ? match[2] : match[1];
    const amount = Number.parseFloat(String(rawValue).replace(",", "."));
    if (Number.isFinite(amount) && amount > 0 && amount < 5000) {
      return amount;
    }
  }

  return 0;
}

function inferFrequency(text: string): "weekly" | "monthly" | "quarterly" | "annual" {
  const normalized = text.toLowerCase();
  if (/quarter|trimestre|quarterly/.test(normalized)) return "quarterly";
  if (/annual|annuel|yearly|\/year|per year|par an/.test(normalized)) return "annual";
  if (/weekly|hebdo|per week|\/week|par semaine/.test(normalized)) return "weekly";
  return "monthly";
}

function extractTrialInfo(text: string) {
  const normalized = text.toLowerCase();
  const dayMatch =
    normalized.match(/(?:free trial|trial|essai gratuit|essai)[^\d]{0,12}(\d{1,3})\s*(?:days|day|jours|jour)/i) ||
    normalized.match(/(\d{1,3})\s*(?:days|day|jours|jour)[^\n]{0,20}(?:free trial|trial|essai gratuit|essai)/i);

  const trialDays = dayMatch ? Number.parseInt(dayMatch[1], 10) : 0;
  const trialEndsAt = extractContextualDate(text, [
    "trial ends",
    "trial will end",
    "end of trial",
    "fin de l'essai",
    "essai se termine",
  ]);

  return {
    trialDays: Number.isFinite(trialDays) ? trialDays : 0,
    trialEndsAt,
  };
}

function extractStatusInfo(
  text: string,
  trialInfo: { trialDays: number; trialEndsAt: string | null },
) {
  const normalized = text.toLowerCase();
  const isTrial =
    trialInfo.trialDays > 0 ||
    !!trialInfo.trialEndsAt ||
    /free trial|trial period|essai gratuit|trial ends|trial will end|essai se termine|essai jusqu/.test(normalized);
  const isInactive =
    /cancelled|canceled|termination|ended subscription|subscription ended|resilie|resiliation/.test(normalized);
  const nextChargeDate = extractContextualDate(text, [
    "next billing",
    "next charge",
    "renews",
    "renewal date",
    "renews on",
    "prochain prelevement",
    "prochain paiement",
    "facture le",
  ]);

  if (isInactive) {
    return { status: "inactive" as const, nextChargeDate };
  }

  if (isTrial) {
    return { status: "trial" as const, nextChargeDate };
  }

  return { status: "active" as const, nextChargeDate };
}

function extractContextualDate(text: string, keywords: string[]) {
  const snippets = buildKeywordSnippets(text, keywords);

  for (const snippet of snippets) {
    const parsed = extractFirstDate(snippet);
    if (parsed) return parsed;
  }

  return extractFirstDate(text);
}

function buildKeywordSnippets(text: string, keywords: string[]) {
  const snippets: string[] = [];
  const lower = text.toLowerCase();

  for (const keyword of keywords) {
    const index = lower.indexOf(keyword.toLowerCase());
    if (index >= 0) {
      snippets.push(text.slice(Math.max(0, index - 20), Math.min(text.length, index + 120)));
    }
  }

  return snippets;
}

function extractFirstDate(text: string) {
  const candidates = [
    ...extractIsoDates(text),
    ...extractSlashDates(text),
    ...extractNamedDates(text),
  ];

  return candidates.length ? candidates[0] : null;
}

function extractIsoDates(text: string) {
  const matches = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g) || [];
  return matches.map((value) => toIsoDate(value)).filter(Boolean) as string[];
}

function extractSlashDates(text: string) {
  const regex = /\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/g;
  const results: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const day = Number.parseInt(match[1], 10);
    const month = Number.parseInt(match[2], 10);
    const year = Number.parseInt(match[3], 10);
    results.push(buildIsoDate(year, month, day));
  }

  return results.filter(Boolean);
}

function extractNamedDates(text: string) {
  const monthMap: Record<string, number> = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12,
    janvier: 1,
    fevrier: 2,
    "février": 2,
    mars: 3,
    avril: 4,
    mai: 5,
    juin: 6,
    juillet: 7,
    aout: 8,
    "août": 8,
    septembre: 9,
    octobre: 10,
    novembre: 11,
    decembre: 12,
    "décembre": 12,
  };

  const regex =
    /\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)\s+(20\d{2})\b/i;
  const match = text.match(regex);
  if (!match) return [];

  const day = Number.parseInt(match[1], 10);
  const month = monthMap[match[2].toLowerCase()];
  const year = Number.parseInt(match[3], 10);
  const iso = buildIsoDate(year, month, day);
  return iso ? [iso] : [];
}

function buildIsoDate(year: number, month: number, day: number) {
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function inferStartDateFromTrial(
  trialInfo: { trialDays: number; trialEndsAt: string | null },
  fallbackDate: string | null,
) {
  if (trialInfo.trialDays > 0 && trialInfo.trialEndsAt) {
    const trialEnd = new Date(trialInfo.trialEndsAt);
    trialEnd.setUTCDate(trialEnd.getUTCDate() - trialInfo.trialDays);
    return trialEnd.toISOString().slice(0, 10);
  }

  return fallbackDate;
}

function toIsoDate(input: string | undefined | null) {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function addDaysToIsoDate(dateString: string, days: number) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function computeConfidence({
  hasServiceHint,
  hasAmount,
  hasTrialInfo,
  hasDate,
}: {
  hasServiceHint: boolean;
  hasAmount: boolean;
  hasTrialInfo: boolean;
  hasDate: boolean;
}) {
  let score = 0.35;
  if (hasServiceHint) score += 0.3;
  if (hasAmount) score += 0.2;
  if (hasDate) score += 0.1;
  if (hasTrialInfo) score += 0.05;
  return Math.min(0.99, Number(score.toFixed(2)));
}

function mergeSubscriptions(items: Subscription[]) {
  const merged = new Map<string, Subscription>();

  for (const item of items) {
    const keepTrialWithoutAmount =
      Number(item.amount || 0) <= 0 &&
      (item.status === "trial" || Number(item.trialDays || 0) > 0 || !!item.trialEndsAt);

    if (!item?.serviceName || (!keepTrialWithoutAmount && (!item?.amount || item.amount <= 0))) continue;

    const normalizedKey = item.serviceName.trim().toLowerCase();
    const normalizedItem: Subscription = {
      serviceName: item.serviceName.trim(),
      amount: Number(item.amount),
      regularAmount: Number(item.regularAmount ?? item.amount ?? 0),
      billingFrequency: normalizeFrequency(item.billingFrequency),
      category: item.category || "Autre",
      startDate: toIsoDate(item.startDate) || undefined,
      trialDays: Number.isFinite(Number(item.trialDays)) ? Number(item.trialDays) : 0,
      trialEndsAt: toIsoDate(item.trialEndsAt) || null,
      nextChargeDate: toIsoDate(item.nextChargeDate) || null,
      nextChargeAmount: Number.isFinite(Number(item.nextChargeAmount)) ? Number(item.nextChargeAmount) : Number(item.amount ?? 0),
      status: item.status || "active",
      alternatives: Array.isArray(item.alternatives) ? item.alternatives.filter(Boolean) : [],
      confidence: Number.isFinite(Number(item.confidence)) ? Number(item.confidence) : 0.55,
    };

    const existing = merged.get(normalizedKey);

    if (!existing) {
      merged.set(normalizedKey, normalizedItem);
      continue;
    }

    const candidateScore =
      (normalizedItem.confidence || 0) +
      (normalizedItem.trialDays ? 0.08 : 0) +
      (normalizedItem.startDate ? 0.05 : 0);
    const existingScore =
      (existing.confidence || 0) + (existing.trialDays ? 0.08 : 0) + (existing.startDate ? 0.05 : 0);

    merged.set(normalizedKey, {
      ...existing,
      ...(candidateScore >= existingScore ? normalizedItem : {}),
      serviceName: existing.serviceName || normalizedItem.serviceName,
      amount: normalizedItem.amount || existing.amount,
      regularAmount: normalizedItem.regularAmount || existing.regularAmount || normalizedItem.amount || existing.amount,
      trialDays: Math.max(existing.trialDays || 0, normalizedItem.trialDays || 0),
      trialEndsAt: normalizedItem.trialEndsAt || existing.trialEndsAt || null,
      startDate: normalizedItem.startDate || existing.startDate,
      nextChargeDate: normalizedItem.nextChargeDate || existing.nextChargeDate || null,
      nextChargeAmount: normalizedItem.nextChargeAmount || existing.nextChargeAmount || normalizedItem.amount || existing.amount,
      status:
        existing.status === "trial" || normalizedItem.status === "trial"
          ? "trial"
          : normalizedItem.status === "inactive" && existing.status !== "active"
            ? "inactive"
            : "active",
      alternatives: Array.from(new Set([...(existing.alternatives || []), ...(normalizedItem.alternatives || [])])),
      confidence: Math.max(existing.confidence || 0, normalizedItem.confidence || 0),
    });
  }

  return Array.from(merged.values()).sort((left, right) => (right.confidence || 0) - (left.confidence || 0));
}

function enrichSubscriptions(items: Subscription[]) {
  const today = new Date().toISOString().slice(0, 10);

  return items.map((item) => {
    const trialDays = Number.isFinite(Number(item.trialDays)) ? Number(item.trialDays) : 0;
    const startDate = toIsoDate(item.startDate) || today;
    const computedTrialEnd =
      toIsoDate(item.trialEndsAt) || (trialDays > 0 && startDate ? addDaysToIsoDate(startDate, trialDays) : null);
    const isTrialActive = item.status === "trial" && !!computedTrialEnd && computedTrialEnd >= today;
    const regularAmount = Number(item.regularAmount ?? item.amount ?? 0) || 0;

    return {
      ...item,
      amount: regularAmount,
      regularAmount,
      startDate,
      trialDays,
      trialEndsAt: computedTrialEnd,
      nextChargeDate: isTrialActive
        ? computedTrialEnd
        : toIsoDate(item.nextChargeDate) || computedTrialEnd || startDate,
      nextChargeAmount: Number(item.nextChargeAmount ?? regularAmount) || regularAmount,
      status: isTrialActive ? "trial" : item.status === "inactive" ? "inactive" : "active",
      alternatives: item.alternatives?.length ? item.alternatives : getAlternativesForService(item.serviceName),
    };
  });
}

function normalizeFrequency(value: string | undefined) {
  switch (String(value || "").toLowerCase()) {
    case "weekly":
      return "weekly";
    case "quarterly":
      return "quarterly";
    case "annual":
    case "yearly":
      return "annual";
    default:
      return "monthly";
  }
}
