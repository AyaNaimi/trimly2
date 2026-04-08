import { useState } from "react";

const GMAIL_MCP_URL = "https://gmail.mcp.claude.com/mcp";

const CATEGORIES = ["Streaming", "Musique", "IA", "Productivité", "Santé & Sport", "Sécurité", "Shopping", "Autre"];
const FREQUENCIES = ["Hebdo", "Mensuel", "Trimestriel", "Annuel"];

const FREQ_MAP = { Hebdo: "weekly", Mensuel: "monthly", Trimestriel: "quarterly", Annuel: "annual" };

const CAT_EMOJI = {
  Streaming: "🎬", Musique: "🎵", IA: "🤖", Productivité: "💼",
  "Santé & Sport": "🏋️", Sécurité: "🔒", Shopping: "🛍️", Autre: "📦",
};

const SERVICE_EMOJI = {
  netflix: "🎬", spotify: "🎵", "apple tv": "🍎", disney: "🏰",
  youtube: "▶️", adobe: "🎨", notion: "📝", chatgpt: "🤖",
  openai: "🤖", microsoft: "💻", google: "🔍", amazon: "📦",
  dropbox: "📁", slack: "💬", zoom: "📹", linkedin: "💼",
  default: "📦",
};

function getEmoji(name = "") {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(SERVICE_EMOJI)) {
    if (lower.includes(key)) return val;
  }
  return "📦";
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 20,
      border: active ? "none" : "1.5px solid #E5E7EB",
      background: active ? "#1a2340" : "#fff",
      color: active ? "#fff" : "#6B7280",
      fontSize: 13, fontFamily: "inherit",
      cursor: "pointer", fontWeight: active ? 600 : 400,
      transition: "all 0.15s",
      whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function SubRow({ sub, selected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", borderRadius: 16,
        border: `1.5px solid ${selected ? "#1a2340" : "#F3F4F6"}`,
        background: selected ? "#F8F9FF" : "#fff",
        cursor: "pointer", marginBottom: 8,
        transition: "all 0.15s",
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 7,
        border: `2px solid ${selected ? "#1a2340" : "#D1D5DB"}`,
        background: selected ? "#1a2340" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "all 0.15s",
      }}>
        {selected && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
      </div>

      {/* Emoji */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "#F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>{getEmoji(sub.serviceName)}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{sub.serviceName}</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
          {sub.category} · {sub.billingFrequency}
          {sub.trialDays > 0 && <span style={{ color: "#F59E0B", marginLeft: 6 }}>⏳ {sub.trialDays}j d'essai</span>}
        </div>
        {sub.startDate && (
          <div style={{ fontSize: 11, color: "#C4C9D4", marginTop: 1 }}>📅 depuis {sub.startDate}</div>
        )}
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
          {sub.amount ? `${sub.amount}` : "—"}
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF" }}>MAD/mois</div>
      </div>
    </div>
  );
}

function ImportedBadge({ sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px", borderRadius: 14,
      background: "#F0FDF4", border: "1.5px solid #BBF7D0",
      marginBottom: 8,
    }}>
      <span style={{ fontSize: 20 }}>{getEmoji(sub.serviceName)}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{sub.serviceName}</div>
        <div style={{ fontSize: 12, color: "#6B7280" }}>{sub.category} · {sub.billingFrequency}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontWeight: 700, color: "#111827" }}>{sub.amount} MAD</div>
        <div style={{ fontSize: 11, color: "#10B981" }}>✓ Importé</div>
      </div>
    </div>
  );
}

export default function EmailScanner() {
  const [step, setStep] = useState("idle"); // idle | scanning | review | imported
  const [found, setFound] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [logs, setLogs] = useState([]);
  const [imported, setImported] = useState([]);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState("Tous");

  const addLog = (m) => setLogs(p => [...p, m]);

  const scan = async () => {
    setStep("scanning");
    setFound([]); setSelected(new Set()); setLogs([]); setError("");

    try {
      addLog("Connexion à Gmail...");

      const system = `Tu es un assistant qui analyse des emails pour détecter des abonnements payants.
Utilise les outils Gmail pour chercher des emails de facturation, confirmation d'abonnement, renouvellement, essai gratuit.
Recherche avec: subscription billing invoice trial renewal receipt payment abonnement facture renouvellement essai.

Pour chaque abonnement unique trouvé, retourne un objet avec exactement ces champs:
- serviceName: string (nom du service)
- amount: number (montant mensuel en MAD/EUR/USD, convertir si nécessaire)
- currency: string
- billingFrequency: une valeur parmi exactement ["Hebdo","Mensuel","Trimestriel","Annuel"]
- startDate: string (DD/MM/YYYY ou null)
- trialDays: number (0 si pas de trial)
- category: une valeur parmi exactement ["Streaming","Musique","IA","Productivité","Santé & Sport","Sécurité","Shopping","Autre"]
- status: "active" | "cancelled" | "trial"
- senderEmail: string

IMPORTANT: Réponds UNIQUEMENT avec du JSON valide, pas de markdown, pas de backticks, pas d'explication.
Format: {"subscriptions": [...], "emailsScanned": number}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system,
          messages: [{ role: "user", content: "Analyse tous mes emails des 6 derniers mois et détecte tous mes abonnements, services payants, trials en cours. Cherche dans tous les dossiers." }],
          mcp_servers: [{ type: "url", url: GMAIL_MCP_URL, name: "gmail" }],
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error?.message || "Erreur API");

      const data = await res.json();
      addLog("Emails analysés avec succès");

      const toolCalls = data.content.filter(b => b.type === "mcp_tool_use");
      addLog(`${toolCalls.length} recherche(s) Gmail effectuée(s)`);

      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
      const match = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match[0]);
      const subs = parsed.subscriptions || [];

      addLog(`${parsed.emailsScanned || "?"} emails scannés`);
      addLog(`${subs.length} abonnement(s) détecté(s)`);

      setFound(subs);
      setSelected(new Set(subs.filter(s => s.status !== "cancelled").map((_, i) => i)));
      setStep("review");
    } catch (e) {
      setError(e.message);
      setStep("idle");
    }
  };

  const toggleAll = () => {
    if (selected.size === found.length) setSelected(new Set());
    else setSelected(new Set(found.map((_, i) => i)));
  };

  const importSelected = () => {
    const toImport = found.filter((_, i) => selected.has(i));
    // Here you'd call: supabase.from('subscriptions').insert(toImport)
    setImported(toImport);
    setStep("imported");
  };

  const cats = ["Tous", ...CATEGORIES.filter(c => found.some(s => s.category === c))];
  const filtered = filterCat === "Tous" ? found : found.filter(s => s.category === filterCat);

  const totalSelected = found
    .filter((s, i) => selected.has(i) && s.amount)
    .reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F9FAFB",
      fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
      padding: "0 0 40px",
    }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#fff",
        padding: "20px 24px 16px",
        borderBottom: "1px solid #F3F4F6",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#111827", letterSpacing: -0.5 }}>
              IMPORTER
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
              Détection via Gmail
            </p>
          </div>
          {step === "review" && (
            <button onClick={() => setStep("idle")} style={{
              background: "transparent", border: "1.5px solid #E5E7EB",
              borderRadius: 20, padding: "6px 14px", fontSize: 13,
              color: "#6B7280", cursor: "pointer",
            }}>← Retour</button>
          )}
        </div>
      </div>

      <div style={{ padding: "24px 20px" }}>

        {/* IDLE */}
        {step === "idle" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {/* Hero card */}
            <div style={{
              background: "#1a2340",
              borderRadius: 24, padding: "32px 24px",
              textAlign: "center", marginBottom: 20,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📬</div>
              <h2 style={{ margin: "0 0 8px", color: "#fff", fontSize: 20, fontWeight: 700 }}>
                Scan automatique
              </h2>
              <p style={{ margin: "0 0 24px", color: "#8B95B0", fontSize: 14, lineHeight: 1.6 }}>
                L'IA analyse tes emails et détecte<br />
                automatiquement tous tes abonnements
              </p>
              <button onClick={scan} style={{
                background: "#fff", color: "#1a2340",
                border: "none", borderRadius: 14,
                padding: "14px 32px", fontSize: 15,
                fontWeight: 700, cursor: "pointer",
                width: "100%", maxWidth: 280,
              }}>
                Lancer l'analyse
              </button>
            </div>

            {/* What it detects */}
            <div style={{
              background: "#fff", borderRadius: 20, padding: "20px",
              border: "1px solid #F3F4F6",
            }}>
              <p style={{ margin: "0 0 14px", fontSize: 11, color: "#9CA3AF", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
                Ce qui sera détecté
              </p>
              {[
                ["💳", "Montant & devise", "Tarif mensuel / annuel"],
                ["📅", "Dates", "Début, prochain prélèvement"],
                ["⏳", "Périodes d'essai", "Jours restants de trial"],
                ["🏷", "Catégorie", "Streaming, Musique, IA…"],
                ["🔄", "Fréquence", "Hebdo, Mensuel, Annuel…"],
              ].map(([icon, title, sub]) => (
                <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                  <span style={{ fontSize: 18, width: 24, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{title}</div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div style={{
                marginTop: 16, padding: "14px 16px",
                background: "#FEF2F2", borderRadius: 14,
                border: "1px solid #FECACA",
                color: "#DC2626", fontSize: 13,
              }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* SCANNING */}
        {step === "scanning" && (
          <div style={{ textAlign: "center", paddingTop: 40, animation: "fadeUp 0.3s ease" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              border: "3px solid #E5E7EB",
              borderTopColor: "#1a2340",
              animation: "spin 1s linear infinite",
              margin: "0 auto 24px",
            }} />
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#111827" }}>
              Analyse en cours...
            </h2>
            <p style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 32 }}>
              Ne ferme pas l'app
            </p>
            <div style={{
              background: "#fff", borderRadius: 16, padding: "16px 20px",
              border: "1px solid #F3F4F6", textAlign: "left",
            }}>
              {logs.map((l, i) => (
                <div key={i} style={{
                  fontSize: 13, color: "#6B7280", padding: "4px 0",
                  animation: "fadeUp 0.3s ease",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ color: "#10B981" }}>✓</span> {l}
                </div>
              ))}
              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#D1D5DB",
                    animation: `pulse 1.2s ease ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* REVIEW */}
        {step === "review" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>

            {/* Summary bar */}
            <div style={{
              background: "#1a2340", borderRadius: 18,
              padding: "16px 20px", marginBottom: 16,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ color: "#8B95B0", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                  Détectés
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>
                  {found.length} abonnements
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#8B95B0", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
                  Total sélectionné
                </div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 22 }}>
                  {totalSelected.toFixed(2)} MAD
                </div>
              </div>
            </div>

            {/* Select all */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>
                {selected.size}/{found.length} sélectionnés
              </span>
              <button onClick={toggleAll} style={{
                background: "transparent", border: "none",
                color: "#1a2340", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                {selected.size === found.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            {/* Category filter */}
            {cats.length > 2 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 12 }}>
                {cats.map(c => (
                  <Chip key={c} label={c} active={filterCat === c} onClick={() => setFilterCat(c)} />
                ))}
              </div>
            )}

            {/* List */}
            {filtered.map((sub, i) => {
              const realIdx = found.indexOf(sub);
              return (
                <SubRow
                  key={i}
                  sub={sub}
                  selected={selected.has(realIdx)}
                  onToggle={() => {
                    const s = new Set(selected);
                    s.has(realIdx) ? s.delete(realIdx) : s.add(realIdx);
                    setSelected(s);
                  }}
                />
              );
            })}

            {/* Import button */}
            <div style={{ position: "sticky", bottom: 20, marginTop: 20 }}>
              <button
                onClick={importSelected}
                disabled={selected.size === 0}
                style={{
                  width: "100%", padding: "16px",
                  background: selected.size > 0 ? "#1a2340" : "#E5E7EB",
                  color: selected.size > 0 ? "#fff" : "#9CA3AF",
                  border: "none", borderRadius: 16,
                  fontSize: 15, fontWeight: 700, cursor: selected.size > 0 ? "pointer" : "not-allowed",
                  boxShadow: selected.size > 0 ? "0 8px 24px rgba(26,35,64,0.3)" : "none",
                  transition: "all 0.2s",
                }}
              >
                Importer {selected.size > 0 ? `${selected.size} abonnement${selected.size > 1 ? "s" : ""}` : ""}
              </button>
            </div>
          </div>
        )}

        {/* IMPORTED */}
        {step === "imported" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "#F0FDF4", border: "2px solid #BBF7D0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, margin: "0 auto 16px",
              }}>✓</div>
              <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 700, color: "#111827" }}>
                {imported.length} abonnement{imported.length > 1 ? "s" : ""} importé{imported.length > 1 ? "s" : ""} !
              </h2>
              <p style={{ margin: 0, color: "#9CA3AF", fontSize: 13 }}>
                Ajoutés à ton dashboard Plans
              </p>
            </div>

            {imported.map((sub, i) => <ImportedBadge key={i} sub={sub} />)}

            <button
              onClick={() => { setStep("idle"); setImported([]); }}
              style={{
                width: "100%", padding: "14px",
                background: "#1a2340", color: "#fff",
                border: "none", borderRadius: 14,
                fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 20,
              }}
            >
              Retour aux Plans
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
