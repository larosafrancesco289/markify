import { JSDOM } from "jsdom";

import { convertToMarkdown } from "@/lib/content/converter";
import { extractContent } from "@/lib/content/extractor";
import { normalizeUnicode, sanitizeHtml } from "@/lib/content/sanitizer";
import type { ConversionResult } from "@/lib/types";

import { serverConfig } from "./config";
import { fetchHtml } from "./fetcher";

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

export async function convertPage(url: string): Promise<ConversionResult> {
  const { html, usedBrowser } = await fetchHtml(url);
  const dom = new JSDOM(html, { url });
  const extractedContent = extractContent(dom.window.document);

  if (
    !extractedContent.content ||
    extractedContent.textLength < serverConfig.minExtractedTextLength
  ) {
    throw new ExtractionError("Could not extract meaningful page content");
  }

  const sanitizedHtml = sanitizeHtml(extractedContent.content);
  const normalizedTitle = normalizeUnicode(extractedContent.title || "");
  const markdown = normalizeUnicode(
    convertToMarkdown(sanitizedHtml, {
      title: normalizedTitle,
      baseUrl: url,
    })
  ).trim();

  if (!markdown) {
    throw new ExtractionError("Conversion produced empty markdown");
  }

  return {
    title: normalizedTitle,
    markdown,
    excerpt: normalizeUnicode(extractedContent.excerpt || ""),
    url,
    usedBrowser,
    extractedBy: extractedContent.method,
  };
}
