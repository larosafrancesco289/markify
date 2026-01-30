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

function handleFetchError(error: unknown): NextResponse<ConversionError> {
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

    const fetchResult = await fetchHtml(url).catch(handleFetchError);
    if (fetchResult instanceof NextResponse) {
      return fetchResult;
    }

    const { html, usedBrowser } = fetchResult;

    const dom = new JSDOM(html, { url });
    const { title: rawTitle, content } = extractContent(dom.window.document);

    if (!content) {
      return NextResponse.json(
        {
          error: "Could not extract content from the page",
          code: "EXTRACTION_FAILED",
        },
        { status: 422 }
      );
    }

    const sanitizedHtml = sanitizeHtml(content);
    const title = rawTitle ? normalizeUnicode(rawTitle) : "";
    const markdown = normalizeUnicode(
      convertToMarkdown(sanitizedHtml, { title })
    );

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
