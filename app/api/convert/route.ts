import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { z } from "zod";

import { convertToMarkdown } from "@/lib/converter";
import { normalizeUnicode, sanitizeHtml } from "@/lib/sanitizer";
import { fetchHtml, BrowserError, BrowserTimeoutError } from "@/lib/fetcher";
import type { ConversionResult, ConversionError } from "@/lib/types";

// Force Node.js runtime (jsdom is not compatible with Edge)
export const runtime = "nodejs";

const urlSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ConversionResult | ConversionError>> {
  try {
    const body = await request.json();
    const parsed = urlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL provided", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    const { url } = parsed.data;

    let fetchResult;
    try {
      fetchResult = await fetchHtml(url);
    } catch (error) {
      if (error instanceof BrowserTimeoutError) {
        return NextResponse.json(
          { error: "Page took too long to render", code: "BROWSER_TIMEOUT" },
          { status: 504 }
        );
      }
      if (error instanceof BrowserError) {
        return NextResponse.json(
          { error: "Failed to render page", code: "BROWSER_ERROR" },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch URL", code: "FETCH_FAILED" },
        { status: 502 }
      );
    }

    const { html, usedBrowser } = fetchResult;

    // Parse with jsdom
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract main content with Readability
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article || !article.content) {
      return NextResponse.json(
        {
          error: "Could not extract readable content from the page",
          code: "EXTRACTION_FAILED",
        },
        { status: 422 }
      );
    }

    // Sanitize the extracted HTML
    const sanitizedHtml = sanitizeHtml(article.content);

    // Convert to Markdown
    let markdown = convertToMarkdown(sanitizedHtml);

    // Normalize unicode
    markdown = normalizeUnicode(markdown);

    // Add title as H1 if available
    const title = article.title ? normalizeUnicode(article.title.trim()) : "";
    if (title) {
      markdown = `# ${title}\n\n${markdown}`;
    }

    return NextResponse.json({
      title,
      markdown,
      url,
      usedBrowser,
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
