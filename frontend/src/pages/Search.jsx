import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { searchEmails } from "../api/searchApi";
import Topbar from "../components/Topbar";

const SUGGESTIONS = [
  "What deadlines are buried in my inbox?",
  "Summarize every recruiter thread from this week.",
  "Which conversations still need a reply?",
];

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const ScoreBadge = ({ score }) => {
  const pct = typeof score === "number" ? score.toFixed(2) : "—";
  return (
    <span className="inline-flex items-center rounded-full border border-[#2B2B2B]/8 bg-[#F6F0E7] px-2.5 py-1 text-[11px] font-medium tracking-wide text-[#7A6851]">
      {pct} match
    </span>
  );
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const runSearch = async (q) => {
    const trimmed = (q || query).trim();
    if (!trimmed) return;
    setLoading(true);
    setResults(null);
    setError("");
    try {
      const data = await searchEmails(trimmed, 5);
      setResults(data);
    } catch (err) {
      setError(
        err?.isNetworkError
          ? "Could not connect to EmailBrain backend. Is the server running on :8765?"
          : `Search failed${err?.status ? ` (${err.status})` : ""}.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (prompt) => {
    setQuery(prompt);
    runSearch(prompt);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden text-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Topbar
        title="Semantic Search"
        subtitle="Ask anything about your inbox — EmailBrain finds relevant threads and synthesises an answer."
        sourceLabel={results ? `${results.results.length} result${results.results.length !== 1 ? "s" : ""}` : "Ready"}
        statPills={[
          { label: loading ? "Searching…" : results ? `Query: ${results.query}` : "Awaiting query" },
        ]}
      />

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-9">
        {/* ── Search bar ── */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A8E7F]" />
            <input
              ref={inputRef}
              id="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Ask anything about your emails…"
              className="w-full rounded-[22px] border border-[#2B2B2B]/10 bg-white/80 py-3.5 pl-11 pr-4 text-[15px] text-ink shadow-[0_8px_20px_rgba(111,88,60,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] placeholder:text-[#8A7D6A] focus:border-accent/30 focus:outline-none focus:ring-0"
            />
          </div>
          <button
            id="search-btn"
            onClick={() => runSearch()}
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-[22px] border border-[#D45F4D]/18 bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(221,107,87,0.18)] transition hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#D45F4D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
            Search
          </button>
        </div>

        {/* ── Suggested chips (shown before any search) ── */}
        <AnimatePresence>
          {!results && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <p className="mb-4 text-[11px] uppercase tracking-[0.22em] text-[#7A6851]/80">
                Try asking
              </p>
              <div className="flex flex-col gap-3">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    id={`suggestion-${s.slice(0, 20).replace(/\W+/g, "-")}`}
                    onClick={() => handleChipClick(s)}
                    className="group flex items-start gap-3 rounded-[20px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(246,240,230,0.9))] px-5 py-4 text-left text-sm text-[#574D43] shadow-[0_8px_20px_rgba(115,95,71,0.06)] transition hover:-translate-y-0.5 hover:border-[#D45F4D]/20 hover:shadow-[0_12px_28px_rgba(115,95,71,0.08)]"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent/70 transition group-hover:text-accent" />
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading spinner ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-16 flex flex-col items-center gap-4 text-center"
            >
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#2B2B2B]/8 bg-white shadow-[0_12px_30px_rgba(115,95,71,0.08)]">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
              <p className="text-sm text-muted">Searching your inbox…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error state ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex items-start gap-3 rounded-[22px] border border-[#E2B0A6] bg-[#F8E2DD] px-5 py-4 text-sm text-[#A24F42]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {results && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-8 space-y-5"
            >
              {/* AI Summary card */}
              {results.summary && (
                <div className="rounded-[28px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(246,240,230,0.92))] p-6 shadow-[0_16px_40px_rgba(111,88,60,0.08),inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-[#7A6851]">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    AI Summary
                  </div>
                  <p className="text-[15px] leading-8 text-[#574D43]">
                    {results.summary}
                  </p>
                </div>
              )}

              {/* Result cards */}
              {results.results.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-[28px] border border-dashed border-[#2B2B2B]/10 bg-white/55 py-16 text-center">
                  <p className="font-serif text-[26px] tracking-[-0.04em] text-ink">
                    No matching emails found
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    for: <span className="italic">{results.query}</span>
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A6851]/80">
                    Matching emails — {results.results.length} found
                  </p>
                  <div className="space-y-3.5">
                    {results.results.map((r, i) => (
                      <motion.div
                        key={r.message_id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.055 }}
                        className="rounded-[24px] border border-[#2B2B2B]/8 bg-white/85 px-5 py-4 shadow-[0_8px_20px_rgba(115,95,71,0.05),inset_0_1px_0_rgba(255,255,255,0.8)]"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <p className="text-[15px] font-semibold leading-6 text-ink">
                            {r.subject || "(no subject)"}
                          </p>
                          <ScoreBadge score={r.score} />
                        </div>
                        <p className="text-[12px] text-muted">
                          {r.sender}
                          {r.date ? (
                            <span className="ml-2 text-[#9A8E7F]">· {formatDate(r.date)}</span>
                          ) : null}
                        </p>
                        {r.preview && (
                          <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-[#5C5248]">
                            {r.preview}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
