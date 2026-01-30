import TurndownService from "turndown";

const NOISE_TAGS: (keyof HTMLElementTagNameMap)[] = [
  "nav",
  "header",
  "footer",
  "aside",
  "script",
  "style",
  "noscript",
  "iframe",
  "form",
];

const NOISE_SELECTORS = [
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
];

export function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
    strongDelimiter: "**",
    linkStyle: "inlined",
  });

  // Remove noise tags
  turndown.remove(NOISE_TAGS);

  // Remove elements matching CSS selectors
  turndown.addRule("noiseSelectors", {
    filter: (node) => {
      const element = node as Element;
      return NOISE_SELECTORS.some((selector) => {
        try {
          return element.matches?.(selector);
        } catch {
          return false;
        }
      });
    },
    replacement: () => "",
  });

  // Custom rule for figures with captions
  turndown.addRule("figure", {
    filter: "figure",
    replacement: (content, node) => {
      const figcaption = (node as HTMLElement).querySelector("figcaption");
      const img = (node as HTMLElement).querySelector("img");

      if (img) {
        const alt = img.getAttribute("alt") || "";
        const src = img.getAttribute("src") || "";
        const caption = figcaption?.textContent?.trim() || alt;
        return `\n\n![${caption}](${src})\n\n`;
      }

      return `\n\n${content}\n\n`;
    },
  });

  // Custom rule for code blocks with language detection
  turndown.addRule("codeBlock", {
    filter: (node) => {
      return node.nodeName === "PRE" && node.querySelector("code") !== null;
    },
    replacement: (_content, node) => {
      const codeElement = (node as HTMLElement).querySelector("code");
      const className = codeElement?.className || "";
      const langMatch = className.match(/(?:language-|lang-)(\w+)/);
      const lang = langMatch ? langMatch[1] : "";
      const code = codeElement?.textContent || (node as HTMLElement).textContent || "";

      return `\n\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n\n`;
    },
  });

  // Custom rule for inline code
  turndown.addRule("inlineCode", {
    filter: (node) => {
      return (
        node.nodeName === "CODE" &&
        node.parentNode?.nodeName !== "PRE"
      );
    },
    replacement: (content) => {
      if (!content.trim()) return "";
      // Escape backticks inside code
      const escaped = content.replace(/`/g, "\\`");
      return `\`${escaped}\``;
    },
  });

  // Custom rule for tables
  turndown.addRule("table", {
    filter: "table",
    replacement: (content, node) => {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.querySelectorAll("tr"));

      if (rows.length === 0) return "";

      const result: string[] = [];
      let headerProcessed = false;

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll("th, td"));
        const cellContents = cells.map((cell) =>
          cell.textContent?.trim().replace(/\|/g, "\\|").replace(/\n/g, " ") || ""
        );

        if (cellContents.length === 0) continue;

        result.push(`| ${cellContents.join(" | ")} |`);

        // Add separator after header row
        if (!headerProcessed && (row.querySelector("th") || result.length === 1)) {
          result.push(`| ${cells.map(() => "---").join(" | ")} |`);
          headerProcessed = true;
        }
      }

      return `\n\n${result.join("\n")}\n\n`;
    },
  });

  return turndown;
}

export function convertToMarkdown(html: string): string {
  const turndown = createTurndownService();
  const markdown = turndown.turndown(html);

  // Clean up excessive whitespace and trim
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}
