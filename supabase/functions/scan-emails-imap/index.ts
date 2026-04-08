// supabase/functions/scan-emails-imap/index.ts
// Edge Function to scan emails via IMAP

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "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";

interface Subscription {
  serviceName: string;
  amount: number;
  billingFrequency: string;
  category: string;
}

Deno.serve(async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    const { email, appPassword } = await req.json();

    if (!email || !appPassword) {
      return new Response(
        JSON.stringify({ error: "Email et App Password requis" }),
        { status: 400, headers }
      );
    }

    console.log(`Connexion IMAP pour: ${email}`);

    // Fetch emails via IMAP using simple TCP connection
    const emails = await fetchEmailsViaIMAP(email, appPassword);
    
    console.log(`${emails.length} emails recuperes`);

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ subscriptions: [], message: "Aucun email trouve" }),
        { headers }
      );
    }

    // Analyze with AI
    const subscriptions = await analyzeEmailsWithAI(emails);

    return new Response(
      JSON.stringify({ subscriptions, emailCount: emails.length }),
      { headers }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers }
    );
  }
});

async function fetchEmailsViaIMAP(email: string, password: string): Promise<string[]> {
  // Using a simple IMAP approach with base64 encoding
  const imapHost = "imap.gmail.com";
  const imapPort = 993;

  const credentials = btoa(`\0${email}\0${password}`);
  
  try {
    // Connect to IMAP server
    const conn = await Deno.connectTls({
      hostname: imapHost,
      port: imapPort,
    });

    // Read greeting
    const greeting = await readLine(conn);
    console.log("IMAP greeting:", greeting);

    // Login
    const loginCmd = `A001 LOGIN "${email}" "${password}"\r\n`;
    await conn.write(new TextEncoder().encode(loginCmd));
    const loginResp = await readLine(conn);
    console.log("Login:", loginResp);

    if (!loginResp.includes("OK")) {
      throw new Error("IMAP login failed");
    }

    // Select INBOX
    const selectCmd = "A002 SELECT INBOX\r\n";
    await conn.write(new TextEncoder().encode(selectCmd));
    const selectResp = await readLine(conn);
    console.log("Select:", selectResp);

    // Search for subscription-related emails
    const searchCmd = 'A003 SEARCH CHARSET UTF-8 SUBJECT "subscription" OR SUBJECT "receipt" OR SUBJECT "invoice" OR SUBJECT "paiement" OR SUBJECT "facturation"\r\n';
    await conn.write(new TextEncoder().encode(searchCmd));
    
    // Read search results (multiple lines)
    let searchResults = "";
    let line;
    while (true) {
      line = await readLine(conn);
      searchResults += line;
      if (line.includes("SEARCH") || line.includes("A003 OK")) {
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }

    console.log("Search results:", searchResults);

    // Extract message IDs
    const ids = searchResults.match(/\d+/g) || [];
    console.log(`Found ${ids.length} matching emails`);

    if (ids.length === 0) {
      // Get recent emails
      const fetchCmd = `A004 FETCH 1:* (BODY[TEXT])\r\n`;
      await conn.write(new TextEncoder().encode(fetchCmd));
    } else {
      // Fetch first 10 matching emails
      const fetchIds = ids.slice(0, 10).join(",");
      const fetchCmd = `A004 FETCH ${fetchIds} (BODY[TEXT])\r\n`;
      await conn.write(new TextEncoder().encode(fetchCmd));
    }

    // Read all email content
    let emails = [];
    let emailContent = "";
    let inEmail = false;
    
    const timeout = setTimeout(() => {
      throw new Error("IMAP fetch timeout");
    }, 30000);

    try {
      const reader = conn.readable.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        emailContent += decoder.decode(value, { stream: true });
        
        if (emailContent.includes("A004 OK") || emailContent.includes("A004 BAD")) {
          break;
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    // Logout
    const logoutCmd = "A005 LOGOUT\r\n";
    await conn.write(new TextEncoder().encode(logoutCmd));
    await readLine(conn);

    conn.close();

    // Parse email content (simplified)
    return parseEmailContent(emailContent);

  } catch (error) {
    console.error("IMAP Error:", error);
    throw error;
  }
}

async function readLine(conn: Deno.Conn): Promise<string> {
  const decoder = new TextDecoder();
  let line = "";
  
  const buf = new Uint8Array(1);
  while (true) {
    const n = await conn.read(buf);
    if (n === null || n === 0) break;
    const char = decoder.decode(buf);
    if (char === "\n") break;
    line += char;
  }
  
  return line.trim();
}

function parseEmailContent(content: string): string[] {
  const emails: string[] = [];
  
  // Simple extraction of email bodies
  const lines = content.split(/\r?\n/);
  let currentEmail = "";
  
  for (const line of lines) {
    if (line.includes("* FETCH") || line.includes("A004")) {
      if (currentEmail) {
        emails.push(currentEmail);
      }
      currentEmail = "";
    } else {
      currentEmail += line + " ";
    }
  }
  
  if (currentEmail) {
    emails.push(currentEmail);
  }
  
  return emails.slice(0, 20);
}

async function analyzeEmailsWithAI(emails: string[]): Promise<Subscription[]> {
  if (emails.length === 0) return [];

  try {
    const emailContent = emails.join("\n\n---\n\n").slice(0, 15000);

    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `Tu es un expert financier qui analyse les emails de facturation.
Extrait tous les abonnements actifs (streaming, musique, cloud, IA, jeux, etc.)

Pour chaque abonnement, retourne EXACTEMENT ce format JSON:
{"subscriptions": [{"serviceName": "Nom", "amount": 0.00, "billingFrequency": "monthly/annual", "category": "Streaming/Musique/IA/Productivite/Stockage/Securite/Shopping/Autre"}]}

REGLES:
- Cherche les montants dans les emails
- Ne retourne que du JSON valide`
          },
          {
            role: "user",
            content: `Analyse ces emails:\n\n${emailContent}`
          }
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
        const result = JSON.parse(jsonMatch[0]);
        return result.subscriptions || [];
      }
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
  }

  return [];
}
