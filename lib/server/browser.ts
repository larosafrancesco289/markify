import { chromium, firefox, type Browser, type BrowserContext, type Page } from "playwright";

import { serverConfig } from "./config";

const BLOCKED_RESOURCE_EXTENSIONS =
  /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|mp4|webm|mp3|wav)$/i;

const USER_AGENTS = {
  firefox:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
  chromium:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
} as const;

const CONTENT_SELECTORS = [
  "article",
  "main",
  "[role='main']",
  ".content",
  "#content",
  "[data-testid]",
  ".post-content",
  ".article-content",
  ".entry-content",
  ".prose",
  ".markdown-body",
  ".documentation",
  ".docs-content",
  "[class*='ArticleBody']",
  "[class*='PostContent']",
  ".competition-overview",
  ".readme",
];

const COOKIE_DISMISS_SELECTORS = [
  "[aria-label*='accept' i]",
  "[aria-label*='agree' i]",
  "button:has-text('Accept')",
  "button:has-text('I agree')",
  "button:has-text('Got it')",
  "button:has-text('OK')",
  "[class*='cookie'] button",
  "[class*='consent'] button",
  "[id*='cookie'] button",
];

const DIALOG_CHECK_TIMEOUT_MS = 500;

let browserPromise: Promise<Browser> | null = null;
const activeContexts = new Set<BrowserContext>();
let activePageCount = 0;
const waitQueue: Array<() => void> = [];

async function launchFirefox(): Promise<Browser> {
  return firefox.launch({ headless: true });
}

async function launchChromium(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    ],
  });
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchFirefox().catch(() => launchChromium());
  }

  try {
    const browser = await browserPromise;

    if (!browser.isConnected()) {
      browserPromise = launchFirefox().catch(() => launchChromium());
      return browserPromise;
    }

    return browser;
  } catch (error) {
    browserPromise = null;
    throw error;
  }
}

async function acquirePageSlot(): Promise<void> {
  if (activePageCount < serverConfig.browserConcurrency) {
    activePageCount += 1;
    return;
  }

  await new Promise<void>((resolve) => {
    waitQueue.push(() => {
      activePageCount += 1;
      resolve();
    });
  });
}

function releasePageSlot(): void {
  activePageCount = Math.max(0, activePageCount - 1);
  const nextInQueue = waitQueue.shift();

  if (nextInQueue) {
    nextInQueue();
  }
}

async function acquireContext(): Promise<BrowserContext> {
  await acquirePageSlot();

  try {
    const browser = await getBrowser();
    const browserName = browser.browserType().name() as "firefox" | "chromium";
    const context = await browser.newContext({
      userAgent: USER_AGENTS[browserName],
      viewport: { width: 1440, height: 900 },
      locale: "en-US",
      timezoneId: "America/New_York",
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await context.route(BLOCKED_RESOURCE_EXTENSIONS, (route) =>
      route.abort()
    );

    activeContexts.add(context);
    return context;
  } catch (error) {
    releasePageSlot();
    throw error;
  }
}

async function releaseContext(context: BrowserContext): Promise<void> {
  activeContexts.delete(context);
  await context.close().catch(() => {});
  releasePageSlot();
}

function configurePage(page: Page): void {
  page.setDefaultTimeout(serverConfig.browserTotalTimeoutMs);
  page.setDefaultNavigationTimeout(serverConfig.browserNavigationTimeoutMs);
}

async function waitForContent(page: Page): Promise<void> {
  await page
    .waitForLoadState("networkidle", {
      timeout: serverConfig.browserNetworkIdleTimeoutMs,
    })
    .catch(() => {});

  await page
    .waitForSelector(CONTENT_SELECTORS.join(", "), {
      timeout: serverConfig.browserContentWaitTimeoutMs,
    })
    .catch(() => {});

  await page.waitForTimeout(serverConfig.browserRenderDelayMs);
}

async function dismissCookieDialogs(page: Page): Promise<void> {
  for (const selector of COOKIE_DISMISS_SELECTORS) {
    const button = page.locator(selector).first();
    const isVisible = await button
      .isVisible({ timeout: DIALOG_CHECK_TIMEOUT_MS })
      .catch(() => false);

    if (!isVisible) {
      continue;
    }

    await button.click().catch(() => {});
    await page.waitForTimeout(DIALOG_CHECK_TIMEOUT_MS);
    return;
  }
}

export async function fetchWithBrowser(url: string): Promise<string> {
  const context = await acquireContext();

  try {
    const page = await context.newPage();
    configurePage(page);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: serverConfig.browserNavigationTimeoutMs,
    });

    await dismissCookieDialogs(page);
    await waitForContent(page);

    return await page.content();
  } finally {
    await releaseContext(context);
  }
}

export async function closeBrowser(): Promise<void> {
  const contextsToClose = Array.from(activeContexts);
  activeContexts.clear();

  await Promise.all(
    contextsToClose.map((context) => context.close().catch(() => {}))
  );

  activePageCount = 0;
  waitQueue.length = 0;

  if (!browserPromise) {
    return;
  }

  const browser = await browserPromise.catch(() => null);
  browserPromise = null;

  if (browser) {
    await browser.close().catch(() => {});
  }
}
