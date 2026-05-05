// supabase/functions/scan-emails-supabase/index.ts
// Edge Function to scan emails using Supabase user session

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama3-70b-8192";

Deno.serve(async (req) => {
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
    const { email } = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization requise" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Scan demande pour: ${email}`);

    // Demo subscriptions for testing
    const demoSubscriptions = [
      { serviceName: "Netflix", amount: 15.99, billingFrequency: "monthly", category: "Streaming" },
      { serviceName: "Spotify", amount: 9.99, billingFrequency: "monthly", category: "Musique" },
      { serviceName: "Amazon Prime", amount: 69.99, billingFrequency: "annual", category: "Shopping" },
      { serviceName: "iCloud", amount: 2.99, billingFrequency: "monthly", category: "Cloud" },
    ];

    return new Response(
      JSON.stringify({
        subscriptions: demoSubscriptions,
        emailCount: 50,
        message: "Demo - configurez l'API Gmail pour un vrai scan",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
