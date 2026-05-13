import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Copy, X } from "lucide-react";
import { getFollowups, resolveFollowup, generateNudge } from "../api/followupsApi";
import Topbar from "../components/Topbar";

const daysSince = (dateStr) => {
  if (!dateStr) return 0;
  const sent = new Date(dateStr);
  if (isNaN(sent.getTime())) return 0;
  return Math.floor((Date.now() - sent.getTime()) / 86_400_000);
};

const formatSentDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(3);
  const [daysInput, setDaysInput] = useState("3");
  const [nudgeMap, setNudgeMap] = useState({});   // message_id → nudge text
  const [nudgingId, setNudgingId] = useState(null);
  const [nudgeError, setNudgeError] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async (d) => {
    setLoading(true);
    setError("");
    try {
      const data = await getFollowups(d ?? days);
      setFollowups(data.followups);
    } catch (err) {
      setError(
        err?.isNetworkError
          ? "Could not connect to EmailBrain backend. Is the server running on :8765?"
          : `Failed to load follow-ups${err?.status ? ` (${err.status})` : ""}.`
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = () => {
    const n = parseInt(daysInput, 10);
    const safe = isNaN(n) || n < 1 ? 1 : n;
    setDays(safe);
    setDaysInput(String(safe));
    load(safe);
  };

  const handleResolve = async (messageId) => {
    // optimistic removal
    setFollowups((prev) => prev.filter((f) => f.message_id !== messageId));
    try {
      await resolveFollowup(messageId);
    } catch {
      // silently ignore — card already gone
    }
  };

  const handleNudge = async (fu) => {
    setNudgingId(fu.message_id);
    setNudgeError((prev) => ({ ...prev, [fu.message_id]: "" }));
    try {
      const data = await generateNudge(
        fu.subject,
        fu.recipient,
        fu.days_waiting ?? daysSince(fu.sent_date)
      );
      setNudgeMap((prev) => ({ ...prev, [fu.message_id]: data.nudge }));
    } catch (err) {
      setNudgeError((prev) => ({
        ...prev,
        [fu.message_id]: err?.isNetworkError
          ? "Backend offline."
          : "Failed to generate nudge.",
      }));
    } finally {
      setNudgingId(null);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const dismissNudge = (id) => {
    setNudgeMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden text-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Topbar
        title="Follow-up Tracker"
        subtitle="Emails you sent that haven't heard back."
        sourceLabel={loading ? "Loading…" : `${followups.length} pending`}
        statPills={[
          { label: `Waiting > ${days} day${days !== 1 ? "s" : ""}` },
          { label: `${followups.length} thread${followups.length !== 1 ? "s" : ""}` },
        ]}
      />

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-9">
        {/* ── Filter bar ── */}
        <div className="mb-6 flex items-center gap-3 rounded-[22px] border border-[#2B2B2B]/8 bg-white/75 px-5 py-3.5 shadow-[0_8px_20px_rgba(111,88,60,0.05)]">
          <span className="text-sm text-muted">Waiting more than</span>
          <input
            id="days-input"
            type="number"
            min="1"
            value={daysInput}
            onChange={(e) => setDaysInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRefresh()}
            className="w-16 rounded-[12px] border border-[#2B2B2B]/10 bg-[#F7F1E7] px-3 py-1.5 text-center text-sm text-ink focus:border-accent/30 focus:outline-none"
          />
          <span className="text-sm text-muted">days</span>
          <button
            id="refresh-btn"
            onClick={handleRefresh}
            className="ml-auto rounded-[14px] border border-[#D45F4D]/18 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_8px_16px_rgba(221,107,87,0.14)] transition hover:-translate-y-0.5 hover:bg-[#D45F4D]"
          >
            Refresh
          </button>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#2B2B2B]/8 bg-white shadow-[0_12px_30px_rgba(115,95,71,0.08)]">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
            <p className="text-sm text-muted">Scanning for follow-ups…</p>
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex items-start gap-3 rounded-[22px] border border-[#E2B0A6] bg-[#F8E2DD] px-5 py-4 text-sm text-[#A24F42]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && followups.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-[34px] border border-dashed border-[#2B2B2B]/10 bg-white/55 py-20 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#2B2B2B]/8 bg-[#EDF7F0]">
              <CheckCircle2 className="h-7 w-7 text-[#5BB67E]" />
            </div>
            <h3 className="mt-5 font-serif text-[28px] tracking-[-0.04em] text-ink">
              You're all caught up
            </h3>
            <p className="mt-3 text-sm text-muted">
              No pending follow-ups. No emails waiting for a reply.
            </p>
          </motion.div>
        )}

        {/* ── Follow-up cards ── */}
        {!loading && !error && followups.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {followups.map((fu, i) => {
                const daysWaiting = fu.days_waiting ?? daysSince(fu.sent_date);
                const nudgeText = nudgeMap[fu.message_id];
                const isNudging = nudgingId === fu.message_id;
                const nudgeErr = nudgeError[fu.message_id];

                return (
                  <motion.div
                    key={fu.message_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="rounded-[28px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,240,230,0.9))] px-6 py-5 shadow-[0_12px_30px_rgba(111,88,60,0.07),inset_0_1px_0_rgba(255,255,255,0.82)]"
                  >
                    {/* card header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-1.5 inline-flex items-center rounded-full border border-[#FB923C]/20 bg-[#FEF0E4] px-2.5 py-1 text-[11px] font-semibold text-[#C2622A]">
                          {daysWaiting} day{daysWaiting !== 1 ? "s" : ""} waiting
                        </div>
                        <h3 className="mt-1.5 text-[16px] font-semibold leading-6 text-ink">
                          {fu.subject || "(no subject)"}
                        </h3>
                        <p className="mt-1 text-[13px] text-muted">
                          Sent to: <span className="text-[#574D43]">{fu.recipient}</span>
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#9A8E7F]">
                          Sent {formatSentDate(fu.sent_date)}
                        </p>
                      </div>

                      <button
                        id={`resolve-${fu.message_id}`}
                        onClick={() => handleResolve(fu.message_id)}
                        title="Mark resolved"
                        className="mt-1 shrink-0 rounded-[14px] border border-[#2B2B2B]/8 bg-white/65 px-3.5 py-2 text-[12px] font-medium text-[#5BB67E] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] transition hover:-translate-y-0.5 hover:border-[#5BB67E]/20 hover:bg-[#EDF7F0] hover:text-[#3B8B5A]"
                      >
                        ✓ Mark Resolved
                      </button>
                    </div>

                    {/* action row */}
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <button
                        id={`nudge-${fu.message_id}`}
                        onClick={() => handleNudge(fu)}
                        disabled={isNudging}
                        className="inline-flex items-center gap-2 rounded-[14px] border border-[#D45F4D]/18 bg-accent px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(221,107,87,0.14)] transition hover:-translate-y-0.5 hover:bg-[#D45F4D] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isNudging ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing nudge…</>
                        ) : (
                          "✨ Generate Nudge"
                        )}
                      </button>
                    </div>

                    {/* nudge error */}
                    {nudgeErr && (
                      <p className="mt-3 text-[12px] text-[#A24F42]">{nudgeErr}</p>
                    )}

                    {/* nudge text box */}
                    <AnimatePresence>
                      {nudgeText && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-5 overflow-hidden"
                        >
                          <div className="rounded-[22px] border border-[#2B2B2B]/8 bg-[#FCFAF6] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                            <div className="mb-3 flex items-center justify-between">
                              <p className="text-[11px] uppercase tracking-[0.22em] text-[#7A6851]">
                                Nudge draft
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleCopy(fu.message_id, nudgeText)}
                                  className="inline-flex items-center gap-1.5 rounded-full border border-[#2B2B2B]/8 bg-white px-3 py-1 text-[11px] text-[#6F665C] transition hover:bg-[#F4EBDF] hover:text-ink"
                                >
                                  <Copy className="h-3 w-3" />
                                  {copiedId === fu.message_id ? "Copied!" : "Copy"}
                                </button>
                                <button
                                  onClick={() => dismissNudge(fu.message_id)}
                                  className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2B2B2B]/8 bg-white text-[#9A8E7F] transition hover:bg-[#F4EBDF]"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            <textarea
                              readOnly
                              value={nudgeText}
                              rows={5}
                              className="w-full resize-y bg-transparent text-[13px] leading-7 text-[#574D43] outline-none"
                            />
                            <p className="mt-2 text-[11px] text-[#9A8E7F]">
                              Review before sending — EmailBrain never sends automatically.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
