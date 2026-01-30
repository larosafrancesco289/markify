import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { z } from "zod";

import { convertToMarkdown } from "@/lib/converter";
import { extractContent } from "@/lib/extractor";
import { normalizeUnicode, sanitizeHtml } from "@/lib/sanitizer";
import { fetchHtml, BrowserError, BrowserTimeoutError } from "@/lib/fetcher";
import type { ConversionResult, ConversionError } from "@/lib/types";

export const runtime = "nodejs";

const urlSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

function errorResponse(
  error: string,
  code: string,
  status: number
): NextResponse<ConversionError> {
  return NextResponse.json({ error, code }, { status });
}

function getFetchErrorResponse(error: unknown): NextResponse<ConversionError> {
  if (error instanceof BrowserTimeoutError) {
    return errorResponse("Page took too long to render", "BROWSER_TIMEOUT", 504);
  }
  if (error instanceof BrowserError) {
    return errorResponse("Failed to render page", "BROWSER_ERROR", 502);
  }
  return errorResponse("Failed to fetch URL", "FETCH_FAILED", 502);
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ConversionResult | ConversionError>> {
  try {
    const body = await request.json();
    const parsed = urlSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Invalid URL provided", "INVALID_URL", 400);
    }

    const { url } = parsed.data;

    let fetchResult;
    try {
      fetchResult = await fetchHtml(url);
    } catch (error) {
      return getFetchErrorResponse(error);
    }

    const { html, usedBrowser } = fetchResult;
    const dom = new JSDOM(html, { url });
    const { title: rawTitle, content } = extractContent(dom.window.document);

    if (!content) {
      return errorResponse(
        "Could not extract content from the page",
        "EXTRACTION_FAILED",
        422
      );
    }

    const sanitizedHtml = sanitizeHtml(content);
    const title = rawTitle ? normalizeUnicode(rawTitle) : "";
    const markdown = normalizeUnicode(convertToMarkdown(sanitizedHtml, { title }));

    return NextResponse.json({ title, markdown, url, usedBrowser });
  } catch (error) {
    console.error("Conversion error:", error);
    return errorResponse("An unexpected error occurred", "INTERNAL_ERROR", 500);
  }
}
