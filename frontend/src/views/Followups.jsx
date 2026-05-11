import { useState, useEffect } from "react";
import axios from "axios";

export default function Followups({ API }) {
  const [followups, setFollowups] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [nudge,     setNudge]     = useState({});
  const [nudging,   setNudging]   = useState(null);

  const load = () => {
    setLoading(true);
    axios.get(`${API}/followups?days=3`)
      .then(r => { setFollowups(r.data.followups); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const generateNudge = async (fu) => {
    setNudging(fu.message_id);
    try {
      const r = await axios.post(`${API}/followups/nudge`, {
        subject:      fu.subject,
        recipient:    fu.recipient,
        days_waiting: fu.days_waiting,
      });
      setNudge(prev => ({ ...prev, [fu.message_id]: r.data.nudge }));
    } catch { setNudge(prev => ({ ...prev, [fu.message_id]: "Failed to generate nudge." })); }
    setNudging(null);
  };

  const resolve = async (message_id) => {
    await axios.post(`${API}/followups/resolve`, { message_id });
    setFollowups(prev => prev.filter(f => f.message_id !== message_id));
  };

  if (loading) return <div style={styles.center}>Scanning for follow-ups...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Follow-ups</h2>
        <p style={styles.subtitle}>{followups.length} emails waiting for a reply</p>
      </div>

      {followups.length === 0 && (
        <div style={styles.empty}>🎉 You're all caught up! No pending follow-ups.</div>
      )}

      {followups.map(fu => (
        <div key={fu.message_id} style={styles.card}>
          <div style={styles.cardTop}>
            <span style={styles.days}>{fu.days_waiting}d waiting</span>
            <button style={styles.resolveBtn} onClick={() => resolve(fu.message_id)}>
              ✓ Resolve
            </button>
          </div>
          <div style={styles.subject}>{fu.subject}</div>
          <div style={styles.recipient}>To: {fu.recipient}</div>
          <div style={styles.sentDate}>Sent: {fu.sent_date}</div>

          <button
            style={styles.nudgeBtn}
            onClick={() => generateNudge(fu)}
            disabled={nudging === fu.message_id}
          >
            {nudging === fu.message_id ? "Writing nudge..." : "✨ Write follow-up nudge"}
          </button>

          {nudge[fu.message_id] && (
            <div style={styles.nudgeBox}>
              <div style={styles.nudgeLabel}>Nudge draft</div>
              <textarea
                style={styles.nudgeArea}
                defaultValue={nudge[fu.message_id]}
                rows={5}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container:  { padding: 28, overflowY: "auto", height: "100%" },
  header:     { marginBottom: 24 },
  title:      { fontSize: 18, fontWeight: 600, color: "#fff" },
  subtitle:   { fontSize: 13, color: "#555", marginTop: 4 },
  card:       { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, marginBottom: 12 },
  cardTop:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  days:       { fontSize: 12, color: "#fb923c", fontWeight: 600 },
  resolveBtn: { padding: "4px 12px", background: "transparent", border: "1px solid #333", borderRadius: 6, color: "#4ade80", fontSize: 12, cursor: "pointer" },
  subject:    { fontSize: 14, color: "#fff", fontWeight: 500, marginBottom: 4 },
  recipient:  { fontSize: 12, color: "#666" },
  sentDate:   { fontSize: 11, color: "#555", marginBottom: 12 },
  nudgeBtn:   { padding: "7px 14px", background: "#7c3aed", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  nudgeBox:   { marginTop: 12, background: "#0f0f0f", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" },
  nudgeLabel: { fontSize: 11, color: "#7c3aed", fontWeight: 600, marginBottom: 8 },
  nudgeArea:  { width: "100%", background: "transparent", border: "none", color: "#ccc", fontSize: 13, resize: "vertical", lineHeight: 1.6 },
  empty:      { color: "#4ade80", fontSize: 14, padding: 20 },
  center:     { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555" },
};