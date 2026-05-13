import { requestJson } from "./client";

export const getFollowups = async (days = 3) => {
  const result = await requestJson({
    method: "get",
    url: `/followups?days=${days}`,
    validator: (data) => Array.isArray(data?.followups),
  });

  return {
    followups: result.data.followups,
    count: result.data.count,
    baseUrl: result.baseUrl,
  };
};

export const resolveFollowup = async (messageId) => {
  const result = await requestJson({
    method: "post",
    url: "/followups/resolve",
    data: { message_id: messageId },
  });

  return result.data;
};

export const generateNudge = async (subject, recipient, daysWaiting) => {
  const result = await requestJson({
    method: "post",
    url: "/followups/nudge",
    data: { subject, recipient, days_waiting: daysWaiting },
    validator: (data) => typeof data?.nudge === "string",
  });

  return {
    nudge: result.data.nudge,
    baseUrl: result.baseUrl,
  };
};
