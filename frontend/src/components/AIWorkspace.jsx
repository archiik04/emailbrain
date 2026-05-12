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
      className="flex h-full flex-col gap-4"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-halo">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-accent">
              Live AI workspace
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
              {email.subject}
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/48">{email.sender}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onGenerateDraft}
              className="inline-flex items-center gap-2 rounded-2xl border border-accent/25 bg-accent px-4 py-3 text-sm font-medium text-white shadow-glow transition hover:brightness-110"
            >
              {isDraftLoading ? "Generating..." : "Generate Draft"}
            </button>
            <button
              type="button"
              onClick={() => setAskAnswer(answerPrompt(askPrompt, email, insights))}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/75 transition hover:border-white/15 hover:text-white"
            >
              <MessageSquareText className="h-4 w-4" />
              Ask AI
            </button>
            <button
              type="button"
              onClick={() => setSummaryMode("thread")}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/75 transition hover:border-white/15 hover:text-white"
            >
              <FileText className="h-4 w-4" />
              Summarize Thread
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <div className="mb-3 text-sm font-medium text-white">AI Summary</div>
              <p className="text-sm leading-7 text-white/58">{activeSummary}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="mb-3 text-sm font-medium text-white">
                  Extracted action items
                </div>
                <div className="space-y-3">
                  {insights.actionItems.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white/55"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <CalendarRange className="h-4 w-4 text-accent" />
                  Meeting dates
                </div>
                <div className="space-y-3">
                  {insights.dates.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-white/55"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="mb-3 text-sm font-medium text-white">
              Ask this thread anything
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
              <textarea
                value={askPrompt}
                onChange={(event) => setAskPrompt(event.target.value)}
                placeholder={`Try "${insights.suggestedQuestions[0]}"`}
                className="min-h-[92px] w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/24"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {insights.suggestedQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => {
                    setAskPrompt(question);
                    setAskAnswer(answerPrompt(question, email, insights));
                  }}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/48 transition hover:border-accent/20 hover:text-white/80"
                >
                  {question}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={askAnswer || "empty-answer"}
                className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-white/58"
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
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 shadow-halo">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Suggested reply</h3>
            <p className="mt-2 text-sm text-white/45">
              Draft with AI, then refine the final tone yourself.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {toneOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onToneChange(option)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                  tone === option
                    ? "border-accent/30 bg-accent/[0.14] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/48 hover:text-white/78"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-black/20 p-4">
          <textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            className="min-h-[220px] w-full resize-y bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/24"
            placeholder="Generate a draft to begin shaping your response."
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onGenerateDraft}
            className="rounded-2xl border border-accent/20 bg-accent px-4 py-3 text-sm font-medium text-white shadow-glow transition hover:brightness-110"
          >
            {isDraftLoading ? "Generating..." : "Generate"}
          </button>
          <button
            type="button"
            onClick={onGenerateDraft}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/72 transition hover:border-white/15 hover:text-white"
          >
            Regenerate
          </button>
        </div>
      </div>
    </motion.section>
  );
}
