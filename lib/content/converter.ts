import TurndownService from "turndown";

import {
  NOISE_TAGS,
  TURNDOWN_NOISE_SELECTORS,
  isIconLigatureText,
  normalizeTextForComparison,
} from "./noise";

export interface ConvertOptions {
  title?: string;
  baseUrl?: string;
}

function resolveUrl(value: string | null, baseUrl?: string): string {
  if (!value) {
    return "";
  }

  if (!baseUrl) {
    return value;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function createTurndownService(baseUrl?: string): TurndownService {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
  });

  turndown.remove(NOISE_TAGS as (keyof HTMLElementTagNameMap)[]);

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

  turndown.addRule("iconLigatureFilter", {
    filter: (node) => {
      if (node.nodeType !== 1) {
        return false;
      }

      const text = node.textContent?.trim() || "";
      return node.childNodes.length <= 1 && isIconLigatureText(text);
    },
    replacement: () => "",
  });

  turndown.addRule("emptyLinks", {
    filter: (node) => {
      if (node.nodeName !== "A") {
        return false;
      }

      const text = node.textContent?.trim() || "";
      return !text || isIconLigatureText(text);
    },
    replacement: () => "",
  });

  turndown.addRule("links", {
    filter: "a",
    replacement: (content, node) => {
      const anchor = node as HTMLAnchorElement;
      const href = resolveUrl(anchor.getAttribute("href"), baseUrl);
      const text = content.trim() || href;

      if (!href) {
        return text;
      }

      return `[${text}](${href})`;
    },
  });

  turndown.addRule("images", {
    filter: "img",
    replacement: (_content, node) => {
      const image = node as HTMLImageElement;
      const alt = image.getAttribute("alt")?.trim() || "";
      const src = resolveUrl(image.getAttribute("src"), baseUrl);

      if (!src) {
        return "";
      }

      return `![${alt}](${src})`;
    },
  });

  turndown.addRule("emptyImages", {
    filter: (node) => {
      if (node.nodeName !== "IMG") {
        return false;
      }

      const image = node as HTMLImageElement;
      const alt = image.getAttribute("alt")?.trim();

      if (alt) {
        return false;
      }

      const src = image.getAttribute("src") || "";
      return src.startsWith("data:") || src.includes("pixel") || src.includes("tracking");
    },
    replacement: () => "",
  });

  turndown.addRule("figure", {
    filter: "figure",
    replacement: (content, node) => {
      const figure = node as HTMLElement;
      const image = figure.querySelector("img");

      if (!image) {
        return `\n\n${content}\n\n`;
      }

      const figcaption = figure.querySelector("figcaption");
      const src = resolveUrl(image.getAttribute("src"), baseUrl);
      const alt = image.getAttribute("alt") || "";
      const caption = figcaption?.textContent?.trim() || alt;

      if (!src) {
        return caption ? `\n\n${caption}\n\n` : "";
      }

      return `\n\n![${caption}](${src})\n\n`;
    },
  });

  turndown.addRule("codeBlock", {
    filter: (node) =>
      node.nodeName === "PRE" && node.querySelector("code") !== null,
    replacement: (_content, node) => {
      const pre = node as HTMLElement;
      const codeElement = pre.querySelector("code");
      const className = codeElement?.className || "";
      const languageMatch = className.match(/(?:language-|lang-)(\w+)/);
      const language = languageMatch?.[1] || "";
      const code = codeElement?.textContent || pre.textContent || "";

      return `\n\n\`\`\`${language}\n${code.trim()}\n\`\`\`\n\n`;
    },
  });

  turndown.addRule("inlineCode", {
    filter: (node) =>
      node.nodeName === "CODE" && node.parentNode?.nodeName !== "PRE",
    replacement: (content) => {
      if (!content.trim()) {
        return "";
      }

      return `\`${content.replace(/`/g, "\\`")}\``;
    },
  });

  turndown.addRule("table", {
    filter: "table",
    replacement: (_content, node) => {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.querySelectorAll("tr"));

      if (rows.length === 0) {
        return "";
      }

      const result: string[] = [];
      let headerProcessed = false;

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll("th, td"));
        const cellContents = cells.map(
          (cell) =>
            cell.textContent?.trim().replace(/\|/g, "\\|").replace(/\n/g, " ") ||
            ""
        );

        if (cellContents.every((cellContent) => !cellContent)) {
          continue;
        }

        result.push(`| ${cellContents.join(" | ")} |`);

        if (!headerProcessed && (row.querySelector("th") || result.length === 1)) {
          result.push(`| ${cells.map(() => "---").join(" | ")} |`);
          headerProcessed = true;
        }
      }

      return result.length > 0 ? `\n\n${result.join("\n")}\n\n` : "";
    },
  });

  return turndown;
}

const NOISE_LINE_PATTERNS = [
  /^#{1,6}\s*(Close|Collapse|Expand|Copy|Share|More|Menu)$/i,
  /^(OK,?\s*Got it\.?|Accept|Decline|Learn more|Cookie|Cookies)$/i,
  /uses?\s+cookies?\s+(from|to)/i,
  /cookie\s+(policy|notice|consent|banner)/i,
  /we\s+use\s+cookies/i,
  /this\s+site\s+uses?\s+cookies/i,
  /by\s+continuing.*you\s+agree/i,
  /accept\s+(all\s+)?cookies/i,
  /^\[?\s*\]?\s*$/,
  /^!\[\]\([^)]*\)$/,
  /^!!\[/,
  /^\[$/,
  /^\]$/,
  /^(Sign\s*(in|up|out)|Log\s*(in|out)|Register|Subscribe|Write|Search|Explore)$/i,
  /^(Skip\s+to\s+(content|main|search|navigation))$/i,
  /^(Open\s+in\s+app|Sitemap)$/i,
  /^(Read\s+more|See\s+(more|all|less)|View\s+(more|all))$/i,
  /^(Loading|Please\s+wait)\.{0,3}$/i,
  /^(Advertisement|Sponsored|Ad)s?$/i,
  /^Explore\s+topics$/i,
  /^\[(Sign\s*(in|up|out)|Log\s*(in|out)|Register|Subscribe|Sitemap|Open\s+in\s+app)\]/i,
  /^[-*]?\s*\[(Skip|Jump)\s+to/i,
  /^Jump\s+to\s+(content|navigation)/i,
  /^\]\(\/[^)]*\)$/,
  /^\]\(https?:\/\/[^)]*\)$/,
  /^\]\(\?source=[^)]*\)$/,
  /^\]\(#[^)]*\)$/,
  /^\[#?\w+\]\([^)]*\/(tag|topic)\/[^)]*\)$/,
  /^\[(Follow|Clap|Save|Listen|Response\w*)\]/i,
  /^\[\d+\]$/,
  /^\[Share (on|to|via) \w+\]/i,
  /^\[(Tweet|Post|Pin|Share)\]/i,
  /^\[@\w+\]/,
  /^\d+\s*(min|minute|hour|hr|sec|second)s?\s*(read|ago)?$/i,
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s*\d{0,4}$/i,
  /^\[(Member(-| )only|Free|Premium|Pro|Upgrade)(\s*(story|article)?)?\]/i,
  /^\]\(\/(tag|category)\/[^)]*\)\[?$/,
  /^\]\(https?:\/\/[^)]*\)\[?$/,
  /^(Podcast|Newsletter|Careers|About|Contact|Help|FAQ|Terms|Privacy|Policy|Guidelines)$/i,
  /^(Archive|Authors?|Contributors?|Editors?|Staff|Team|Masthead)$/i,
  /^\[Share via \w+\]/i,
  /^\[Share on \w+\]/i,
  /^\[Edit\]\(/i,
  /^\[View PDF\]/i,
  /^\[TeX Source\]/i,
  /^\[HTML \(experimental\)\]/i,
  /^\[Join\]/i,
  /^\[Create account\]/i,
  /^\[Get started\]/i,
  /^\[Try for free\]/i,
  /^\[Start free\]/i,
  /^\d+:\d+(\s*\/\s*\d+:\d+)?$/,
  /^Watch full video$/i,
  /^VIEW TICKETS$/i,
  /^\d+[KM]?\s+viewers?$/i,
  /^Live$/i,
  /^Limited shipping/i,
  /^\[Merchbar\]/i,
  /^Add to cart$/i,
  /^Buy now$/i,
  /^In stock$/i,
  /^Out of stock$/i,
  /^Download PDF$/i,
  /^Print$/i,
  /^Cite this$/i,
  /^\d+\s*(likes?|comments?|shares?|views?)$/i,
  /^\d+\s*(followers?|following)$/i,
];

const MARKDOWN_CLEANUP_PATTERNS: Array<[RegExp, string]> = [
  [/\]\(([^)]+)\)\s*\[([^\]]+)\]\(/g, "]($1)\n[$2]("],
  [/\[\s*\]\([^)]*\)/g, ""],
  [/^\s*\]\([^)]+\)\s*$/gm, ""],
  [/^\s*\[[^\]]*\]\s*$/gm, ""],
  [/!!\[/g, "!["],
  [/^\s*[\[\]]\s*$/gm, ""],
  [/(\([^)]*)\?utm_[^)]+\)/g, "$1)"],
  [/(\([^)]*)\?source=[^)]+\)/g, "$1)"],
  [/\(\s*\)/g, ""],
  [/^\s*!\s*$/gm, ""],
  [/^[-*]\s+!\s*$/gm, ""],
  [/^\s*-\s*$/gm, ""],
  [/\n{4,}/g, "\n\n\n"],
];

function isNoiseLine(line: string): boolean {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return false;
  }

  return (
    NOISE_LINE_PATTERNS.some((pattern) => pattern.test(trimmedLine)) ||
    isIconLigatureText(trimmedLine)
  );
}

function cleanupMarkdown(markdown: string): string {
  const filteredLines = markdown
    .split("\n")
    .filter((line) => !line.trim() || !isNoiseLine(line));

  return MARKDOWN_CLEANUP_PATTERNS.reduce((text, [pattern, replacement]) => {
    return text.replace(pattern, replacement);
  }, filteredLines.join("\n"));
}

function prependTitleHeading(markdown: string, title?: string): string {
  if (!title) {
    return markdown;
  }

  const firstHeadingMatch = markdown.match(/^#\s+(.+)$/m);
  const normalizedTitle = normalizeTextForComparison(title);
  const normalizedFirstHeading = firstHeadingMatch
    ? normalizeTextForComparison(firstHeadingMatch[1])
    : "";

  if (normalizedFirstHeading === normalizedTitle) {
    return markdown;
  }

  return `# ${title}\n\n${markdown}`.trim();
}

export function convertToMarkdown(
  html: string,
  options: ConvertOptions = {}
): string {
  const turndown = createTurndownService(options.baseUrl);
  const markdown = cleanupMarkdown(turndown.turndown(html))
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return prependTitleHeading(markdown, options.title);
}
