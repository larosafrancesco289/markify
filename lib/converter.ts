import TurndownService from "turndown";

import {
  NOISE_TAGS,
  TURNDOWN_NOISE_SELECTORS,
  isIconLigatureText,
  normalizeTextForComparison,
} from "./noise";

// ============================================================================
// Turndown Service Configuration
// ============================================================================

function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
  });

  turndown.remove(NOISE_TAGS as (keyof HTMLElementTagNameMap)[]);

  // Remove elements matching noise CSS selectors
  turndown.addRule("noiseSelectors", {
    filter: (node) => {
      const element = node as Element;
      return TURNDOWN_NOISE_SELECTORS.some((selector) => {
        try {
          return element.matches?.(selector);
        } catch {
          return false;
        }
      });
    },
    replacement: () => "",
  });

  // Filter out icon ligature text in leaf nodes
  turndown.addRule("iconLigatureFilter", {
    filter: (node) => {
      if (node.nodeType !== 1) return false;
      const text = node.textContent?.trim() || "";
      return node.childNodes.length <= 1 && isIconLigatureText(text);
    },
    replacement: () => "",
  });

  // Filter empty or icon-only links
  turndown.addRule("emptyLinks", {
    filter: (node) => {
      if (node.nodeName !== "A") return false;
      const text = node.textContent?.trim() || "";
      return !text || isIconLigatureText(text);
    },
    replacement: () => "",
  });

  // Filter tracking pixels and images without alt text
  turndown.addRule("emptyImages", {
    filter: (node) => {
      if (node.nodeName !== "IMG") return false;
      const img = node as HTMLImageElement;
      const alt = img.getAttribute("alt")?.trim();
      if (alt) return false;

      const src = img.getAttribute("src") || "";
      return (
        src.startsWith("data:") ||
        src.includes("pixel") ||
        src.includes("tracking")
      );
    },
    replacement: () => "",
  });

  // Figures with captions
  turndown.addRule("figure", {
    filter: "figure",
    replacement: (content, node) => {
      const figure = node as HTMLElement;
      const img = figure.querySelector("img");

      if (img) {
        const figcaption = figure.querySelector("figcaption");
        const alt = img.getAttribute("alt") || "";
        const src = img.getAttribute("src") || "";
        const caption = figcaption?.textContent?.trim() || alt;
        return `\n\n![${caption}](${src})\n\n`;
      }

      return `\n\n${content}\n\n`;
    },
  });

  // Code blocks with language detection
  turndown.addRule("codeBlock", {
    filter: (node) =>
      node.nodeName === "PRE" && node.querySelector("code") !== null,
    replacement: (_content, node) => {
      const pre = node as HTMLElement;
      const codeElement = pre.querySelector("code");
      const className = codeElement?.className || "";
      const langMatch = className.match(/(?:language-|lang-)(\w+)/);
      const lang = langMatch?.[1] || "";
      const code = codeElement?.textContent || pre.textContent || "";

      return `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
    },
  });

  // Inline code
  turndown.addRule("inlineCode", {
    filter: (node) =>
      node.nodeName === "CODE" && node.parentNode?.nodeName !== "PRE",
    replacement: (content) => {
      if (!content.trim()) return "";
      return `\`${content.replace(/`/g, "\\`")}\``;
    },
  });

  // Tables
  turndown.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.querySelectorAll("tr"));
      if (rows.length === 0) return "";

      const result: string[] = [];
      let headerProcessed = false;

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll("th, td"));
        const cellContents = cells.map(
          (cell) =>
            cell.textContent?.trim().replace(/\|/g, "\\|").replace(/\n/g, " ") ||
            ""
        );

        if (cellContents.length === 0) continue;

        result.push(`| ${cellContents.join(" | ")} |`);

        if (
          !headerProcessed &&
          (row.querySelector("th") || result.length === 1)
        ) {
          result.push(`| ${cells.map(() => "---").join(" | ")} |`);
          headerProcessed = true;
        }
      }

      return `\n\n${result.join("\n")}\n\n`;
    },
  });

  return turndown;
}

// ============================================================================
// Post-Processing Patterns
// ============================================================================

/** Lines that should be filtered from markdown output */
const NOISE_LINE_PATTERNS = [
  // UI elements and actions
  /^#{1,6}\s*(Close|Collapse|Expand|Copy|Share|More|Menu)$/i,

  // Cookie/consent text
  /^(OK,?\s*Got it\.?|Accept|Decline|Learn more|Cookie|Cookies)$/i,
  /uses?\s+cookies?\s+(from|to)/i,
  /cookie\s+(policy|notice|consent|banner)/i,
  /we\s+use\s+cookies/i,
  /this\s+site\s+uses?\s+cookies/i,
  /by\s+continuing.*you\s+agree/i,
  /accept\s+(all\s+)?cookies/i,

  // Empty/broken markdown syntax
  /^\[?\s*\]?\s*$/,
  /^!\[\]\([^)]*\)$/,
  /^!!\[/,
  /^\[$/,
  /^\]$/,

  // Navigation/auth (standalone words)
  /^(Sign\s*(in|up|out)|Log\s*(in|out)|Register|Subscribe|Write|Search|Explore)$/i,
  /^(Skip\s+to\s+(content|main|search|navigation))$/i,
  /^(Open\s+in\s+app|Sitemap)$/i,
  /^(Read\s+more|See\s+(more|all|less)|View\s+(more|all))$/i,
  /^(Loading|Please\s+wait)\.{0,3}$/i,
  /^(Advertisement|Sponsored|Ad)s?$/i,
  /^Explore\s+topics$/i,

  // Navigation links in markdown format
  /^\[(Sign\s*(in|up|out)|Log\s*(in|out)|Register|Subscribe|Sitemap|Open\s+in\s+app)\]/i,

  // Skip links (various formats)
  /^[-*]?\s*\[(Skip|Jump)\s+to/i,
  /^Jump\s+to\s+(content|navigation)/i,

  // Orphaned link parts
  /^\]\(\/[^)]*\)$/,
  /^\]\(https?:\/\/[^)]*\)$/,
  /^\]\(\?source=[^)]*\)$/,
  /^\]\(#[^)]*\)$/,

  // Tag/topic links
  /^\[#?\w+\]\([^)]*\/(tag|topic)\/[^)]*\)$/,

  // Platform UI buttons
  /^\[(Follow|Clap|Save|Listen|Response\w*)\]/i,
  /^\[\d+\]$/,

  // Social sharing
  /^\[Share (on|to|via) \w+\]/i,
  /^\[(Tweet|Post|Pin|Share)\]/i,
  /^\[@\w+\]/,

  // Time/date metadata
  /^\d+\s*(min|minute|hour|hr|sec|second)s?\s*(read|ago)?$/i,
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{0,4}$/i,

  // Paywall/membership
  /^\[(Member(-| )only|Free|Premium|Pro|Upgrade)(\s*(story|article)?)?\]/i,

  // Broken link fragments
  /^\]\(\/(tag|category)\/[^)]*\)\[?$/,
  /^\]\(https?:\/\/[^)]*\)\[?$/,

  // Site navigation words (not content headings)
  /^(Podcast|Newsletter|Careers|About|Contact|Help|FAQ|Terms|Privacy|Policy|Guidelines)$/i,
  /^(Archive|Authors?|Contributors?|Editors?|Staff|Team|Masthead)$/i,

  // Share links that slip through
  /^\[Share via \w+\]/i,
  /^\[Share on \w+\]/i,

  // Documentation edit/source links
  /^\[Edit\]\(/i,
  /^\[View PDF\]/i,
  /^\[TeX Source\]/i,
  /^\[HTML \(experimental\)\]/i,

  // More auth/nav patterns
  /^\[Join\]/i,
  /^\[Create account\]/i,
  /^\[Get started\]/i,
  /^\[Try for free\]/i,
  /^\[Start free\]/i,

  // Video platform noise
  /^\d+:\d+(\s*\/\s*\d+:\d+)?$/,  // Timestamps like "0:00 / 3:33"
  /^Watch full video$/i,
  /^VIEW TICKETS$/i,
  /^\d+[KM]?\s+viewers?$/i,  // "5.2K viewers"
  /^Live$/i,

  // E-commerce noise
  /^Limited shipping/i,
  /^\[Merchbar\]/i,
  /^Add to cart$/i,
  /^Buy now$/i,
  /^In stock$/i,
  /^Out of stock$/i,

  // PDF/document viewers
  /^Download PDF$/i,
  /^Print$/i,
  /^Cite this$/i,

  // Social proof/stats
  /^\d+\s*(likes?|comments?|shares?|views?)$/i,
  /^\d+\s*(followers?|following)$/i,
];

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  for (const pattern of NOISE_LINE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }

  return isIconLigatureText(trimmed);
}

// ============================================================================
// Markdown Cleanup
// ============================================================================

/** Regex replacements for fixing broken markdown patterns */
const MARKDOWN_CLEANUP_PATTERNS: [RegExp, string][] = [
  // Fix concatenated links
  [/\]\(([^)]+)\)\s*\[([^\]]+)\]\(/g, "]($1)\n[$2]("],

  // Remove empty/orphaned markdown syntax
  [/\[\s*\]\([^)]*\)/g, ""],
  [/^\s*\]\([^)]+\)\s*$/gm, ""],
  [/^\s*\[[^\]]*\]\s*$/gm, ""],
  [/!!\[/g, "!["],
  [/^\s*[\[\]]\s*$/gm, ""],

  // Remove standalone URLs and query parameters
  [/^\s*https?:\/\/\S+\s*$/gm, ""],
  [/^\s*\?[a-zA-Z_]+=\S*$/gm, ""],

  // Remove tracking parameters from links
  [/(\([^)]*)\?utm_[^)]+\)/g, "$1)"],
  [/(\([^)]*)\?source=[^)]+\)/g, "$1)"],

  // Clean up empty/orphaned elements
  [/\(\s*\)/g, ""],
  [/^\s*!\s*$/gm, ""],
  [/^[-*]\s+!\s*$/gm, ""],
  [/^\s*-\s*$/gm, ""],

  // Normalize excessive whitespace
  [/\n{4,}/g, "\n\n\n"],
];

function cleanupMarkdown(markdown: string): string {
  // Filter noise lines
  const lines = markdown.split("\n");
  const filtered = lines.filter((line) => !line.trim() || !isNoiseLine(line));
  let result = filtered.join("\n");

  // Apply pattern-based cleanup
  for (const [pattern, replacement] of MARKDOWN_CLEANUP_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  return result;
}

function deduplicateHeadings(markdown: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  const seenHeadings = new Set<string>();

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const headingText = normalizeTextForComparison(headingMatch[2]);
      if (seenHeadings.has(headingText)) continue;
      seenHeadings.add(headingText);
    }
    result.push(line);
  }

  return result.join("\n");
}

// ============================================================================
// Public API
// ============================================================================

export interface ConvertOptions {
  /** Title to prepend as h1 if not already present */
  title?: string;
}

export function convertToMarkdown(
  html: string,
  options: ConvertOptions = {}
): string {
  const turndown = createTurndownService();
  let markdown = turndown.turndown(html);

  markdown = cleanupMarkdown(markdown);
  markdown = deduplicateHeadings(markdown);
  markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

  // Ensure only one h1 heading
  let h1Found = false;
  const lines = markdown.split("\n");
  markdown = lines
    .filter((line) => {
      if (/^#[^#]/.test(line) || line === "#") {
        if (h1Found) return false;
        h1Found = true;
      }
      return true;
    })
    .join("\n");

  // Prepend title if provided and not already present
  if (options.title) {
    const h1Match = markdown.match(/^#\s+(.+?)$/m);
    const titleNormalized = normalizeTextForComparison(options.title);
    const h1Normalized = h1Match
      ? normalizeTextForComparison(h1Match[1])
      : "";

    if (!h1Match || h1Normalized !== titleNormalized) {
      markdown = `# ${options.title}\n\n${markdown}`;
    }
  }

  return markdown;
}
