import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

import type { FetchResult } from "@/lib/types";

import { fetchWithBrowser } from "./browser";
import { serverConfig } from "./config";

export class FetchError extends Error {
  readonly code: "FETCH_FAILED" | "UNSUPPORTED_CONTENT" | "CONTENT_TOO_LARGE";

  constructor(
    code: "FETCH_FAILED" | "UNSUPPORTED_CONTENT" | "CONTENT_TOO_LARGE",
    message: string
  ) {
    super(message);
    this.name = "FetchError";
    this.code = code;
  }
}

export class BrowserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserError";
  }
}

export class BrowserTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserTimeoutError";
  }
}

export interface FetchDependencies {
  fetchImpl?: typeof fetch;
  browserFetch?: typeof fetchWithBrowser;
  hasSubstantialContentImpl?: (html: string, url: string) => boolean;
}

function isHtmlContentType(contentType: string | null): boolean {
  if (!contentType) {
    return false;
  }

  return (
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml")
  );
}

function hasSubstantialContent(html: string, url: string): boolean {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document.cloneNode(true) as Document);
    const article = reader.parse();

    if (!article?.textContent) {
      return false;
    }

    return (
      article.textContent.trim().length >= serverConfig.minExtractedTextLength
    );
  } catch {
    return false;
  }
}

function shouldRetryFetch(error: unknown): boolean {
  if (error instanceof FetchError) {
    return false;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  return error instanceof TypeError;
}

function mapStaticFetchError(error: unknown, url: string): FetchError {
  if (error instanceof FetchError) {
    return error;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return new FetchError(
      "FETCH_FAILED",
      `Timed out while fetching ${url}`
    );
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  return new FetchError("FETCH_FAILED", `Failed to fetch ${url}: ${message}`);
}

function wrapBrowserError(error: unknown, url: string): never {
  if (error instanceof Error && /timeout/i.test(error.message)) {
    throw new BrowserTimeoutError(`Browser timed out loading ${url}`);
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  throw new BrowserError(`Failed to render ${url}: ${message}`);
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStatic(url: string, fetchImpl: typeof fetch): Promise<string> {
  let lastError: FetchError | null = null;

  for (let attempt = 0; attempt < serverConfig.fetchRetryCount; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      serverConfig.staticFetchTimeoutMs
    );

    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Markify/1.0)",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (!response.ok) {
        throw new FetchError(
          "FETCH_FAILED",
          `Upstream responded with HTTP ${response.status}`
        );
      }

      const contentType = response.headers.get("content-type");

      if (!isHtmlContentType(contentType)) {
        throw new FetchError(
          "UNSUPPORTED_CONTENT",
          `URL did not return HTML content (${contentType || "unknown"})`
        );
      }

      const contentLength = Number(response.headers.get("content-length") || 0);

      if (
        Number.isFinite(contentLength) &&
        contentLength > serverConfig.maxHtmlBytes
      ) {
        throw new FetchError(
          "CONTENT_TOO_LARGE",
          "The page is too large to process safely"
        );
      }

      const html = await response.text();

      if (html.length > serverConfig.maxHtmlBytes) {
        throw new FetchError(
          "CONTENT_TOO_LARGE",
          "The page is too large to process safely"
        );
      }

      return html;
    } catch (error) {
      lastError = mapStaticFetchError(error, url);

      const hasRetryRemaining =
        attempt < serverConfig.fetchRetryCount - 1 && shouldRetryFetch(error);

      if (!hasRetryRemaining) {
        throw lastError;
      }

      await wait(200 * (attempt + 1));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw (
    lastError ??
    new FetchError("FETCH_FAILED", `Failed to fetch ${url}`)
  );
}

async function fetchWithBrowserFallback(
  url: string,
  browserFetch: typeof fetchWithBrowser
): Promise<FetchResult> {
  try {
    const html = await browserFetch(url);
    return { html, usedBrowser: true };
  } catch (error) {
    wrapBrowserError(error, url);
  }
}

export async function fetchHtml(
  url: string,
  dependencies: FetchDependencies = {}
): Promise<FetchResult> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const browserFetch = dependencies.browserFetch ?? fetchWithBrowser;
  const hasSubstantialContentImpl =
    dependencies.hasSubstantialContentImpl ?? hasSubstantialContent;
  let staticHtml: string | null = null;
  let staticFetchError: FetchError | null = null;

  try {
    staticHtml = await fetchStatic(url, fetchImpl);

    if (hasSubstantialContentImpl(staticHtml, url)) {
      return { html: staticHtml, usedBrowser: false };
    }
  } catch (error) {
    staticFetchError = mapStaticFetchError(error, url);

    if (
      staticFetchError.code === "UNSUPPORTED_CONTENT" ||
      staticFetchError.code === "CONTENT_TOO_LARGE"
    ) {
        throw staticFetchError;
    }
  }

  try {
    return await fetchWithBrowserFallback(url, browserFetch);
  } catch (browserError) {
    if (staticHtml) {
      return { html: staticHtml, usedBrowser: false };
    }

    if (staticFetchError) {
      throw staticFetchError;
    }

    throw browserError;
  }
}
