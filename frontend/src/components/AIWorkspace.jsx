import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, FileText, Loader2, MessageSquareText } from "lucide-react";
import { searchEmails } from "../api/searchApi";

const toneOptions = ["Professional", "Friendly", "Casual"];

const detectDateSignals = (text, emailDate) => {
  const combined = `${text || ""} ${emailDate || ""}`;
  const matches = combined.match(
    /\b(?:today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2})\b/gi
  );

  if (matches?.length) {
    return [...new Set(matches.map((item) => item.trim()))].slice(0, 3);
  }

  if (!emailDate) {
    return ["No clear deadline mentioned"];
  }

  return [
    `Received ${new Date(emailDate).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    })}`,
  ];
};

const buildInsights = (email) => {
  if (!email) {
    return null;
  }

  const lower = `${email.subject} ${email.preview} ${email.body}`.toLowerCase();
  const actionItems = [];

  if (/(interview|availability|schedule|calendar|meeting)/.test(lower)) {
    actionItems.push("Reply with your preferred time slots or confirm availability.");
  }

  if (/(review|proposal|portfolio|feedback|scope)/.test(lower)) {
    actionItems.push("Prepare the requested material before you send your response.");
  }

  if (/(deadline|tomorrow|today|close|final)/.test(lower) || email.urgency === "High") {
    actionItems.push("Treat this as a same-day priority and send a confirmation quickly.");
  }

  if (!actionItems.length) {
    actionItems.push("Acknowledge the thread and outline the next step clearly.");
    actionItems.push("Capture any commitments in a follow-up or task list.");
  }

  const summary =
    email.urgency === "High"
      ? `${email.sender} needs a timely response about "${email.subject}". The signal here looks action-oriented, so EmailBrain is surfacing it near the top of your queue.`
      : `${email.sender} is discussing "${email.subject}". This thread looks manageable, but it still benefits from a concise reply and a tracked next step.`;

  const suggestedQuestions = [
    "What should I reply with first?",
    "What deadline is implied here?",
    "Turn this into a short task list.",
  ];

  return {
    summary,
    actionItems,
    dates: detectDateSignals(`${email.subject} ${email.preview}`, email.date),
    suggestedQuestions,
  };
};


const Surface = ({ title, icon, children, className = "" }) => (
  <div className={`rounded-[28px] border border-[#2B2B2B]/7 bg-[#FCFAF6] px-5 py-5 shadow-[0_10px_24px_rgba(115,95,71,0.05),inset_0_1px_0_rgba(255,255,255,0.82)] ${className}`}>
    <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#7A6851]">
      {icon}
      {title}
    </div>
    {children}
  </div>
);

export default function AIWorkspace({
  email,
  draft,
  tone,
  onToneChange,
  onDraftChange,
  onGenerateDraft,
  isDraftLoading,
  draftError,
  isCompact = false,
  isNarrow = false,
}) {
  const insights = useMemo(() => buildInsights(email), [email]);
  const [askPrompt, setAskPrompt] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [summaryMode, setSummaryMode] = useState("default");
  const [aiSummary, setAiSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    setAskPrompt("");
    setAskAnswer("");
    setSummaryMode("default");
    setAiSummary("");
  }, [email?.message_id]);

  const handleAskAI = async (overrideQ) => {
    const q = (overrideQ ?? askPrompt).trim();
    if (!q || !email) return;
    // Include email context so the search is relevant to this thread
    const contextualQuery = `${q} about: ${email.subject}`;
    setAskLoading(true);
    try {
      const result = await searchEmails(contextualQuery, 3);
      setAskAnswer(result.summary || result.results?.[0]?.preview || "No results found.");
    } catch {
      setAskAnswer("Backend not responding. Make sure the server is running on :8765");
    } finally {
      setAskLoading(false);
    }
  };

  const handleSummarizeThread = async () => {
    if (!email) return;
    setSummaryLoading(true);
    try {
      const result = await searchEmails(`summarize: ${email.subject}`, 1);
      setAiSummary(result.summary || "No summary available.");
      setSummaryMode("thread");
    } catch {
      setAiSummary("Could not reach the backend. Is the server running on :8765?");
      setSummaryMode("thread");
    } finally {
      setSummaryLoading(false);
    }
  };

  if (!email || !insights) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-[34px] border border-dashed border-[#2B2B2B]/10 bg-white/55 px-8 text-center text-sm leading-7 text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        Select a thread to open the assistant workspace. You&apos;ll get a calm
        summary, action cues, time signals, and a ready-to-edit draft in one
        place.
      </div>
    );
  }

  const activeSummary =
    summaryMode === "thread" && aiSummary
      ? aiSummary
      : summaryMode === "thread"
        ? `${insights.summary} Thread mode adds a fuller pass: start with a confirmation, mention the requested context, and end by naming the next checkpoint.`
        : insights.summary;

  return (
    <motion.section
      className="flex h-full flex-col gap-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        layout
        className="rounded-[34px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,240,230,0.9))] p-6 shadow-[0_22px_46px_rgba(111,88,60,0.09),inset_0_1px_0_rgba(255,255,255,0.85)]"
      >
        <div className={`flex flex-col gap-5 border-b border-[#2B2B2B]/8 pb-6 ${isCompact ? "" : "xl:flex-row xl:items-start xl:justify-between"}`}>
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full border border-[#2B2B2B]/8 bg-[#F4EBDF] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-[#7A6851]">
              Assistant workspace
            </div>
            <h2 className={`mt-5 font-serif tracking-[-0.04em] text-ink ${isNarrow ? "text-[24px]" : "text-[30px]"}`}>
              {email.subject}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">{email.sender}</p>
          </div>

          <div className={`flex flex-wrap ${isNarrow ? "gap-2" : "gap-2.5"}`}>
            <button
              type="button"
              onClick={onGenerateDraft}
              className={`inline-flex items-center gap-2 rounded-[18px] border border-[#D45F4D]/18 bg-accent text-sm font-semibold text-white shadow-[0_12px_24px_rgba(221,107,87,0.16)] transition hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#D45F4D] ${isNarrow ? "px-3.5 py-2.5" : "px-4 py-2.5"}`}
            >
              {isDraftLoading ? "Generating..." : "Generate Draft"}
            </button>
            <button
              type="button"
              onClick={handleAskAI}
              disabled={askLoading || !askPrompt.trim()}
              className={`inline-flex items-center gap-2 rounded-[18px] border border-[#2B2B2B]/8 bg-white/65 text-sm font-medium text-[#6F665C] shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] transition hover:-translate-y-0.5 hover:bg-white hover:text-ink disabled:opacity-50 ${isNarrow ? "px-3.5 py-2.5" : "px-4 py-2.5"}`}
            >
              {askLoading ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <MessageSquareText className="h-4 w-4 text-[#7A6851]" />}
              Ask AI
            </button>
            <button
              type="button"
              onClick={handleSummarizeThread}
              disabled={summaryLoading}
              className={`inline-flex items-center gap-2 rounded-[18px] border border-[#2B2B2B]/8 bg-white/65 text-sm font-medium text-[#6F665C] shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] transition hover:-translate-y-0.5 hover:bg-white hover:text-ink disabled:opacity-50 ${isNarrow ? "px-3.5 py-2.5" : "px-4 py-2.5"}`}
            >
              {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-accent" /> : <FileText className="h-4 w-4 text-[#7A6851]" />}
              Summarize Thread
            </button>
          </div>
        </div>

        <div className={`mt-6 grid gap-5 ${isCompact ? "grid-cols-1" : "xl:grid-cols-[1.12fr,0.88fr]"}`}>
          <div className="space-y-5">
            <Surface title="AI Summary">
              <p className={`max-w-3xl text-[#574D43] ${isNarrow ? "text-[14px] leading-7" : "text-[15px] leading-8"}`}>
                {activeSummary}
              </p>
            </Surface>

            <div className={`grid gap-5 ${isCompact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
              <Surface title="Extracted action items">
                <div className="space-y-3.5">
                  {insights.actionItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border border-[#2B2B2B]/6 bg-[#F6F0E7] px-4 py-3.5 text-[13px] leading-6 text-[#5C5248]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Surface>

              <Surface
                title="Meeting dates"
                icon={<CalendarRange className="h-4 w-4 text-[#A77B28]" />}
              >
                <div className="space-y-3.5">
                  {insights.dates.map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] border border-[#2B2B2B]/6 bg-[#F6F0E7] px-4 py-3.5 text-[13px] leading-6 text-[#5C5248]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          </div>

          <Surface title="Ask this thread anything">
            <div className="rounded-[22px] border border-[#2B2B2B]/6 bg-[#F6F0E7] p-4">
              <textarea
                value={askPrompt}
                onChange={(event) => setAskPrompt(event.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                placeholder={`Try "${insights.suggestedQuestions[0]}"`}
                className={`w-full resize-none bg-transparent text-[14px] text-ink outline-none placeholder:text-[#8A7D6A] ${isNarrow ? "min-h-[100px] leading-[1.65]" : "min-h-[110px] leading-7"}`}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {insights.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => {
                    setAskPrompt(question);
                    handleAskAI(question);
                  }}
                  className="rounded-full border border-[#2B2B2B]/7 bg-white px-3.5 py-1.5 text-[11px] tracking-wide text-[#6F665C] transition hover:-translate-y-0.5 hover:bg-[#F4EBDF] hover:text-ink"
                >
                  {question}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={askLoading ? "loading" : (askAnswer || "empty-answer")}
                className="mt-5 rounded-[22px] border border-[#2B2B2B]/6 bg-[#F6F0E7] px-4 py-4 text-[14px] leading-7 text-[#5C5248]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {askLoading
                  ? <span className="italic text-[#9A8E7F]">Thinking…</span>
                  : (askAnswer || "EmailBrain keeps this contextual. Ask for deadlines, suggested replies, or a tighter summary.")}
              </motion.div>
            </AnimatePresence>
          </Surface>
        </div>
      </motion.div>

      <motion.div
        layout
        className="rounded-[34px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(246,240,230,0.9))] p-6 shadow-[0_22px_46px_rgba(111,88,60,0.09),inset_0_1px_0_rgba(255,255,255,0.85)]"
      >
        <div className={`flex flex-col gap-5 border-b border-[#2B2B2B]/8 pb-6 ${isCompact ? "" : "lg:flex-row lg:items-center lg:justify-between"}`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A6851]">
              AI Draft
            </p>
            <h3 className={`mt-3 font-serif tracking-[-0.04em] text-ink ${isNarrow ? "text-[24px]" : "text-[28px]"}`}>
              Suggested reply
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Draft with AI, then refine the final tone yourself.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {toneOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onToneChange(option)}
                className={`rounded-full border px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition ${
                  tone === option
                    ? "border-[#D45F4D]/18 bg-[#F8E2DD] text-[#A24F42]"
                    : "border-[#2B2B2B]/8 bg-white text-[#6F665C] hover:bg-[#F4EBDF] hover:text-ink"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[#2B2B2B]/7 bg-[#FCFAF6] px-5 py-5 shadow-[0_10px_24px_rgba(115,95,71,0.05),inset_0_1px_0_rgba(255,255,255,0.8)]">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="min-h-[240px] w-full resize-y bg-transparent text-[14px] leading-8 text-ink outline-none placeholder:text-[#8A7D6A]"
            placeholder="Generate a draft to begin shaping your response."
          />
        </div>

        {draftError ? (
          <div className="mt-4 rounded-[20px] border border-[#E7D4A3] bg-[#F9F0CC] px-4 py-3 text-sm text-[#8A6A22]">
            {draftError}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGenerateDraft}
            className="rounded-[18px] border border-[#D45F4D]/18 bg-accent px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(221,107,87,0.16)] transition hover:-translate-y-0.5 hover:scale-[1.01] hover:bg-[#D45F4D]"
          >
            {isDraftLoading ? "Generating..." : "Generate"}
          </button>
          <button
            type="button"
            onClick={onGenerateDraft}
            className="rounded-[18px] border border-[#2B2B2B]/8 bg-white px-4 py-3 text-sm font-medium text-[#6F665C] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] transition hover:-translate-y-0.5 hover:bg-[#F4EBDF] hover:text-ink"
          >
            Regenerate
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}
