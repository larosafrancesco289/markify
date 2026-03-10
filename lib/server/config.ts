const DEFAULT_STATIC_FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_HTML_BYTES = 2_000_000;
const DEFAULT_MIN_EXTRACTED_TEXT_LENGTH = 180;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 20;
const DEFAULT_BROWSER_CONCURRENCY = 3;
const DEFAULT_BROWSER_NAVIGATION_TIMEOUT_MS = 25_000;
const DEFAULT_BROWSER_NETWORK_IDLE_TIMEOUT_MS = 20_000;
const DEFAULT_BROWSER_TOTAL_TIMEOUT_MS = 45_000;
const DEFAULT_BROWSER_CONTENT_WAIT_TIMEOUT_MS = 8_000;
const DEFAULT_BROWSER_RENDER_DELAY_MS = 2_500;
const DEFAULT_FETCH_RETRY_COUNT = 2;

function getNumberEnv(
  key: string,
  fallback: number,
  options: { min?: number; max?: number } = {}
): number {
  const rawValue = process.env[key];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  if (options.min !== undefined && parsedValue < options.min) {
    return fallback;
  }

  if (options.max !== undefined && parsedValue > options.max) {
    return fallback;
  }

  return parsedValue;
}

export const serverConfig = {
  staticFetchTimeoutMs: getNumberEnv(
    "MARKIFY_STATIC_FETCH_TIMEOUT_MS",
    DEFAULT_STATIC_FETCH_TIMEOUT_MS,
    { min: 1_000 }
  ),
  maxHtmlBytes: getNumberEnv("MARKIFY_MAX_HTML_BYTES", DEFAULT_MAX_HTML_BYTES, {
    min: 50_000,
  }),
  minExtractedTextLength: getNumberEnv(
    "MARKIFY_MIN_EXTRACTED_TEXT_LENGTH",
    DEFAULT_MIN_EXTRACTED_TEXT_LENGTH,
    { min: 50 }
  ),
  rateLimitWindowMs: getNumberEnv(
    "MARKIFY_RATE_LIMIT_WINDOW_MS",
    DEFAULT_RATE_LIMIT_WINDOW_MS,
    { min: 1_000 }
  ),
  rateLimitMaxRequests: getNumberEnv(
    "MARKIFY_RATE_LIMIT_MAX_REQUESTS",
    DEFAULT_RATE_LIMIT_MAX_REQUESTS,
    { min: 1 }
  ),
  browserConcurrency: getNumberEnv(
    "MARKIFY_BROWSER_CONCURRENCY",
    DEFAULT_BROWSER_CONCURRENCY,
    { min: 1, max: 10 }
  ),
  browserNavigationTimeoutMs: getNumberEnv(
    "MARKIFY_BROWSER_NAVIGATION_TIMEOUT_MS",
    DEFAULT_BROWSER_NAVIGATION_TIMEOUT_MS,
    { min: 1_000 }
  ),
  browserNetworkIdleTimeoutMs: getNumberEnv(
    "MARKIFY_BROWSER_NETWORK_IDLE_TIMEOUT_MS",
    DEFAULT_BROWSER_NETWORK_IDLE_TIMEOUT_MS,
    { min: 1_000 }
  ),
  browserTotalTimeoutMs: getNumberEnv(
    "MARKIFY_BROWSER_TOTAL_TIMEOUT_MS",
    DEFAULT_BROWSER_TOTAL_TIMEOUT_MS,
    { min: 1_000 }
  ),
  browserContentWaitTimeoutMs: getNumberEnv(
    "MARKIFY_BROWSER_CONTENT_WAIT_TIMEOUT_MS",
    DEFAULT_BROWSER_CONTENT_WAIT_TIMEOUT_MS,
    { min: 500 }
  ),
  browserRenderDelayMs: getNumberEnv(
    "MARKIFY_BROWSER_RENDER_DELAY_MS",
    DEFAULT_BROWSER_RENDER_DELAY_MS,
    { min: 0 }
  ),
  fetchRetryCount: getNumberEnv(
    "MARKIFY_FETCH_RETRY_COUNT",
    DEFAULT_FETCH_RETRY_COUNT,
    { min: 1, max: 5 }
  ),
} as const;
