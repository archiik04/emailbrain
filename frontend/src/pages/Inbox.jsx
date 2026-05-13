import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Inbox as InboxIcon } from "lucide-react";
import { fetchInbox, generateDraft } from "../api/inboxApi";
import { ApiRequestError } from "../api/client";
import AIWorkspace from "../components/AIWorkspace";
import EmailCard from "../components/EmailCard";
import SearchBar from "../components/SearchBar";
import Topbar from "../components/Topbar";

const MOBILE_BREAKPOINT = 900;
const DESKTOP_BREAKPOINT = 1280;
const DEFAULT_SPLIT_RATIO = 0.46;
const MIN_LIST_RATIO = 0.45;
const TABLET_MAX_LIST_RATIO = 0.56;
const MIN_WORKSPACE_WIDTH = 320;
const SPLIT_STORAGE_KEY = "emailbrain:workspace-split";

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

Thanks for the note on "${email.subject}". I reviewed the thread and I'm following up with the next step shortly.

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
  <div className="animate-pulse rounded-[24px] border border-[#2B2B2B]/8 bg-white/75 p-4 shadow-[0_10px_18px_rgba(120,95,67,0.05)]">
    <div className="h-4 w-1/3 rounded-full bg-[#E6DED1]" />
    <div className="mt-3 h-5 w-4/5 rounded-full bg-[#E6DED1]" />
    <div className="mt-3 h-4 w-full rounded-full bg-[#EFE8DB]" />
    <div className="mt-2 h-4 w-3/4 rounded-full bg-[#EFE8DB]" />
    <div className="mt-4 flex justify-between">
      <div className="h-7 w-16 rounded-full bg-[#E6DED1]" />
      <div className="h-4 w-12 rounded-full bg-[#EFE8DB]" />
    </div>
  </div>
);

export default function InboxPage() {
  const splitContainerRef = useRef(null);
  const frameRef = useRef(null);
  const pendingRatioRef = useRef(DEFAULT_SPLIT_RATIO);
  const [emails, setEmails] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState("");
  const [tone, setTone] = useState("Professional");
  const [draftLoading, setDraftLoading] = useState(false);
  const [sourceLabel, setSourceLabel] = useState("Checking backend");
  const [errorMessage, setErrorMessage] = useState("");
  const [draftError, setDraftError] = useState("");
  const [connectionState, setConnectionState] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [splitRatio, setSplitRatio] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SPLIT_RATIO;
    }

    const stored = Number(window.localStorage.getItem(SPLIT_STORAGE_KEY));
    return Number.isFinite(stored) ? stored : DEFAULT_SPLIT_RATIO;
  });
  const [containerWidth, setContainerWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [isDividerHovered, setIsDividerHovered] = useState(false);

  const describeInboxError = (error) => {
    if (error instanceof ApiRequestError) {
      if (error.isNetworkError) {
        return "Backend offline or blocked by CORS. Start FastAPI and make sure port 8765 is reachable from the browser.";
      }

      if (error.status) {
        return `Backend returned ${error.status} for ${error.endpoint}.`;
      }
    }

    return "Inbox failed to load from the backend.";
  };

  useEffect(() => {
    const element = splitContainerRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layoutMode = useMemo(() => {
    if (!containerWidth) {
      return "desktop";
    }

    if (containerWidth < MOBILE_BREAKPOINT) {
      return "mobile";
    }

    if (containerWidth < DESKTOP_BREAKPOINT) {
      return "tablet";
    }

    return "desktop";
  }, [containerWidth]);

  const clampSplitRatio = useCallback(
    (nextRatio, width = containerWidth, mode = layoutMode) => {
      if (!width || mode === "mobile") {
        return DEFAULT_SPLIT_RATIO;
      }

      const maxListRatioByWorkspaceWidth = 1 - MIN_WORKSPACE_WIDTH / width;
      const modeMaxListRatio =
        mode === "tablet"
          ? Math.min(TABLET_MAX_LIST_RATIO, maxListRatioByWorkspaceWidth)
          : maxListRatioByWorkspaceWidth;

      const minRatio = MIN_LIST_RATIO;
      const maxRatio = Math.max(minRatio, modeMaxListRatio);
      return Math.min(Math.max(nextRatio, minRatio), maxRatio);
    },
    [containerWidth, layoutMode]
  );

  useEffect(() => {
    if (!containerWidth || layoutMode === "mobile") {
      return;
    }

    setSplitRatio((currentRatio) => clampSplitRatio(currentRatio));
  }, [clampSplitRatio, containerWidth, layoutMode]);

  useEffect(() => {
    if (layoutMode === "mobile" || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SPLIT_STORAGE_KEY, splitRatio.toString());
  }, [layoutMode, splitRatio]);

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadInbox = async () => {
      setLoading(true);
      setDraftError("");

      try {
        const result = await fetchInbox();

        if (!active) {
          return;
        }

        setEmails(result.emails);
        setSourceLabel(`Connected: ${result.baseUrl.replace("http://", "")}`);
        setConnectionState(result.emails.length ? "connected" : "empty");
        setErrorMessage(
          result.emails.length
            ? ""
            : "Connected to the backend, but the inbox returned zero threads."
        );

        setSelectedId((currentSelectedId) => {
          const preserved = result.emails.find(
            (email) => email.message_id === currentSelectedId
          );

          return preserved?.message_id || result.emails[0]?.message_id || null;
        });
      } catch (error) {
        if (!active) {
          return;
        }

        console.error("Inbox load failed", error);
        setEmails([]);
        setSelectedId(null);
        setDraft("");
        setConnectionState(
          error instanceof ApiRequestError && error.isNetworkError
            ? "offline"
            : "error"
        );
        setSourceLabel("Backend unavailable");
        setErrorMessage(describeInboxError(error));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInbox();

    return () => {
      active = false;
    };
  }, [reloadKey]);

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
    setDraftError("");
  };

  const handleGenerateDraft = async () => {
    if (!selectedEmail) {
      return;
    }

    setDraftLoading(true);
    setDraftError("");

    try {
      const result = await generateDraft(selectedEmail, tone);
      setDraft(result.draft);
      setSourceLabel(`Connected: ${result.baseUrl.replace("http://", "")}`);
    } catch (error) {
      console.error("Draft generation failed", error);
      setDraftError(
        error instanceof ApiRequestError
          ? `Draft generation failed${error.status ? ` (${error.status})` : ""}.`
          : "Draft generation failed."
      );
    } finally {
      setDraftLoading(false);
    }
  };

  const updateSplitRatio = useCallback(
    (clientX) => {
      const container = splitContainerRef.current;
      if (!container) {
        return;
      }

      const bounds = container.getBoundingClientRect();
      const nextRatio = clampSplitRatio((clientX - bounds.left) / bounds.width);

      pendingRatioRef.current = nextRatio;

      if (frameRef.current) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(() => {
        setSplitRatio(pendingRatioRef.current);
        frameRef.current = null;
      });
    },
    [clampSplitRatio]
  );

  const handlePointerMove = useCallback(
    (event) => {
      updateSplitRatio(event.clientX);
    },
    [updateSplitRatio]
  );

  const stopResize = useCallback(() => {
    setIsResizing(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopResize);
    window.removeEventListener("pointercancel", stopResize);
  }, [handlePointerMove]);

  const startResize = (event) => {
    if (layoutMode === "mobile") {
      return;
    }

    event.preventDefault();
    setIsResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    updateSplitRatio(event.clientX);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  useEffect(() => stopResize, [stopResize]);

  const listWidth = layoutMode === "mobile" ? "100%" : `${splitRatio * 100}%`;
  const workspaceWidth = layoutMode === "mobile"
    ? containerWidth
    : Math.max(containerWidth * (1 - splitRatio), MIN_WORKSPACE_WIDTH);
  const workspaceIsCompact = workspaceWidth < 520;
  const workspaceIsNarrow = workspaceWidth < 420;

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden text-ink"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <Topbar
        title="Inbox Command Center"
        subtitle="Triage, summarize, and draft from a calm workspace designed for fast email decisions."
        sourceLabel={sourceLabel}
        statPills={[
          { label: loading ? "Loading inbox" : `Status: ${connectionState}` },
          ...stats,
        ]}
      />

      <div className="flex-1 overflow-hidden p-5 sm:p-6 lg:p-7">
        <div
          ref={splitContainerRef}
          className={`flex h-full ${layoutMode === "mobile" ? "flex-col gap-5 overflow-y-auto pr-1" : "flex-row gap-0 overflow-hidden"}`}
        >
          <motion.div
            layout
            style={{
              width: listWidth,
              transition:
                isResizing || layoutMode === "mobile"
                  ? "none"
                  : "width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className="flex min-h-0 shrink-0 flex-col rounded-[34px] border border-[#2B2B2B]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(246,240,230,0.9))] shadow-[0_22px_46px_rgba(111,88,60,0.09),inset_0_1px_0_rgba(255,255,255,0.85)]"
          >
            <div className="border-b border-[#2B2B2B]/8 px-5 py-5 sm:px-6 sm:py-6">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSubmit={(event) => event.preventDefault()}
                examples={examplePrompts}
                onExampleClick={setQuery}
              />

              {errorMessage ? (
                <div
                  className={`mt-5 flex items-center justify-between gap-3 rounded-[22px] border px-4 py-3 text-sm ${
                    connectionState === "offline"
                      ? "border-[#E2B0A6] bg-[#F8E2DD] text-[#A24F42]"
                      : connectionState === "error"
                        ? "border-[#E7D4A3] bg-[#F9F0CC] text-[#8A6A22]"
                        : "border-[#2B2B2B]/8 bg-white/55 text-[#6F665C]"
                  }`}
                >
                  <span>{errorMessage}</span>
                  <button
                    type="button"
                    onClick={() => setReloadKey((value) => value + 1)}
                    className="shrink-0 rounded-full border border-[#2B2B2B]/8 bg-white/65 px-3 py-1 text-xs text-[#6F665C] transition hover:bg-white hover:text-ink"
                  >
                    Retry
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-[#2B2B2B]/8 px-5 py-4 sm:px-6">
                <div>
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#7A6851]">
                    <InboxIcon className="h-4 w-4 text-[#A77B28]" />
                    Inbox listings
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    Structured browsing for threads that deserve attention.
                  </p>
                </div>
                <div className="rounded-full border border-[#2B2B2B]/8 bg-[#F7F1E7] px-3.5 py-1.5 text-[11px] tracking-wide text-[#7A6851]">
                  {filteredEmails.length} visible
                </div>
              </div>

              <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                {loading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonCard key={`skeleton-${index}`} />
                    ))
                  : null}

                {!loading && filteredEmails.length === 0 ? (
                  <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-[30px] border border-dashed border-[#2B2B2B]/8 bg-white/55 px-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                    <h3 className="font-serif text-[30px] tracking-[-0.04em] text-ink">
                      No threads match that prompt
                    </h3>
                    <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
                      Try a broader phrasing like "recruiters", "deadlines", or
                      "follow up".
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
          </motion.div>

          {layoutMode !== "mobile" ? (
            <motion.div
              className="group relative flex w-5 shrink-0 cursor-col-resize items-center justify-center"
              onHoverStart={() => setIsDividerHovered(true)}
              onHoverEnd={() => setIsDividerHovered(false)}
              onPointerDown={startResize}
              animate={{
                opacity: isResizing ? 1 : isDividerHovered ? 0.9 : 0.55,
              }}
              transition={{ duration: isResizing ? 0.08 : 0.16 }}
            >
              <motion.div
                className={`absolute inset-y-8 left-1/2 w-px -translate-x-1/2 rounded-full ${
                  isResizing ? "shadow-[0_0_10px_rgba(221,107,87,0.18)]" : ""
                }`}
                animate={{
                  backgroundColor: isResizing
                    ? "rgba(221, 107, 87, 0.72)"
                    : isDividerHovered
                      ? "rgba(122, 104, 81, 0.28)"
                      : "rgba(122, 104, 81, 0.12)",
                  boxShadow: isResizing
                    ? "0 0 0 1px rgba(221,107,87,0.08), 0 0 18px rgba(221,107,87,0.14)"
                    : isDividerHovered
                      ? "0 0 0 1px rgba(122,104,81,0.05), 0 0 12px rgba(122,104,81,0.05)"
                      : "0 0 0 1px rgba(122,104,81,0.03)",
                }}
                transition={{ duration: isResizing ? 0.05 : 0.18 }}
              />

              <motion.div
                className="relative z-10 flex h-14 w-3 items-center justify-center"
                animate={{
                  opacity: isResizing ? 1 : isDividerHovered ? 0.75 : 0.34,
                  scale: isResizing ? 1.04 : isDividerHovered ? 1.02 : 1,
                }}
                transition={{ duration: isResizing ? 0.08 : 0.16 }}
              >
                <div className="flex flex-col gap-1">
                  <span className={`block h-1 w-1 rounded-full ${isResizing ? "bg-accent" : "bg-[#B6A48E]"}`} />
                  <span className={`block h-1 w-1 rounded-full ${isResizing ? "bg-accent" : "bg-[#B6A48E]"}`} />
                  <span className={`block h-1 w-1 rounded-full ${isResizing ? "bg-accent" : "bg-[#B6A48E]"}`} />
                </div>
              </motion.div>
            </motion.div>
          ) : null}

          <motion.div
            layout
            className={`min-h-0 min-w-0 flex-1 ${layoutMode === "mobile" ? "" : "overflow-y-auto pr-1"}`}
            style={{
              transition:
                isResizing || layoutMode === "mobile"
                  ? "none"
                  : "all 220ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <AIWorkspace
              email={selectedEmail}
              draft={draft}
              tone={tone}
              onToneChange={setTone}
              onDraftChange={setDraft}
              onGenerateDraft={handleGenerateDraft}
              isDraftLoading={draftLoading}
              draftError={draftError}
              isCompact={workspaceWidth < 520}
              isNarrow={workspaceWidth < 420}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
