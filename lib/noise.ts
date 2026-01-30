/**
 * Shared noise filtering constants and utilities for content extraction.
 * Used by both the extractor (DOM-level removal) and converter (Turndown filtering).
 */

// ============================================================================
// DOM Element Selectors (for pre-extraction removal)
// ============================================================================

/** Elements that should always be removed from the DOM before extraction */
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

/** Navigation and page chrome elements */
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

/** Advertisement and social sharing elements */
export const AD_SOCIAL_SELECTORS = [
  ".ad",
  ".ads",
  ".advertisement",
  ".social-share",
  ".share-buttons",
] as const;

/** Hidden elements (various methods) */
export const HIDDEN_SELECTORS = [
  '[aria-hidden="true"]',
  "[hidden]",
  ".hidden",
  '[style*="display: none"]',
  '[style*="display:none"]',
  '[style*="visibility: hidden"]',
  '[style*="visibility:hidden"]',
] as const;

/** Comment sections */
export const COMMENT_SELECTORS = [
  ".comments",
  "#comments",
  ".comment-section",
] as const;

/** Cookie consent and modal dialogs */
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

/** Icon font elements (Material, FontAwesome, Glyphicons, etc.) */
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

/** UI controls that should be removed */
export const UI_CONTROL_SELECTORS = [
  '[class*="copy-button"]',
  '[class*="collapse"]',
  '[aria-label*="copy"]',
  '[aria-label*="collapse"]',
  '[aria-label*="expand"]',
  "button:not([type='submit'])",
] as const;

/** Skip-to-content links */
export const SKIP_LINK_SELECTORS = [
  '[class*="skip-"]',
  '[href="#site-content"]',
  '[href="#main-content"]',
  '[href="#content"]',
  '[href="#bodyContent"]',
  '[class*="skip-to"]',
] as const;

/** Common site-wide noise (newsletters, popups, CTAs) */
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

/** Search and auth UI elements */
export const AUTH_SEARCH_SELECTORS = [
  '[class*="search-form"]',
  '[class*="login-"]',
  '[class*="signup-"]',
  '[class*="auth-"]',
  '[id*="search-form"]',
] as const;

/** Breadcrumbs */
export const BREADCRUMB_SELECTORS = [
  '[class*="breadcrumb"]',
  '[aria-label="breadcrumb"]',
] as const;

/** Related/recommended content sections */
export const RELATED_CONTENT_SELECTORS = [
  '[class*="related-"]',
  '[class*="recommended"]',
  '[class*="suggested"]',
  '[class*="trending"]',
] as const;

/** All DOM noise selectors combined for extraction */
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

// ============================================================================
// Turndown-specific noise tags
// ============================================================================

/** HTML tags that Turndown should completely remove */
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
];

/** Selectors for Turndown rule filtering (subset most relevant to conversion) */
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

// ============================================================================
// Icon Ligature Detection
// ============================================================================

/**
 * Pattern for detecting Material icon ligature text.
 * Matches common icon names like: arrow_back, keyboard_arrow_up, play_arrow, etc.
 */
const ICON_LIGATURE_PATTERN = new RegExp(
  "^(" +
    // Arrow/navigation icons
    "keyboard_arrow_(up|down|left|right)|" +
    "arrow_(back|forward|upward|downward|drop_down|drop_up)|" +
    "expand_(more|less)|chevron_(left|right)|" +
    // Common action icons
    "close|menu|search|home|settings|check|add|remove|edit|delete|share|" +
    "more_(vert|horiz)|link|copy|content_(copy|paste)|open_in_new|launch|" +
    "download|upload|visibility(_off)?|lock(_open)?|star(_border)?|" +
    "favorite(_border)?|info|warning|error|help(_outline)?|notifications|" +
    "email|phone|place|schedule|" +
    // Media controls
    "play_arrow|pause|stop|skip_(next|previous)|replay|volume_(up|down|off)|" +
    // Social/interaction
    "thumb_(up|down)|comment|forum|send|attach_file|image|photo|camera|" +
    // User/account
    "person|people|group|account_circle|face|log(out|in)|" +
    // Files/content
    "folder|file_copy|description|article|note|bookmark|label|flag|" +
    // Sync/refresh
    "refresh|sync|cached|autorenew|update|published_with_changes|" +
    // View controls
    "fullscreen(_exit)?|zoom_(in|out)|fit_screen|" +
    // Drag/sort
    "drag_(indicator|handle)|reorder|sort|filter_list|" +
    // Status
    "done(_all)?|clear|cancel|block|report" +
    ")$"
);

/** Pattern for snake_case text that looks like icon names */
const SNAKE_CASE_ICON_PATTERN = /^[a-z]+(_[a-z0-9]+)+$/;

/**
 * Checks if text appears to be icon ligature text (e.g., Material Icons).
 */
export function isIconLigatureText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 50) return false;

  if (ICON_LIGATURE_PATTERN.test(trimmed)) return true;

  // Generic snake_case pattern for unknown icon names
  if (SNAKE_CASE_ICON_PATTERN.test(trimmed) && trimmed.length < 30) {
    return true;
  }

  return false;
}

// ============================================================================
// Text Normalization
// ============================================================================

/**
 * Normalizes text for comparison (lowercase, alphanumeric only, collapsed spaces).
 */
export function normalizeTextForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
