import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  FileText,
  MessageSquareText,
} from "lucide-react";

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

const answerPrompt = (prompt, email, insights) => {
  const normalized = prompt.trim().toLowerCase();

  if (!normalized) {
    return "Ask about deadlines, reply strategy, or next steps and EmailBrain will shape the answer around this thread.";
  }

  if (normalized.includes("deadline") || normalized.includes("when")) {
    return `The clearest time signal is ${insights.dates[0]}. If timing matters, reply today and confirm the next milestone explicitly.`;
  }

  if (normalized.includes("reply") || normalized.includes("respond")) {
    return `Lead with a short acknowledgement to ${email.sender.split("<")[0].trim()}, confirm the next step, and keep the reply concise enough to maintain momentum.`;
  }

  if (normalized.includes("task") || normalized.includes("todo")) {
    return insights.actionItems.join(" ");
  }

  return `This thread appears to center on "${email.subject}". I would summarize the response path as: acknowledge it, confirm timing, and close with a concrete next action.`;
};

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
  const [summaryMode, setSummaryMode] = useState("default");

  useEffect(() => {
    setAskPrompt("");
    setAskAnswer("");
    setSummaryMode("default");
  }, [email?.message_id]);

  if (!email || !insights) {
    return (
      <div className="flex h-full min-h-[520px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-8 text-center text-sm leading-6 text-white/42">
        Select a thread to open the AI workspace. You'll get a clean summary,
        action cues, time signals, and a ready-to-edit draft in one place.
      </div>
    );
  }

  const activeSummary =
    summaryMode === "thread"
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
        className="rounded-[30px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.025))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_22px_60px_rgba(0,0,0,0.28)]"
      >
        <div className={`flex flex-col gap-5 border-b border-white/[0.06] pb-6 ${isCompact ? "" : "xl:flex-row xl:items-start xl:justify-between"}`}>
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full border border-accent/14 bg-accent/[0.08] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-accent/85">
              Live AI workspace
            </div>
            <h2 className={`mt-5 font-semibold tracking-[-0.03em] text-white/96 ${isNarrow ? "text-[20px]" : "text-[24px]"}`}>
              {email.subject}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/38">{email.sender}</p>
          </div>

          <div className={`flex flex-wrap ${isNarrow ? "gap-2" : "gap-2.5"}`}>
            <button
              type="button"
              onClick={onGenerateDraft}
              className={`inline-flex items-center gap-2 rounded-[18px] border border-accent/16 bg-accent/[0.14] text-sm font-medium text-white/92 shadow-[0_10px_24px_rgba(33,21,69,0.18)] transition hover:-translate-y-0.5 hover:bg-accent/[0.18] ${isNarrow ? "px-3.5 py-2.5" : "px-4 py-2.5"}`}
            >
              {isDraftLoading ? "Generating..." : "Generate Draft"}
            </button>
            <button
              type="button"
              onClick={() => setAskAnswer(answerPrompt(askPrompt, email, insights))}
              className={`inline-flex items-center gap-2 rounded-[18px] border border-white/[0.07] bg-white/[0.03] text-sm font-medium text-white/62 transition hover:border-white/[0.11] hover:bg-white/[0.045] hover:text-white/86 ${isNarrow ? "px-3.5 py-2.5" : "px-4 py-2.5"}`}
            >
              <MessageSquareText className="h-4 w-4" />
              Ask AI
            </button>
            <button
              type="button"
              onClick={() => setSummaryMode("thread")}
              className={`inline-flex items-center gap-2 rounded-[18px] border border-white/[0.07] bg-white/[0.03] text-sm font-medium text-white/62 transition hover:border-white/[0.11] hover:bg-white/[0.045] hover:text-white/86 ${isNarrow ? "px-3.5 py-2.5" : "px-4 py-2.5"}`}
            >
              <FileText className="h-4 w-4" />
              Summarize Thread
            </button>
          </div>
        </div>

        <div className={`mt-6 grid gap-5 ${isCompact ? "grid-cols-1" : "xl:grid-cols-[1.12fr,0.88fr]"}`}>
          <div className="space-y-5">
            <div className="rounded-[26px] bg-black/18 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
              <div className="mb-3 text-[11px] uppercase tracking-[0.2em] text-white/28">
                AI Summary
              </div>
              <p className={`max-w-3xl text-white/58 ${isNarrow ? "text-[14px] leading-7" : "text-[15px] leading-8"}`}>{activeSummary}</p>
            </div>

            <div className={`grid gap-5 ${isCompact ? "grid-cols-1" : "lg:grid-cols-2"}`}>
              <div className="rounded-[26px] bg-black/18 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-white/28">
                  Extracted action items
                </div>
                <div className="space-y-3.5">
                  {insights.actionItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] bg-white/[0.035] px-4 py-3.5 text-[13px] leading-6 text-white/52"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] bg-black/18 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                <div className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/28">
                  <CalendarRange className="h-4 w-4 text-accent/78" />
                  Meeting dates
                </div>
                <div className="space-y-3.5">
                  {insights.dates.map((item) => (
                    <div
                      key={item}
                      className="rounded-[20px] bg-white/[0.035] px-4 py-3.5 text-[13px] leading-6 text-white/52"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] bg-black/18 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-white/28">
              Ask this thread anything
            </div>
            <div className="rounded-[22px] bg-white/[0.03] p-4">
              <textarea
                value={askPrompt}
                onChange={(event) => setAskPrompt(event.target.value)}
                placeholder={`Try "${insights.suggestedQuestions[0]}"`}
                className={`w-full resize-none bg-transparent text-[14px] text-white/82 outline-none placeholder:text-white/22 ${isNarrow ? "min-h-[100px] leading-[1.65]" : "min-h-[110px] leading-7"}`}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {insights.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => {
                    setAskPrompt(question);
                    setAskAnswer(answerPrompt(question, email, insights));
                  }}
                  className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3.5 py-1.5 text-[11px] tracking-wide text-white/44 transition hover:-translate-y-0.5 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-white/82"
                >
                  {question}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={askAnswer || "empty-answer"}
                className="mt-5 rounded-[22px] bg-white/[0.03] px-4 py-4 text-[14px] leading-7 text-white/56"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {askAnswer ||
                  "EmailBrain will keep this contextual. Ask for deadlines, suggested replies, or a tighter summary."}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <motion.div
        layout
        className="rounded-[30px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_22px_60px_rgba(0,0,0,0.28)]"
      >
        <div className={`flex flex-col gap-5 border-b border-white/[0.06] pb-6 ${isCompact ? "" : "lg:flex-row lg:items-center lg:justify-between"}`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/28">
              AI Draft
            </p>
            <h3 className={`mt-3 font-semibold tracking-[-0.03em] text-white/94 ${isNarrow ? "text-[20px]" : "text-[22px]"}`}>
              Suggested reply
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/38">
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
                    ? "border-accent/18 bg-accent/[0.12] text-white/90"
                    : "border-white/[0.06] bg-white/[0.025] text-white/42 hover:border-white/[0.1] hover:bg-white/[0.045] hover:text-white/78"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[26px] bg-black/18 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="min-h-[240px] w-full resize-y bg-transparent text-[14px] leading-8 text-white/84 outline-none placeholder:text-white/22"
            placeholder="Generate a draft to begin shaping your response."
          />
        </div>

        {draftError ? (
          <div className="mt-4 rounded-[20px] border border-amber-200/10 bg-amber-200/[0.08] px-4 py-3 text-sm text-amber-50/75">
            {draftError}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGenerateDraft}
            className="rounded-[18px] border border-accent/16 bg-accent/[0.14] px-4 py-3 text-sm font-medium text-white/92 shadow-[0_10px_24px_rgba(33,21,69,0.18)] transition hover:-translate-y-0.5 hover:bg-accent/[0.18]"
          >
            {isDraftLoading ? "Generating..." : "Generate"}
          </button>
          <button
            type="button"
            onClick={onGenerateDraft}
            className="rounded-[18px] border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/64 transition hover:-translate-y-0.5 hover:border-white/[0.11] hover:bg-white/[0.045] hover:text-white/84"
          >
            Regenerate
          </button>
        </div>
      </motion.div>
    </motion.section>
  );
}
