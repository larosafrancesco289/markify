export const ALWAYS_REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "link",
  "meta",
  "svg",
  "iframe",
  "canvas",
  "video",
  "audio",
] as const;

export const NAVIGATION_SELECTORS = [
  "nav",
  "header",
  "footer",
  '[role="navigation"]',
  '[role="menubar"]',
  '[role="menu"]',
  '[role="banner"]',
  '[role="contentinfo"]',
] as const;

export const AD_SOCIAL_SELECTORS = [
  ".ad",
  ".ads",
  ".advertisement",
  ".social-share",
  ".share-buttons",
] as const;

export const HIDDEN_SELECTORS = [
  '[aria-hidden="true"]',
  "[hidden]",
  ".hidden",
  '[style*="display: none"]',
  '[style*="display:none"]',
  '[style*="visibility: hidden"]',
  '[style*="visibility:hidden"]',
] as const;

export const COMMENT_SELECTORS = [
  ".comments",
  "#comments",
  ".comment-section",
] as const;

export const MODAL_SELECTORS = [
  '[class*="cookie"]',
  '[class*="consent"]',
  '[class*="gdpr"]',
  '[class*="privacy-banner"]',
  '[id*="cookie"]',
  '[id*="consent"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[aria-modal="true"]',
] as const;

export const ICON_SELECTORS = [
  ".material-icons",
  ".material-icons-outlined",
  ".material-icons-round",
  ".material-icons-sharp",
  ".material-symbols-outlined",
  ".material-symbols-rounded",
  ".material-symbols-sharp",
  '[class*="icon-"]',
  '[class*="-icon"]',
  'i[class*="fa-"]',
  ".fa",
  ".fas",
  ".far",
  ".fal",
  ".fab",
  ".glyphicon",
  "span.icon",
] as const;

export const UI_CONTROL_SELECTORS = [
  '[class*="copy-button"]',
  '[class*="collapse"]',
  '[aria-label*="copy"]',
  '[aria-label*="collapse"]',
  '[aria-label*="expand"]',
  "button:not([type='submit'])",
] as const;

export const SKIP_LINK_SELECTORS = [
  '[class*="skip-"]',
  '[href="#site-content"]',
  '[href="#main-content"]',
  '[href="#content"]',
  '[href="#bodyContent"]',
  '[class*="skip-to"]',
] as const;

export const SITE_NOISE_SELECTORS = [
  '[class*="newsletter"]',
  '[class*="subscribe"]',
  '[class*="popup"]',
  '[class*="modal"]',
  '[class*="overlay"]',
  '[class*="toast"]',
  '[class*="notification"]',
  '[class*="banner"]:not([class*="hero"])',
  '[class*="promo"]',
  '[class*="cta-"]',
] as const;

export const AUTH_SEARCH_SELECTORS = [
  '[class*="search-form"]',
  '[class*="login-"]',
  '[class*="signup-"]',
  '[class*="auth-"]',
  '[id*="search-form"]',
] as const;

export const BREADCRUMB_SELECTORS = [
  '[class*="breadcrumb"]',
  '[aria-label="breadcrumb"]',
] as const;

export const RELATED_CONTENT_SELECTORS = [
  '[class*="related-"]',
  '[class*="recommended"]',
  '[class*="suggested"]',
  '[class*="trending"]',
] as const;

export const CONTENT_CANDIDATE_SELECTORS = [
  "article",
  "main",
  "[role='main']",
  ".post-content",
  ".article-content",
  ".entry-content",
  ".content",
  "#content",
  ".markdown-body",
  ".docs-content",
  ".documentation",
  ".prose",
] as const;

export const ALL_NOISE_SELECTORS = [
  ...ALWAYS_REMOVE_SELECTORS,
  ...NAVIGATION_SELECTORS,
  ...AD_SOCIAL_SELECTORS,
  ...HIDDEN_SELECTORS,
  ...COMMENT_SELECTORS,
  ...MODAL_SELECTORS,
  ...ICON_SELECTORS,
  ...UI_CONTROL_SELECTORS,
  ...SKIP_LINK_SELECTORS,
  ...SITE_NOISE_SELECTORS,
  ...AUTH_SEARCH_SELECTORS,
  ...BREADCRUMB_SELECTORS,
  ...RELATED_CONTENT_SELECTORS,
] as const;

export const NOISE_TAGS: string[] = [
  "nav",
  "header",
  "footer",
  "aside",
  "script",
  "style",
  "noscript",
  "iframe",
  "form",
  "button",
  "canvas",
  "svg",
] as const as string[];

export const TURNDOWN_NOISE_SELECTORS = [
  ".advertisement",
  ".ad",
  ".ads",
  ".social-share",
  ".comments",
  ".sidebar",
  "[role='navigation']",
  "[role='banner']",
  "[role='contentinfo']",
  "[aria-hidden='true']",
  ".material-icons",
  ".material-symbols-outlined",
  "[class*='icon']",
];

const ICON_LIGATURE_PATTERN = new RegExp(
  "^(" +
    "keyboard_arrow_(up|down|left|right)|" +
    "arrow_(back|forward|upward|downward|drop_down|drop_up)|" +
    "expand_(more|less)|chevron_(left|right)|" +
    "close|menu|search|home|settings|check|add|remove|edit|delete|share|" +
    "more_(vert|horiz)|link|copy|content_(copy|paste)|open_in_new|launch|" +
    "download|upload|visibility(_off)?|lock(_open)?|star(_border)?|" +
    "favorite(_border)?|info|warning|error|help(_outline)?|notifications|" +
    "email|phone|place|schedule|" +
    "play_arrow|pause|stop|skip_(next|previous)|replay|volume_(up|down|off)|" +
    "thumb_(up|down)|comment|forum|send|attach_file|image|photo|camera|" +
    "person|people|group|account_circle|face|log(out|in)|" +
    "folder|file_copy|description|article|note|bookmark|label|flag|" +
    "refresh|sync|cached|autorenew|update|published_with_changes|" +
    "fullscreen(_exit)?|zoom_(in|out)|fit_screen|" +
    "drag_(indicator|handle)|reorder|sort|filter_list|" +
    "done(_all)?|clear|cancel|block|report" +
    ")$"
);

const SNAKE_CASE_ICON_PATTERN = /^[a-z]+(_[a-z0-9]+)+$/;

export function isIconLigatureText(text: string): boolean {
  const trimmedText = text.trim();

  if (!trimmedText || trimmedText.length > 50) {
    return false;
  }

  if (ICON_LIGATURE_PATTERN.test(trimmedText)) {
    return true;
  }

  return SNAKE_CASE_ICON_PATTERN.test(trimmedText) && trimmedText.length < 30;
}

export function normalizeTextForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
