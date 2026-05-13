import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FilePenLine, ChevronDown, ChevronUp, Copy, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateDraft, getToneProfile } from "../api/draftsApi";
import Topbar from "../components/Topbar";

const TONE_OPTIONS = [
  { label: "Casual", value: "casual" },
  { label: "Auto", value: null },
  { label: "Formal", value: "formal" },
];

const formatProfileValue = (v) => {
  if (typeof v === "object" && v !== null) return JSON.stringify(v, null, 2);
  return String(v);
};

export default function DraftsPage() {
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [body, setBody] = useState("");
  const [toneOption, setToneOption] = useState(null); // null = Auto

  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [copied, setCopied] = useState(false);

  const [toneProfile, setToneProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  const handleGenerate = async () => {
    if (!subject.trim() || !body.trim()) {
      setGenError("Please fill in Subject and Email body at minimum.");
      return;
    }
    setGenerating(true);
    setGenError("");
    setDraft("");
    try {
      const result = await generateDraft(subject, sender, body, toneOption);
      setDraft(result.draft);
    } catch (err) {
      setGenError(
        err?.isNetworkError
          ? "Could not connect to EmailBrain backend. Is the server running on :8765?"
          : `Draft generation failed${err?.status ? ` (${err.status})` : ""}.`
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleProfile = async () => {
    if (profileOpen) {
      setProfileOpen(false);
      return;
    }
    setProfileOpen(true);
    if (toneProfile) return;
    setProfileLoading(true);
    setProfileError("");
    try {
      const result = await getToneProfile();
      setToneProfile(result.profile);
    } catch (err) {
      setProfileError(
        err?.isNetworkError
          ? "Backend offline."
          : "Could not load tone profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden text-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Topbar
        title="Draft Composer"
        subtitle="Generate replies that sound like you."
        sourceLabel={draft ? "Draft ready" : "Ready"}
        statPills={[
          { label: "Powered by Mistral" },
          { label: "Never sends automatically" },
        ]}
      />

      <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7 lg:px-9">
        <div className="mx-auto max-w-2xl space-y-5">

          {/* ── Input form ── */}
          <div className="rounded-[34px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,240,230,0.9))] p-6 shadow-[0_22px_46px_rgba(111,88,60,0.09),inset_0_1px_0_rgba(255,255,255,0.85)]">
            <p className="mb-5 text-[11px] uppercase tracking-[0.24em] text-[#7A6851]">
              <FilePenLine className="mr-1.5 inline h-3.5 w-3.5" />
              Compose
            </p>

            {/* Subject */}
            <div className="mb-4">
              <label htmlFor="draft-subject" className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.16em] text-[#7A6851]/80">
                From / Thread subject
              </label>
              <input
                id="draft-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Re: Internship Opportunity at Acme Corp"
                className="w-full rounded-[16px] border border-[#2B2B2B]/10 bg-[#FCFAF6] px-4 py-3 text-[14px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] placeholder:text-[#8A7D6A] focus:border-accent/30 focus:outline-none"
              />
            </div>

            {/* Sender */}
            <div className="mb-4">
              <label htmlFor="draft-sender" className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.16em] text-[#7A6851]/80">
                Sender email
              </label>
              <input
                id="draft-sender"
                type="email"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. recruiter@company.com"
                className="w-full rounded-[16px] border border-[#2B2B2B]/10 bg-[#FCFAF6] px-4 py-3 text-[14px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] placeholder:text-[#8A7D6A] focus:border-accent/30 focus:outline-none"
              />
            </div>

            {/* Body */}
            <div className="mb-5">
              <label htmlFor="draft-body" className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.16em] text-[#7A6851]/80">
                Email body to reply to
              </label>
              <textarea
                id="draft-body"
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the email you want to reply to…"
                className="w-full resize-y rounded-[16px] border border-[#2B2B2B]/10 bg-[#FCFAF6] px-4 py-3 text-[14px] leading-7 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] placeholder:text-[#8A7D6A] focus:border-accent/30 focus:outline-none"
              />
            </div>

            {/* Tone selector */}
            <div className="mb-6">
              <p className="mb-2.5 text-[12px] font-medium uppercase tracking-[0.16em] text-[#7A6851]/80">
                Tone
              </p>
              <div className="flex gap-2.5">
                {TONE_OPTIONS.map(({ label, value }) => (
                  <button
                    key={label}
                    id={`tone-${label.toLowerCase()}`}
                    onClick={() => setToneOption(value)}
                    className={`rounded-full border px-5 py-2 text-[13px] font-medium transition ${
                      toneOption === value
                        ? "border-[#D45F4D]/18 bg-[#F8E2DD] text-[#A24F42] shadow-[0_4px_12px_rgba(221,107,87,0.1)]"
                        : "border-[#2B2B2B]/8 bg-white text-[#6F665C] hover:bg-[#F4EBDF] hover:text-ink"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              id="generate-draft-btn"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-[18px] border border-[#D45F4D]/18 bg-accent py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(221,107,87,0.18)] transition hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#D45F4D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Drafting your reply…</>
              ) : (
                <><FilePenLine className="h-4 w-4" /> Generate Draft</>
              )}
            </button>

            {/* Gen error */}
            {genError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-[16px] border border-[#E2B0A6] bg-[#F8E2DD] px-4 py-3 text-[13px] text-[#A24F42]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {genError}
              </div>
            )}
          </div>

          {/* ── Draft output ── */}
          <AnimatePresence>
            {draft && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="rounded-[34px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,240,230,0.9))] p-6 shadow-[0_22px_46px_rgba(111,88,60,0.09),inset_0_1px_0_rgba(255,255,255,0.85)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#7A6851]">
                    Generated Draft
                  </p>
                  <button
                    id="copy-draft-btn"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#2B2B2B]/8 bg-white px-3.5 py-1.5 text-[11px] font-medium text-[#6F665C] transition hover:bg-[#F4EBDF] hover:text-ink"
                  >
                    {copied ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-[#5BB67E]" /> Copied!</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5" /> Copy to clipboard</>
                    )}
                  </button>
                </div>

                <textarea
                  id="draft-output"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={12}
                  className="w-full resize-y rounded-[22px] border border-[#2B2B2B]/8 bg-[#FCFAF6] px-5 py-4 text-[14px] leading-8 text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none"
                />

                <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[#9A8E7F]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#5BB67E]" />
                  Review before sending — EmailBrain never sends automatically.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Tone Profile collapsible ── */}
          <div className="rounded-[28px] border border-[#2B2B2B]/8 bg-white/75 shadow-[0_8px_20px_rgba(111,88,60,0.05)]">
            <button
              id="tone-profile-btn"
              onClick={handleToggleProfile}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <div>
                <p className="text-[12px] uppercase tracking-[0.2em] text-[#7A6851]">
                  Your Tone Profile
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  See how EmailBrain reads your writing style
                </p>
              </div>
              {profileOpen ? (
                <ChevronUp className="h-4 w-4 text-[#9A8E7F]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#9A8E7F]" />
              )}
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[#2B2B2B]/8 px-6 py-5">
                    {profileLoading && (
                      <div className="flex items-center gap-2 text-[13px] text-muted">
                        <Loader2 className="h-4 w-4 animate-spin text-accent" />
                        Loading tone profile…
                      </div>
                    )}
                    {profileError && (
                      <p className="text-[13px] text-[#A24F42]">{profileError}</p>
                    )}
                    {toneProfile && !profileLoading && (
                      <div className="space-y-3">
                        {Object.entries(toneProfile).map(([key, val]) => (
                          <div key={key} className="flex items-start justify-between gap-4 rounded-[16px] border border-[#2B2B2B]/6 bg-[#F6F0E7] px-4 py-3">
                            <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#7A6851]">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-right text-[13px] text-[#574D43]">
                              {formatProfileValue(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
