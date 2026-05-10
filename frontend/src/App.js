import { useState, useEffect } from "react";
import axios from "axios";
import Inbox from "./views/Inbox";
import Search from "./views/Search";
import Followups from "./views/Followups";

const API = "http://127.0.0.1:8765";

export default function App() {
  const [tab, setTab] = useState("inbox");

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>✉</span>
          <span style={styles.logoText}>Email Brain</span>
        </div>
        <nav style={styles.nav}>
          {[
            { id: "inbox",     icon: "📥", label: "Inbox"       },
            { id: "search",    icon: "🔍", label: "Search"      },
            { id: "followups", icon: "🔔", label: "Follow-ups"  },
          ].map(item => (
            <button
              key={item.id}
              style={{
                ...styles.navBtn,
                ...(tab === item.id ? styles.navBtnActive : {})
              }}
              onClick={() => setTab(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.privacyBadge}>🔒 100% local</div>
          <div style={styles.privacyNote}>No data leaves your machine</div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.main}>
        {tab === "inbox"     && <Inbox     API={API} />}
        {tab === "search"    && <Search    API={API} />}
        {tab === "followups" && <Followups API={API} />}
      </div>
    </div>
  );
}

const styles = {
  app: {
    display: "flex", height: "100vh", fontFamily: "'Segoe UI', sans-serif",
    background: "#0f0f0f", color: "#e0e0e0",
  },
  sidebar: {
    width: 220, background: "#1a1a1a", borderRight: "1px solid #2a2a2a",
    display: "flex", flexDirection: "column", padding: "24px 0",
  },
  logo: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "0 20px 28px", borderBottom: "1px solid #2a2a2a",
  },
  logoIcon: { fontSize: 22 },
  logoText: { fontSize: 17, fontWeight: 600, color: "#fff" },
  nav: { padding: "16px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 4 },
  navBtn: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "10px 12px", border: "none", borderRadius: 8,
    background: "transparent", color: "#aaa", fontSize: 14,
    cursor: "pointer", textAlign: "left", width: "100%",
    transition: "all 0.15s",
  },
  navBtnActive: { background: "#2a2a2a", color: "#fff" },
  navIcon: { fontSize: 16 },
  sidebarFooter: { padding: "16px 20px", borderTop: "1px solid #2a2a2a" },
  privacyBadge: { fontSize: 12, color: "#4ade80", fontWeight: 500 },
  privacyNote: { fontSize: 11, color: "#555", marginTop: 4 },
  main: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
};