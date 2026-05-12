import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Inbox as InboxIcon, Sparkles } from "lucide-react";
import { fetchInbox, generateDraft } from "../api/inboxApi";
import AIWorkspace from "../components/AIWorkspace";
import EmailCard from "../components/EmailCard";
import SearchBar from "../components/SearchBar";
import Topbar from "../components/Topbar";

const examplePrompts = [
  "show internship emails",
  "what deadlines do I have?",
  "emails from recruiters",
];

const defaultDraft = (email) => {
  if (!email) {
    return "";
  }

  return `Hi ${email.sender.split("<")[0].trim() || "there"},

Thanks for the note on "${email.subject}". I reviewed the thread and I’m following up with the next step shortly.

Best,
You`;
};

const matchesQuery = (email, query) => {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  return [email.sender, email.subject, email.preview, email.urgency]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalized);
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
    <div className="h-4 w-1/3 rounded-full bg-white/10" />
    <div className="mt-3 h-5 w-4/5 rounded-full bg-white/10" />
    <div className="mt-3 h-4 w-full rounded-full bg-white/5" />
    <div className="mt-2 h-4 w-3/4 rounded-full bg-white/5" />
    <div className="mt-4 flex justify-between">
      <div className="h-7 w-16 rounded-full bg-white/10" />
      <div className="h-4 w-12 rounded-full bg-white/5" />
    </div>
  </div>
);

export default function InboxPage() {
  const [emails, setEmails] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState("");
  const [tone, setTone] = useState("Professional");
  const [draftLoading, setDraftLoading] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("Connecting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadInbox = async () => {
      setLoading(true);
      const result = await fetchInbox();

      if (!active) {
        return;
      }

      setEmails(result.emails);
      setSourceLabel(result.usingMock ? "Mock fallback" : "Live backend");
      setErrorMessage(
        result.usingMock
          ? "Backend unavailable, so EmailBrain is showing sample data until the API responds."
          : ""
      );

      if (result.emails.length) {
        setSelectedId(result.emails[0].message_id);
        setDraft(defaultDraft(result.emails[0]));
      }

      setLoading(false);
    };

    loadInbox();

    return () => {
      active = false;
    };
  }, []);

  const filteredEmails = useMemo(
    () => emails.filter((email) => matchesQuery(email, query)),
    [emails, query]
  );

  const selectedEmail = useMemo(
    () =>
      filteredEmails.find((email) => email.message_id === selectedId) ||
      emails.find((email) => email.message_id === selectedId) ||
      filteredEmails[0] ||
      null,
    [emails, filteredEmails, selectedId]
  );

  useEffect(() => {
    if (!selectedEmail) {
      return;
    }

    setSelectedId(selectedEmail.message_id);
    setDraft(defaultDraft(selectedEmail));
  }, [selectedEmail]);

  const stats = useMemo(() => {
    const high = emails.filter((email) => email.urgency === "High").length;
    const medium = emails.filter((email) => email.urgency === "Medium").length;
    const unread = emails.filter((email) => email.unread).length;

    return [
      { label: `${emails.length} threads` },
      { label: `${high} high priority` },
      { label: `${medium} medium` },
      { label: `${unread} unread` },
    ];
  }, [emails]);

  const handleSelectEmail = (email) => {
    setSelectedId(email.message_id);
    setDraft(defaultDraft(email));
  };

  const handleGenerateDraft = async () => {
    if (!selectedEmail) {
      return;
    }

    setDraftLoading(true);
    const nextDraft = await generateDraft(selectedEmail, tone);
    setDraft(nextDraft);
    setDraftLoading(false);
  };

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Topbar
        title="Inbox Command Center"
        subtitle="Triage, summarize, and draft from a calm workspace designed for fast email decisions."
        sourceLabel={sourceLabel}
        statPills={stats}
      />

      <div className="flex-1 overflow-hidden p-4 sm:p-5 lg:p-6">
        <div className="grid h-full gap-4 xl:grid-cols-[0.88fr,1.12fr]">
          <div className="flex min-h-0 flex-col rounded-[28px] border border-white/10 bg-white/[0.04] shadow-halo">
            <div className="border-b border-white/8 p-4 sm:p-5">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSubmit={(event) => event.preventDefault()}
                examples={examplePrompts}
                onExampleClick={setQuery}
              />
              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-amber-200/10 bg-amber-200/[0.08] px-3 py-2 text-sm text-amber-50/75">
                  {errorMessage}
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-4 sm:px-5">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <InboxIcon className="h-4 w-4 text-accent" />
                    Priority queue
                  </div>
                  <p className="mt-1 text-sm text-white/42">
                    Focus on what needs a decision first.
                  </p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/42">
                  {filteredEmails.length} visible
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonCard key={`skeleton-${index}`} />
                    ))
                  : null}

                {!loading && filteredEmails.length === 0 ? (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[26px] border border-dashed border-white/10 bg-white/[0.02] px-8 text-center">
                    <Sparkles className="h-10 w-10 text-accent/70" />
                    <h3 className="mt-5 text-lg font-semibold text-white">
                      No threads match that prompt
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/42">
                      Try a broader phrasing like “recruiters”, “deadlines”, or
                      “follow up”.
                    </p>
                  </div>
                ) : null}

                {!loading
                  ? filteredEmails.map((email) => (
                      <EmailCard
                        key={email.message_id}
                        email={email}
                        isActive={selectedEmail?.message_id === email.message_id}
                        onClick={() => handleSelectEmail(email)}
                      />
                    ))
                  : null}
              </div>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto">
            <AIWorkspace
              email={selectedEmail}
              draft={draft}
              tone={tone}
              onToneChange={setTone}
              onDraftChange={setDraft}
              onGenerateDraft={handleGenerateDraft}
              isDraftLoading={draftLoading}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
