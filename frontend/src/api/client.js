import axios from "axios";

const unique = (values) => [...new Set(values.filter(Boolean))];

const API_CANDIDATES = unique([
  process.env.REACT_APP_API_URL,
  "http://127.0.0.1:8765",
  "http://localhost:8765",
  "http://127.0.0.1:8000",
  "http://localhost:8000",
]);

const RETRYABLE_STATUS_CODES = new Set([404, 405, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 15000;

let activeBaseUrl = process.env.REACT_APP_API_URL || null;

export class ApiRequestError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiRequestError";
    this.baseUrl = options.baseUrl || null;
    this.endpoint = options.endpoint || null;
    this.status = options.status || null;
    this.details = options.details || null;
    this.isNetworkError = Boolean(options.isNetworkError);
    this.attempts = options.attempts || [];
  }
}

const isJsonResponse = (response) =>
  (response.headers?.["content-type"] || "").includes("application/json");

const createApiError = (message, options = {}) =>
  new ApiRequestError(message, options);

const normalizeAxiosError = (error, baseUrl, endpoint, attempts) => {
  const status = error.response?.status ?? null;
  const details = error.response?.data ?? error.message;

  return createApiError(error.message || "API request failed.", {
    baseUrl,
    endpoint,
    status,
    details,
    isNetworkError: !error.response,
    attempts,
  });
};

const shouldTryNextBaseUrl = (error) => {
  if (error instanceof ApiRequestError) {
    return error.isNetworkError || RETRYABLE_STATUS_CODES.has(error.status);
  }

  return false;
};

export const getResolvedApiBaseUrl = () => activeBaseUrl;

export const requestJson = async ({
  method = "get",
  url,
  data,
  validator,
  timeout = DEFAULT_TIMEOUT_MS,
}) => {
  const candidates = activeBaseUrl
    ? [activeBaseUrl, ...API_CANDIDATES.filter((value) => value !== activeBaseUrl)]
    : API_CANDIDATES;

  const attempts = [];
  let lastError = null;

  for (const baseUrl of candidates) {
    try {
      const response = await axios({
        baseURL: baseUrl,
        method,
        url,
        data,
        timeout,
      });

      if (!isJsonResponse(response)) {
        throw createApiError(`Expected JSON from ${baseUrl}${url}.`, {
          baseUrl,
          endpoint: url,
          attempts,
        });
      }

      if (validator && !validator(response.data)) {
        throw createApiError(`Unexpected response shape from ${baseUrl}${url}.`, {
          baseUrl,
          endpoint: url,
          details: response.data,
          attempts,
        });
      }

      activeBaseUrl = baseUrl;
      return {
        data: response.data,
        baseUrl,
      };
    } catch (error) {
      const normalizedError =
        error instanceof ApiRequestError
          ? error
          : normalizeAxiosError(error, baseUrl, url, attempts);

      attempts.push({
        baseUrl,
        endpoint: url,
        status: normalizedError.status,
        message: normalizedError.message,
      });

      lastError = normalizedError;

      if (!shouldTryNextBaseUrl(normalizedError)) {
        throw normalizedError;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw createApiError(`No API base URL succeeded for ${url}.`, {
    endpoint: url,
    attempts,
    isNetworkError: true,
  });
};
