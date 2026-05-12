import axios from "axios";
import { mockEmails } from "../data/mockInbox";

const API_CANDIDATES = [
  process.env.REACT_APP_API_URL,
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8765",
].filter(Boolean);

let activeBaseUrl = process.env.REACT_APP_API_URL || null;

const urgencyFromScore = (score = 0) => {
  if (score >= 8) {
    return "High";
  }

  if (score >= 5) {
    return "Medium";
  }

  return "Low";
};

const formatDisplayDate = (value) => {
  if (!value) {
    return "Recently";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Recently";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const buildPreview = (email) => {
  if (email.preview) {
    return email.preview;
  }

  if (email.body) {
    return email.body.slice(0, 148);
  }

  return "Open this thread in EmailBrain to review context, priorities, and suggested next steps.";
};

const normalizeEmail = (email, index = 0) => {
  const score = Number(email.score ?? email.triage_score ?? 5);

  return {
    message_id: email.message_id || `email-${index}`,
    sender: email.sender || "Unknown sender",
    subject: email.subject || "Untitled thread",
    preview: buildPreview(email),
    body: email.body || email.preview || "",
    score,
    urgency: urgencyFromScore(score),
    unread: typeof email.unread === "boolean" ? email.unread : index < 2,
    date: email.date || "",
    displayDate: formatDisplayDate(email.date),
  };
};

const buildFallbackDraft = (email, tone) => {
  const greeting = tone === "Casual" ? "Hey" : "Hi";
  const closing =
    tone === "Professional"
      ? "Best regards,"
      : tone === "Friendly"
        ? "Thanks so much,"
        : "Best,";

  return `${greeting} ${email.sender.split("<")[0].trim() || "there"},

Thanks for reaching out about "${email.subject}". I reviewed the thread and I'm aligned on the next step.

${email.urgency === "High"
    ? "I can prioritize this today and will follow up with a clear update shortly."
    : "I can take a look and follow up with a clear update soon."}

${closing}
You`;
};

const requestWithFallback = async (config) => {
  const candidates = activeBaseUrl
    ? [activeBaseUrl, ...API_CANDIDATES.filter((url) => url !== activeBaseUrl)]
    : API_CANDIDATES;

  let lastError;

  for (const baseURL of candidates) {
    try {
      const response = await axios({
        baseURL,
        timeout: 6000,
        ...config,
      });

      activeBaseUrl = baseURL;
      return response.data;
    } catch (error) {
      lastError = error;

      if (error.response && error.response.status < 500) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const fetchInbox = async () => {
  try {
    const data = await requestWithFallback({
      method: "get",
      url: "/inbox",
    });

    const emails = Array.isArray(data?.emails) ? data.emails : [];

    return {
      emails: emails.map(normalizeEmail),
      source: "api",
      usingMock: false,
    };
  } catch (error) {
    return {
      emails: mockEmails.map(normalizeEmail),
      source: "mock",
      usingMock: true,
      error,
    };
  }
};

const toneMap = {
  Casual: "casual",
  Professional: "formal",
  Friendly: "neutral",
};

export const generateDraft = async (email, tone = "Professional") => {
  try {
    const data = await requestWithFallback({
      method: "post",
      url: "/drafts",
      data: {
        subject: email.subject,
        sender: email.sender,
        body: email.body || email.preview || "",
        tone_override: toneMap[tone] || "formal",
      },
    });

    return data?.draft || buildFallbackDraft(email, tone);
  } catch (error) {
    return buildFallbackDraft(email, tone);
  }
};
