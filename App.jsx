import { useState } from "react";

const SAMPLE = `Weekly sync 10 Jun — Priya, Rohan, Meera, Dev

- launch slipped, priya said she'll redo the landing page copy, wants it done before the campaign starts
- rohan to fix the checkout bug!! urgent, QA flagged it friday
- need someone to talk to the vendor about the invoice mess (who??)
- meera presenting the metrics deck to leadership next thursday
- dev mentioned the hiring JD is half done, will share "soon"
- budget approval still pending from finance, no date given
- also someone should book the offsite venue before prices go up`;

// The system prompt lives server-side in /api/distill.js — the browser
// never sees the prompt or the API key.

const C = {
  paper: "#FAF9F5",
  panel: "#FFFFFF",
  ink: "#1B2A3A",
  inkSoft: "#52606F",
  line: "#E4E1D8",
  amber: "#B45309",
  amberBg: "#FCF3E3",
  green: "#0F6E56",
  greenBg: "#E1F5EE",
  red: "#A32D2D",
};

const PRIORITY_DOT = { high: "#D14520", medium: "#B45309", low: "#888780" };

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default function Distill() {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function analyze() {
    if (!notes.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const parsed = await res.json();
      if (!res.ok) {
        throw new Error(parsed.error || "Request failed");
      }
      setResult(parsed);
    } catch (e) {
      setError(e.message || "Couldn't analyze the notes. Please try again.");
    }
    setLoading(false);
  }

  const groups = {};
  if (result) {
    for (const a of result.actions || []) {
      const key = a.owner || "Unassigned";
      (groups[key] = groups[key] || []).push(a);
    }
  }
  const groupNames = Object.keys(groups).sort((a, b) =>
    a === "Unassigned" ? 1 : b === "Unassigned" ? -1 : a.localeCompare(b)
  );

  return (
    <div style={{ minHeight: "100vh", background: C.paper, color: C.ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');
        textarea:focus, button:focus-visible { outline: 2px solid ${C.ink}; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>

      <header style={{ borderBottom: `1px solid ${C.line}`, padding: "20px 28px", display: "flex", alignItems: "baseline", gap: 14 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, margin: 0 }}>Distill</h1>
        <span style={{ fontSize: 13, color: C.inkSoft }}>messy meeting notes → clean action points</span>
      </header>

      <main style={{ display: "grid", gridTemplateColumns: "minmax(280px, 5fr) minmax(320px, 7fr)", gap: 0, maxWidth: 1200, margin: "0 auto" }}>
        {/* LEFT — raw notes */}
        <section style={{ borderRight: `1px solid ${C.line}`, padding: "24px 24px 32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, letterSpacing: "0.06em", color: C.inkSoft, fontWeight: 600 }}>RAW NOTES</span>
            <button
              onClick={() => setNotes(SAMPLE)}
              style={{ fontSize: 12, background: "none", border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: C.inkSoft }}
            >
              Use sample notes
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={"Paste meeting notes here — bullet soup, half sentences, all welcome."}
            rows={16}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7,
              background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10,
              padding: 14, color: C.ink,
            }}
          />
          <button
            onClick={analyze}
            disabled={loading || !notes.trim()}
            style={{
              marginTop: 14, width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 600,
              fontFamily: "'Inter', sans-serif", color: "#fff",
              background: loading || !notes.trim() ? "#9AA3AD" : C.ink,
              border: "none", borderRadius: 10, cursor: loading || !notes.trim() ? "default" : "pointer",
            }}
          >
            {loading ? "Analyzing…" : "Extract action points"}
          </button>
        </section>

        {/* RIGHT — distilled board */}
        <section style={{ padding: "24px 28px 48px" }}>
          {!result && !loading && !error && (
            <div style={{ color: C.inkSoft, fontSize: 14, paddingTop: 60, textAlign: "center" }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, color: C.ink, marginBottom: 8 }}>
                Nothing distilled yet
              </div>
              Paste notes on the left and extract action points.
            </div>
          )}

          {loading && (
            <div style={{ paddingTop: 60, textAlign: "center", color: C.inkSoft, fontSize: 14 }}>
              <div style={{ animation: "pulse 1.4s ease-in-out infinite" }}>
                Reading the notes… assigning owners… flagging gaps…
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: "#FCEBEB", color: C.red, borderRadius: 10, padding: "12px 16px", fontSize: 14 }}>
              {error}
            </div>
          )}

          {result && (
            <div>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: 17, lineHeight: 1.5, margin: "0 0 22px" }}>
                {result.summary}
              </p>

              {groupNames.map((name) => (
                <div key={name} style={{ marginBottom: 26 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 30, height: 30, borderRadius: "50%", display: "inline-flex",
                        alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600,
                        background: name === "Unassigned" ? C.amberBg : C.ink,
                        color: name === "Unassigned" ? C.amber : "#fff",
                        border: name === "Unassigned" ? `1px dashed ${C.amber}` : "none",
                      }}
                    >
                      {name === "Unassigned" ? "?" : initials(name)}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                    <span style={{ fontSize: 12, color: C.inkSoft }}>
                      {groups[name].length} task{groups[name].length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div style={{ borderLeft: `2px solid ${C.line}`, marginLeft: 14, paddingLeft: 22, display: "grid", gap: 10 }}>
                    {groups[name].map((a, i) => (
                      <div key={i} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: PRIORITY_DOT[a.priority] || PRIORITY_DOT.low }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.45 }}>{a.task}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                              <span style={{
                                fontSize: 12, padding: "2px 10px", borderRadius: 999,
                                background: a.deadline ? C.greenBg : C.amberBg,
                                color: a.deadline ? C.green : C.amber,
                                border: a.deadline ? "none" : `1px dashed ${C.amber}`,
                              }}>
                                {a.deadline ? `Due ${a.deadline}` : "No deadline"}
                              </span>
                              {(a.missing || []).map((m, j) => (
                                <span key={j} style={{ fontSize: 12, padding: "2px 10px", borderRadius: 999, background: C.amberBg, color: C.amber, border: `1px dashed ${C.amber}` }}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {result.gaps && result.gaps.length > 0 && (
                <div style={{ marginTop: 28, background: C.amberBg, border: `1px solid #EAD3A8`, borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.amber, marginBottom: 8, letterSpacing: "0.04em" }}>
                    ASK THE TEAM — MISSING INFORMATION
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, color: "#7A4A10", fontSize: 14, lineHeight: 1.8 }}>
                    {result.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
