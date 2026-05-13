import { requestJson } from "./client";

export const searchEmails = async (query, topK = 5) => {
  const result = await requestJson({
    method: "post",
    url: "/search",
    data: { query, top_k: topK },
    validator: (data) => Array.isArray(data?.results),
  });

  return {
    results: result.data.results,
    summary: result.data.summary || "",
    query: result.data.query || query,
    baseUrl: result.baseUrl,
  };
};
