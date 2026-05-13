import { requestJson } from "./client";

export const generateDraft = async (subject, sender, body, toneOverride = null) => {
  const result = await requestJson({
    method: "post",
    url: "/drafts",
    data: {
      subject,
      sender,
      body,
      ...(toneOverride ? { tone_override: toneOverride } : {}),
    },
    validator: (data) => typeof data?.draft === "string",
  });

  return {
    draft: result.data.draft,
    baseUrl: result.baseUrl,
  };
};

export const getToneProfile = async () => {
  const result = await requestJson({
    method: "get",
    url: "/drafts/tone-profile",
  });

  return {
    profile: result.data.profile,
    baseUrl: result.baseUrl,
  };
};
