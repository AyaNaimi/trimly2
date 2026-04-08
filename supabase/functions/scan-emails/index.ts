// supabase/functions/scan-emails/index.ts
// Edge Function to scan emails for subscription patterns

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-70b-8192";

interface EmailMessage {
  from: string;
  subject: string;
  body: string;
  date: string;
}

interface Subscription {
  serviceName: string;
  amount: number;
  billingFrequency: string;
  category: string;
  startDate?: string;
}

interface EmailProvider {
  imap: {
    host: string;
    port: number;
    tls: boolean;
  };
  oauth?: {
    authUrl: string;
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
  };
}

const EMAIL_PROVIDERS: Record<string, EmailProvider> = {
  gmail: {
    imap: { host: "imap.gmail.com", port: 993, tls: true },
    oauth: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      clientId: Deno.env.get("GMAIL_CLIENT_ID") || "",
      clientSecret: Deno.env.get("GMAIL_CLIENT_SECRET") || "",
    },
  },
  outlook: {
    imap: { host: "outlook.office365.com", port: 993, tls: true },
    oauth: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      clientId: Deno.env.get("OUTLOOK_CLIENT_ID") || "",
      clientSecret: Deno.env.get("OUTLOOK_CLIENT_SECRET") || "",
    },
  },
  yahoo: {
    imap: { host: "imap.mail.yahoo.com", port: 993, tls: true },
  },
};

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { email, accessToken, provider = "gmail" } = await req.json();

    if (!email || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Email et accessToken requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Scanning emails for: ${email}, provider: ${provider}`);

    // Fetch emails from the provider
    const emails = await fetchEmails(email, accessToken, provider);
    
    console.log(`Found ${emails.length} emails`);

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ 
          subscriptions: [],
          message: "Aucun email trouvé" 
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Use Groq AI to analyze emails
    const subscriptions = await analyzeEmailsWithAI(emails);

    return new Response(
      JSON.stringify({ 
        subscriptions,
        emailCount: emails.length,
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        } 
      }
    );

  } catch (error) {
    console.error("Email scan error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

async function fetchEmails(email: string, accessToken: string, provider: string): Promise<EmailMessage[]> {
  // For OAuth providers, we need to use their API instead of IMAP
  // This is a simplified version - in production, use proper OAuth flows
  
  const providerConfig = EMAIL_PROVIDERS[provider.toLowerCase()];
  
  if (!providerConfig) {
    throw new Error(`Provider ${provider} non supporté`);
  }

  // Gmail API
  if (provider.toLowerCase() === "gmail") {
    return fetchGmailEmails(accessToken);
  }

  // Outlook API
  if (provider.toLowerCase() === "outlook") {
    return fetchOutlookEmails(accessToken);
  }

  throw new Error(`Provider ${provider} non implémenté`);
}

async function fetchGmailEmails(accessToken: string): Promise<EmailMessage[]> {
  // Search for subscription-related emails
  const searchQuery = encodeURIComponent(
    "from:(noreply@ OR no-reply@) (subscription OR receipt OR invoice OR payment OR facturation)"
  );
  
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${searchQuery}&maxResults=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error: ${error}`);
  }

  const data = await response.json();
  const messages = data.messages || [];

  const emails: EmailMessage[] = [];

  for (const msg of messages.slice(0, 20)) {
    const msgResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (msgResponse.ok) {
      const msgData = await msgResponse.json();
      const email = parseGmailMessage(msgData);
      if (email) {
        emails.push(email);
      }
    }
  }

  return emails;
}

async function fetchOutlookEmails(accessToken: string): Promise<EmailMessage[]> {
  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/mailFolders/Inbox/messages?$top=20&$filter=contains(subject,'subscription') or contains(subject,'receipt') or contains(subject,'invoice')",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Outlook API error: ${response.status}`);
  }

  const data = await response.json();
  const messages = data.value || [];

  return messages.map((msg: any) => ({
    from: msg.from?.emailAddress?.address || "",
    subject: msg.subject || "",
    body: msg.body?.preview || msg.body?.content || "",
    date: msg.sentDateTime || "",
  }));
}

function parseGmailMessage(msgData: any): EmailMessage | null {
  try {
    const headers = msgData.payload?.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

    let body = "";
    
    // Get email body
    if (msgData.payload?.body?.data) {
      body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } else if (msgData.payload?.parts) {
      for (const part of msgData.payload.parts) {
        if (part.body?.data) {
          body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          break;
        }
      }
    }

    return {
      from: getHeader("from"),
      subject: getHeader("subject"),
      body: body.slice(0, 5000), // Limit body size
      date: msgData.internalDate || "",
    };
  } catch {
    return null;
  }
}

async function analyzeEmailsWithAI(emails: EmailMessage[]): Promise<Subscription[]> {
  const groqApiKey = Deno.env.get("GROQ_API_KEY");
  
  if (!groqApiKey) {
    console.log("No Groq API key, using pattern matching");
    return extractSubscriptionsWithPatterns(emails);
  }

  const emailContent = emails
    .map((e) => `De: ${e.from}\nSujet: ${e.subject}\n${e.body.slice(0, 1000)}`)
    .join("\n\n---\n\n");

  const systemPrompt = `Tu es un expert financier qui analyse les emails de facturation.
Ta tâche est d'extraire tous les abonnements (streaming, musique, cloud, IA, etc.)

Pour chaque abonnement, retourne:
- serviceName: nom du service (ex: "Netflix", "Spotify")
- amount: montant en euros (nombre)
- billingFrequency: "monthly", "weekly", "quarterly", ou "annual"
- category: catégorie (Streaming, Musique, Cloud, IA, Sécurité, etc.)

RÈGLES:
- Ne retourne que les abonnements actifs/récents
- Si un montant est en devise étrangère, convertis en EUR
- Retourne UNIQUEMENT du JSON valide avec ce format:
{"subscriptions": [{"serviceName": "...", "amount": 0.00, "billingFrequency": "monthly", "category": "..."}]}
- Ne retourne rien d'autre que le JSON`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyse ces emails et trouve les abonnements:\n\n${emailContent.slice(0, 8000)}` }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.subscriptions || [];
      }
    }
  } catch (error) {
    console.error("Groq API error:", error);
  }

  // Fallback to pattern matching
  return extractSubscriptionsWithPatterns(emails);
}

function extractSubscriptionsWithPatterns(emails: EmailMessage[]): Subscription[] {
  const subscriptions: Subscription[] = [];
  const seen = new Set<string>();

  // Common subscription patterns
  const patterns = [
    // Netflix
    { name: "Netflix", regex: /netflix/i, amount: /(\d+[.,]\d+)\s*€?\s*(?:par\s*mois|month|mois)/i, freq: "monthly", cat: "Streaming" },
    // Spotify
    { name: "Spotify", regex: /spotify/i, amount: /(\d+[.,]\d+)\s*€?\s*(?:par\s*mois|month|mois)/i, freq: "monthly", cat: "Musique" },
    // Amazon Prime
    { name: "Amazon Prime", regex: /amazon\s*prime/i, amount: /(\d+[.,]\d+)\s*€?\s*(?:par\s*(?:an|year|annuel))/i, freq: "annual", cat: "Shopping" },
    // Apple
    { name: "Apple", regex: /apple\s*(?:tv|music|one|icloud)/i, amount: /(\d+[.,]\d+)\s*€?/i, freq: "monthly", cat: "Streaming" },
    // Disney+
    { name: "Disney+", regex: /disney\s*\+/i, amount: /(\d+[.,]\d+)\s*€?\s*(?:par\s*mois|month|mois)/i, freq: "monthly", cat: "Streaming" },
    // ChatGPT/OpenAI
    { name: "ChatGPT Plus", regex: /chatgpt|openai/i, amount: /(\d+)\s*€?\s*(?:par\s*mois|month|mois)/i, freq: "monthly", cat: "IA" },
    // Microsoft 365
    { name: "Microsoft 365", regex: /microsoft\s*365|office\s*365/i, amount: /(\d+[.,]\d+)\s*€?(?:\/mois)?/i, freq: "monthly", cat: "Productivité" },
    // Adobe
    { name: "Adobe", regex: /adobe/i, amount: /(\d+[.,]\d+)\s*€?(?:\/mois)?/i, freq: "monthly", cat: "Productivité" },
  ];

  for (const email of emails) {
    const text = `${email.subject} ${email.body}`;
    
    for (const pattern of patterns) {
      if (pattern.regex.test(text) && !seen.has(pattern.name)) {
        const amountMatch = text.match(pattern.amount);
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1].replace(",", "."));
          if (amount > 0 && amount < 1000) {
            subscriptions.push({
              serviceName: pattern.name,
              amount,
              billingFrequency: pattern.freq,
              category: pattern.cat,
            });
            seen.add(pattern.name);
          }
        }
      }
    }
  }

  return subscriptions;
}
