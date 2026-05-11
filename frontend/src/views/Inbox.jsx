import { useState, useEffect } from "react";
import axios from "axios";

export default function Inbox({ API }) {
  const [emails, setEmails]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [draft, setDraft]       = useState("");
  const [drafting, setDrafting] = useState(false);
  const [tone, setTone]         = useState("neutral");

  useEffect(() => {
    axios.get(`${API}/triage?limit=30`)
      .then(r => { setEmails(r.data.emails); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const generateDraft = async (email) => {
    setDrafting(true); setDraft("");
    try {
      const r = await axios.post(`${API}/draft`, {
        subject: email.subject,
        sender:  email.sender,
        body:    email.body || "",
        tone_override: tone === "auto" ? null : tone,
      });
      setDraft(r.data.draft);
    } catch { setDraft("Failed to generate draft."); }
    setDrafting(false);
  };

  const scoreColor = (s) => {
    if (s >= 8) return "#f87171";
    if (s >= 6) return "#fb923c";
    if (s >= 4) return "#facc15";
    return "#4ade80";
  };

  if (loading) return <div style={styles.center}>Loading your inbox...</div>;

  return (
    <div style={styles.container}>
      {/* Email list */}
      <div style={styles.list}>
        <div style={styles.listHeader}>
          <h2 style={styles.title}>Inbox</h2>
          <span style={styles.subtitle}>{emails.length} emails sorted by urgency</span>
        </div>
        {emails.length === 0 && (
          <div style={styles.empty}>No emails scored yet. Run triage first.</div>
        )}
        {emails.map(e => (
          <div
            key={e.message_id}
            style={{
              ...styles.emailRow,
              ...(selected?.message_id === e.message_id ? styles.emailRowActive : {})
            }}
            onClick={() => { setSelected(e); setDraft(""); }}
          >
            <div style={styles.emailRowTop}>
              <span style={{ ...styles.score, color: scoreColor(e.score) }}>
                {e.score}/10
              </span>
              <span style={styles.emailSubject}>{e.subject || "(no subject)"}</span>
            </div>
            <div style={styles.emailSender}>{e.sender}</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div style={styles.detail}>
        {!selected ? (
          <div style={styles.center}>Select an email to draft a reply</div>
        ) : (
          <>
            <div style={styles.detailHeader}>
              <div style={styles.detailSubject}>{selected.subject}</div>
              <div style={styles.detailSender}>From: {selected.sender}</div>
              <div style={styles.detailDate}>{selected.date}</div>
            </div>

            <div style={styles.toneRow}>
              <span style={styles.toneLabel}>Tone:</span>
              {["auto", "casual", "neutral", "formal"].map(t => (
                <button
                  key={t}
                  style={{ ...styles.toneBtn, ...(tone === t ? styles.toneBtnActive : {}) }}
                  onClick={() => setTone(t)}
                >{t}</button>
              ))}
              <button
                style={styles.draftBtn}
                onClick={() => generateDraft(selected)}
                disabled={drafting}
              >
                {drafting ? "Generating..." : "✨ Generate Draft"}
              </button>
            </div>

            {draft && (
              <div style={styles.draftBox}>
                <div style={styles.draftLabel}>Draft reply</div>
                <textarea
                  style={styles.draftArea}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={10}
                />
                <div style={styles.draftNote}>
                  ✓ Edit above then copy into your email client to send
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container:      { display: "flex", height: "100%", overflow: "hidden" },
  list:           { width: 340, borderRight: "1px solid #2a2a2a", overflowY: "auto", display: "flex", flexDirection: "column" },
  listHeader:     { padding: "20px 16px 12px", borderBottom: "1px solid #2a2a2a" },
  title:          { fontSize: 18, fontWeight: 600, color: "#fff" },
  subtitle:       { fontSize: 12, color: "#555", marginTop: 2, display: "block" },
  emailRow:       { padding: "12px 16px", borderBottom: "1px solid #1e1e1e", cursor: "pointer", transition: "background 0.1s" },
  emailRowActive: { background: "#2a2a2a" },
  emailRowTop:    { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  score:          { fontSize: 12, fontWeight: 600, minWidth: 34 },
  emailSubject:   { fontSize: 13, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  emailSender:    { fontSize: 11, color: "#666" },
  detail:         { flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 },
  detailHeader:   { borderBottom: "1px solid #2a2a2a", paddingBottom: 16 },
  detailSubject:  { fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 6 },
  detailSender:   { fontSize: 13, color: "#888" },
  detailDate:     { fontSize: 12, color: "#555", marginTop: 2 },
  toneRow:        { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  toneLabel:      { fontSize: 13, color: "#888" },
  toneBtn:        { padding: "5px 12px", border: "1px solid #333", borderRadius: 6, background: "transparent", color: "#888", fontSize: 12, cursor: "pointer" },
  toneBtnActive:  { background: "#2a2a2a", color: "#fff", borderColor: "#555" },
  draftBtn:       { marginLeft: "auto", padding: "7px 16px", background: "#7c3aed", border: "none", borderRadius: 6, color: "#fff", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  draftBox:       { background: "#1a1a1a", borderRadius: 10, padding: 16, border: "1px solid #2a2a2a" },
  draftLabel:     { fontSize: 12, color: "#7c3aed", fontWeight: 600, marginBottom: 10 },
  draftArea:      { width: "100%", background: "#0f0f0f", border: "1px solid #2a2a2a", borderRadius: 6, color: "#e0e0e0", fontSize: 13, padding: 12, resize: "vertical", lineHeight: 1.6 },
  draftNote:      { fontSize: 11, color: "#4ade80", marginTop: 8 },
  center:         { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555", fontSize: 14 },
  empty:          { padding: 20, color: "#555", fontSize: 13 },
};