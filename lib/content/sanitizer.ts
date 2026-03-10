import DOMPurify, { type Config } from "isomorphic-dompurify";

const PURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "br",
    "hr",
    "ul",
    "ol",
    "li",
    "blockquote",
    "pre",
    "code",
    "a",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "s",
    "del",
    "ins",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "img",
    "figure",
    "figcaption",
    "div",
    "span",
    "article",
    "section",
    "main",
  ],
  ALLOWED_ATTR: [
    "href",
    "src",
    "alt",
    "title",
    "class",
    "colspan",
    "rowspan",
  ],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
};

const UNICODE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u201B]/g, "'"],
  [/[\u201C\u201D\u201E\u201F]/g, '"'],
  [/\u2013/g, "-"],
  [/\u2014/g, "--"],
  [/\u2015/g, "--"],
  [/\u00A0/g, " "],
  [/\u2002/g, " "],
  [/\u2003/g, " "],
  [/\u2009/g, " "],
  [/[\u200B\u200C\u200D\uFEFF]/g, ""],
  [/\u2026/g, "..."],
  [/\u2022/g, "-"],
  [/\u2023/g, ">"],
  [/\u2043/g, "-"],
  [/\u2190/g, "<-"],
  [/\u2192/g, "->"],
  [/\u2194/g, "<->"],
  [/\u00D7/g, "x"],
  [/\u00F7/g, "/"],
  [/\u2212/g, "-"],
  [/\u00B1/g, "+/-"],
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, PURIFY_CONFIG);
}

export function normalizeUnicode(text: string): string {
  let normalizedText = text.normalize("NFC");

  for (const [pattern, replacement] of UNICODE_REPLACEMENTS) {
    normalizedText = normalizedText.replace(pattern, replacement);
  }

  return normalizedText.replace(/ {2,}/g, " ");
}
