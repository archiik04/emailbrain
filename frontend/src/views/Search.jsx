import { useState } from "react";
import axios from "axios";

export default function Search({ API }) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setResults(null);
    try {
      const r = await axios.post(`${API}/search`, { query, top_k: 5 });
      setResults(r.data);
    } catch { setResults({ error: "Search failed." }); }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Search</h2>
        <p style={styles.subtitle}>Ask anything about your emails</p>
      </div>

      <div style={styles.searchBox}>
        <input
          style={styles.input}
          placeholder='e.g. "What did I agree to with TCS?" or "internship deadlines"'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
        />
        <button style={styles.btn} onClick={search} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {results?.error && <div style={styles.error}>{results.error}</div>}

      {results?.summary && (
        <div style={styles.summary}>
          <div style={styles.summaryLabel}>AI Summary</div>
          <p style={styles.summaryText}>{results.summary}</p>
        </div>
      )}

      {results?.results?.length > 0 && (
        <div style={styles.resultsList}>
          <div style={styles.resultsLabel}>Matching emails</div>
          {results.results.map((r, i) => (
            <div key={i} style={styles.resultCard}>
              <div style={styles.resultTop}>
                <span style={styles.match}>{r.similarity}% match</span>
                <span style={styles.resultDate}>{r.date}</span>
              </div>
              <div style={styles.resultSubject}>{r.subject}</div>
              <div style={styles.resultSender}>{r.sender}</div>
              <p style={styles.resultBody}>{r.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container:    { padding: 28, overflowY: "auto", height: "100%" },
  header:       { marginBottom: 24 },
  title:        { fontSize: 18, fontWeight: 600, color: "#fff" },
  subtitle:     { fontSize: 13, color: "#555", marginTop: 4 },
  searchBox:    { display: "flex", gap: 10, marginBottom: 24 },
  input:        { flex: 1, padding: "10px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#e0e0e0", fontSize: 14 },
  btn:          { padding: "10px 20px", background: "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 500 },
  summary:      { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 16, marginBottom: 20 },
  summaryLabel: { fontSize: 11, color: "#7c3aed", fontWeight: 600, marginBottom: 8 },
  summaryText:  { fontSize: 14, color: "#ccc", lineHeight: 1.6 },
  resultsList:  { display: "flex", flexDirection: "column", gap: 10 },
  resultsLabel: { fontSize: 11, color: "#555", fontWeight: 600, marginBottom: 4 },
  resultCard:   { background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, padding: 14 },
  resultTop:    { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  match:        { fontSize: 11, color: "#4ade80", fontWeight: 600 },
  resultDate:   { fontSize: 11, color: "#555" },
  resultSubject:{ fontSize: 14, color: "#fff", fontWeight: 500, marginBottom: 2 },
  resultSender: { fontSize: 12, color: "#666", marginBottom: 6 },
  resultBody:   { fontSize: 12, color: "#888", lineHeight: 1.5 },
  error:        { color: "#f87171", fontSize: 13 },
};