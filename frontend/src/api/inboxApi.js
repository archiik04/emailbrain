import { requestJson } from "./client";

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
    has_context: email.has_context || false,
    warning_flag: email.warning_flag || false,
  };
};

export const fetchInbox = async () => {
  const result = await requestJson({
    method: "get",
    url: "/inbox",
    validator: (data) => Array.isArray(data?.emails),
  });

  return {
    emails: result.data.emails.map(normalizeEmail),
    source: result.data.source || "api",
    baseUrl: result.baseUrl,
  };
};

const toneMap = {
  Casual: "casual",
  Professional: "formal",
  Friendly: "neutral",
};

export const generateDraft = async (email, tone = "Professional") => {
  const result = await requestJson({
    method: "post",
    url: "/drafts",
    data: {
      subject: email.subject,
      sender: email.sender,
      body: email.body || email.preview || "",
      tone_override: toneMap[tone] || "formal",
    },
    validator: (data) => typeof data?.draft === "string",
  });

  return {
    draft: result.data.draft,
    baseUrl: result.baseUrl,
  };
};
