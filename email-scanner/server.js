// Trimly Email Scanner Server
// Run this locally to scan emails and return subscriptions

const express = require('express');
const imaps = require('imap-simple');
const mailparser = require('mailparser').simpleParser;

const app = express();
app.use(express.json());

const PORT = 3001;

const SUBSCRIPTION_PATTERNS = [
  { name: "Netflix", search: /netflix/i, amount: 15.99, freq: "monthly", cat: "Streaming" },
  { name: "Spotify Premium", search: /spotify/i, amount: 9.99, freq: "monthly", cat: "Musique" },
  { name: "Disney+", search: /disney/i, amount: 8.99, freq: "monthly", cat: "Streaming" },
  { name: "ChatGPT Plus", search: /chatgpt|openai/i, amount: 20.00, freq: "monthly", cat: "IA" },
  { name: "Amazon Prime", search: /amazon\s*prime/i, amount: 69.99, freq: "annual", cat: "Shopping" },
  { name: "YouTube Premium", search: /youtube\s*premium/i, amount: 11.99, freq: "monthly", cat: "Streaming" },
  { name: "Apple TV+", search: /apple\s*tv/i, amount: 4.99, freq: "monthly", cat: "Streaming" },
  { name: "Apple Music", search: /apple\s*music/i, amount: 10.99, freq: "monthly", cat: "Musique" },
  { name: "Microsoft 365", search: /microsoft\s*365|office\s*365/i, amount: 6.99, freq: "monthly", cat: "Productivite" },
  { name: "Adobe Creative Cloud", search: /adobe/i, amount: 59.99, freq: "monthly", cat: "Productivite" },
  { name: "Dropbox Plus", search: /dropbox/i, amount: 11.99, freq: "monthly", cat: "Stockage" },
  { name: "Canal+", search: /canal/i, amount: 29.99, freq: "monthly", cat: "Streaming" },
  { name: "Deezer Premium", search: /deezer/i, amount: 10.99, freq: "monthly", cat: "Musique" },
  { name: "iCloud+", search: /icloud/i, amount: 2.99, freq: "monthly", cat: "Stockage" },
  { name: "Google One", search: /google\s*one/i, amount: 2.99, freq: "monthly", cat: "Stockage" },
  { name: "NordVPN", search: /nordvpn/i, amount: 11.99, freq: "monthly", cat: "Securite" },
  { name: "PlayStation Plus", search: /playstation|psn/i, amount: 9.99, freq: "monthly", cat: "Jeux" },
  { name: "Nintendo Switch Online", search: /nintendo/i, amount: 3.99, freq: "monthly", cat: "Jeux" },
  { name: "Xbox Game Pass", search: /xbox|game\s*pass/i, amount: 12.99, freq: "monthly", cat: "Jeux" },
  { name: "Crunchyroll", search: /crunchyroll/i, amount: 7.99, freq: "monthly", cat: "Streaming" },
  { name: "Paramount+", search: /paramount/i, amount: 4.99, freq: "monthly", cat: "Streaming" },
  { name: "Notion", search: /notion/i, amount: 8.00, freq: "monthly", cat: "Productivite" },
  { name: "Slack", search: /slack/i, amount: 7.25, freq: "monthly", cat: "Productivite" },
  { name: "Zoom", search: /zoom/i, amount: 14.99, freq: "monthly", cat: "Productivite" },
];

// Amount extraction patterns
const AMOUNT_PATTERNS = [
  /(\d+[.,]\d{2})\s*€?\s*(?:par\s*mois|month|mois|\/m|\/mois)/i,
  /(\d+[.,]\d{2})\s*€?\s*(?:par\s*an|per\s*year|year|annuel|\/an|\/year)/i,
  /montant[:\s]*(\d+[.,]\d{2})/i,
  /amount[:\s]*(\d+[.,]\d{2})/i,
  /total[:\s]*(\d+[.,]\d{2})/i,
  /prix[:\s]*(\d+[.,]\d{2})/i,
  /(\d+[.,]\d{2})\s*€(?!\s*\d)/i,
  /€\s*(\d+[.,]\d{2})/i,
];

function extractAmount(text) {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'));
      if (amount > 0 && amount < 500) {
        return amount;
      }
    }
  }
  return null;
}

app.post('/scan', async (req, res) => {
  const { email, appPassword } = req.body;

  if (!email || !appPassword) {
    return res.status(400).json({ error: "Email et App Password requis" });
  }

  console.log(`Scanning emails for: ${email}`);

  try {
    const config = {
      imap: {
        user: email,
        password: appPassword,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        authTimeout: 10000,
      }
    };

    const connection = await imaps.connect(config);
    
    // Open INBOX
    await connection.openBox('INBOX');

    // Search for subscription-related emails
    const searchCriteria = [
      'UNSEEN',
      ['OR', 
        ['SUBJECT', 'subscription'],
        ['SUBJECT', 'receipt'],
        ['SUBJECT', 'invoice'],
        ['SUBJECT', 'paiement'],
        ['SUBJECT', 'facturation'],
        ['SUBJECT', 'confirmation'],
        ['SUBJECT', 'renewal'],
        ['SUBJECT', 'renouvellement'],
      ]
    ];

    const fetchOptions = {
      bodies: ['text', 'html'],
      markSeen: false,
    };

    console.log('Searching emails...');
    
    let messages = await connection.search(searchCriteria, fetchOptions);
    
    // If no results, get recent emails
    if (messages.length === 0) {
      const recentCriteria = ['ALL'];
      messages = await connection.search(recentCriteria, fetchOptions);
    }

    console.log(`Found ${messages.length} emails`);

    if (messages.length === 0) {
      connection.end();
      return res.json({ subscriptions: [], message: "Aucun email trouve" });
    }

    const subscriptions = [];
    const seen = new Set();

    // Process up to 50 emails
    const emailsToProcess = messages.slice(0, 50);

    for (const message of emailsToProcess) {
      try {
        const allText = message.parts
          .filter(part => part.which === 'text')
          .map(part => part.body)
          .join(' ');

        if (!allText) continue;

        for (const pattern of SUBSCRIPTION_PATTERNS) {
          if (pattern.search.test(allText) && !seen.has(pattern.name)) {
            const extractedAmount = extractAmount(allText) || pattern.amount;
            
            subscriptions.push({
              serviceName: pattern.name,
              amount: extractedAmount,
              billingFrequency: pattern.freq,
              category: pattern.cat
            });
            
            seen.add(pattern.name);
            console.log(`Found: ${pattern.name} - ${extractedAmount}€`);
          }
        }
      } catch (err) {
        console.log('Error processing email:', err.message);
      }
    }

    connection.end();

    console.log(`Total subscriptions found: ${subscriptions.length}`);
    res.json({ 
      subscriptions,
      emailCount: messages.length,
      message: subscriptions.length > 0 ? `${subscriptions.length} abonnements trouves` : "Aucun abonnement trouve"
    });

  } catch (error) {
    console.error('IMAP Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║          Trimly Email Scanner Server                       ║
║                                                            ║
║  Server running on: http://localhost:${PORT}                 ║
║                                                            ║
║  To use: POST /scan with { email, appPassword }           ║
║                                                            ║
║  Example:                                                  ║
║  curl -X POST http://localhost:${PORT}/scan \\               ║
║    -H "Content-Type: application/json" \\                  ║
║    -d '{"email":"you@gmail.com","appPassword":"xxxx"}'    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
