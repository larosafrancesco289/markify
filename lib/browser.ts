import { chromium, firefox, Browser, BrowserContext, Page } from "playwright";

const MAX_CONCURRENT_PAGES = 3;
const NAVIGATION_TIMEOUT = 20000;
const NETWORK_IDLE_TIMEOUT = 15000;
const TOTAL_TIMEOUT = 30000;
const CONTENT_WAIT_TIMEOUT = 5000;
const JS_RENDER_DELAY = 1500;
const DIALOG_CHECK_TIMEOUT = 500;

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

let browser: Browser | null = null;
let activeContextCount = 0;
const activeContexts = new Set<BrowserContext>();

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
  if (browser && browser.isConnected()) {
    return browser;
  }

  // Firefox is less commonly blocked by bot detection
  browser = await launchFirefox().catch(() => launchChromium());
  return browser;
}

async function waitForAvailableSlot(): Promise<void> {
  while (activeContextCount >= MAX_CONCURRENT_PAGES) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

async function acquireContext(): Promise<BrowserContext> {
  await waitForAvailableSlot();
  activeContextCount++;

  const b = await getBrowser();
  const browserName = b.browserType().name() as "firefox" | "chromium";

  const context = await b.newContext({
    userAgent: USER_AGENTS[browserName],
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "America/New_York",
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await context.route(BLOCKED_RESOURCE_EXTENSIONS, (route) => route.abort());
  activeContexts.add(context);

  return context;
}

async function releaseContext(context: BrowserContext): Promise<void> {
  activeContexts.delete(context);
  activeContextCount--;
  await context.close().catch(() => {});
}

function configurePage(page: Page): void {
  page.setDefaultTimeout(TOTAL_TIMEOUT);
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
}

async function waitForContent(page: Page): Promise<void> {
  await page
    .waitForLoadState("networkidle", { timeout: NETWORK_IDLE_TIMEOUT })
    .catch(() => {});

  await page
    .waitForSelector(CONTENT_SELECTORS.join(", "), { timeout: CONTENT_WAIT_TIMEOUT })
    .catch(() => {});

  // Allow time for JS frameworks to finish rendering
  await page.waitForTimeout(JS_RENDER_DELAY);
}

async function dismissCookieDialogs(page: Page): Promise<void> {
  for (const selector of COOKIE_DISMISS_SELECTORS) {
    const button = page.locator(selector).first();
    const isVisible = await button.isVisible({ timeout: DIALOG_CHECK_TIMEOUT }).catch(() => false);

    if (isVisible) {
      await button.click();
      await page.waitForTimeout(DIALOG_CHECK_TIMEOUT);
      return;
    }
  }
}

export async function fetchWithBrowser(url: string): Promise<string> {
  const context = await acquireContext();

  try {
    const page = await context.newPage();
    configurePage(page);

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT,
    });

    await dismissCookieDialogs(page);
    await waitForContent(page);

    return await page.content();
  } finally {
    await releaseContext(context);
  }
}

export async function closeBrowser(): Promise<void> {
  const closePromises = Array.from(activeContexts).map((ctx) =>
    ctx.close().catch(() => {})
  );
  await Promise.all(closePromises);

  activeContexts.clear();
  activeContextCount = 0;

  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

async function handleShutdown(): Promise<void> {
  await closeBrowser();
  process.exit(0);
}

process.on("exit", () => closeBrowser());
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
