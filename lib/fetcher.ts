import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { fetchWithBrowser } from "./browser";

const STATIC_FETCH_TIMEOUT = 10000;
const MIN_CONTENT_LENGTH = 200;

const JS_HEAVY_PATTERNS = [
  /kaggle\.com/i,
  /medium\.com\/@/i,
  /notion\.so/i,
  /figma\.com/i,
  /miro\.com/i,
  /airtable\.com/i,
  /linkedin\.com\/posts/i,
  /twitter\.com/i,
  /x\.com/i,
];

function isJsHeavySite(url: string): boolean {
  return JS_HEAVY_PATTERNS.some((pattern) => pattern.test(url));
}

function isHtmlContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.includes("text/html") || contentType.includes("application/xhtml+xml");
}

async function fetchStatic(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), STATIC_FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Markify/1.0; +https://markify.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (!isHtmlContentType(contentType)) {
      throw new Error(`Not HTML: ${contentType || "unknown"}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function hasSubstantialContent(html: string, url: string): boolean {
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document.cloneNode(true) as Document);
    const article = reader.parse();

    if (!article?.content) return false;

    const textContent = article.content.replace(/<[^>]*>/g, "").trim();
    return textContent.length >= MIN_CONTENT_LENGTH;
  } catch {
    return false;
  }
}

export interface FetchResult {
  html: string;
  usedBrowser: boolean;
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

function wrapBrowserError(error: unknown, url: string): never {
  if (error instanceof Error && error.message.includes("Timeout")) {
    throw new BrowserTimeoutError(`Browser timed out loading ${url}`);
  }
  const message = error instanceof Error ? error.message : "Unknown error";
  throw new BrowserError(`Failed to fetch ${url}: ${message}`);
}

async function fetchWithBrowserFallback(url: string): Promise<FetchResult> {
  try {
    const html = await fetchWithBrowser(url);
    return { html, usedBrowser: true };
  } catch (error) {
    wrapBrowserError(error, url);
  }
}

export async function fetchHtml(url: string): Promise<FetchResult> {
  if (isJsHeavySite(url)) {
    return fetchWithBrowserFallback(url);
  }

  let staticHtml: string | null = null;

  try {
    staticHtml = await fetchStatic(url);
    if (hasSubstantialContent(staticHtml, url)) {
      return { html: staticHtml, usedBrowser: false };
    }
  } catch {
    // Static fetch failed, will try browser below
  }

  try {
    const html = await fetchWithBrowser(url);
    return { html, usedBrowser: true };
  } catch (browserError) {
    // If we have static HTML, return it as fallback
    if (staticHtml) {
      return { html: staticHtml, usedBrowser: false };
    }
    wrapBrowserError(browserError, url);
  }
}
