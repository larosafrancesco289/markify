import DOMPurify, { Config } from "isomorphic-dompurify";

// DOMPurify configuration for content extraction
const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "br", "hr",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "strong", "em", "b", "i", "u", "s", "del", "ins",
    "table", "thead", "tbody", "tr", "th", "td",
    "img", "figure", "figcaption",
    "div", "span", "article", "section", "main",
  ],
  ALLOWED_ATTR: [
    "href", "src", "alt", "title", "class", "id",
    "colspan", "rowspan",
  ],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

// Unicode normalization and cleanup
const UNICODE_REPLACEMENTS: [RegExp, string][] = [
  // Smart quotes to standard quotes
  [/[\u2018\u2019\u201A\u201B]/g, "'"],
  [/[\u201C\u201D\u201E\u201F]/g, '"'],

  // Dashes
  [/\u2013/g, "-"], // En dash
  [/\u2014/g, "--"], // Em dash
  [/\u2015/g, "--"], // Horizontal bar

  // Spaces
  [/\u00A0/g, " "], // Non-breaking space
  [/\u2002/g, " "], // En space
  [/\u2003/g, " "], // Em space
  [/\u2009/g, " "], // Thin space

  // Zero-width characters
  [/[\u200B\u200C\u200D\uFEFF]/g, ""],

  // Ellipsis
  [/\u2026/g, "..."],

  // Bullets
  [/\u2022/g, "-"],
  [/\u2023/g, ">"],
  [/\u2043/g, "-"],

  // Arrows (keep as text alternatives)
  [/\u2190/g, "<-"],
  [/\u2192/g, "->"],
  [/\u2194/g, "<->"],

  // Math symbols
  [/\u00D7/g, "x"], // Multiplication
  [/\u00F7/g, "/"], // Division
  [/\u2212/g, "-"], // Minus sign
  [/\u00B1/g, "+/-"], // Plus-minus
];

export function normalizeUnicode(text: string): string {
  // First, normalize to NFC form
  let normalized = text.normalize("NFC");

  // Apply replacements
  for (const [pattern, replacement] of UNICODE_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Clean up multiple spaces
  normalized = normalized.replace(/ {2,}/g, " ");

  return normalized;
}

export function processContent(html: string): string {
  const sanitized = sanitizeHtml(html);
  return normalizeUnicode(sanitized);
}
