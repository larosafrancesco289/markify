import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { z } from "zod";
import { convertToMarkdown } from "@/lib/converter";
import { normalizeUnicode, sanitizeHtml } from "@/lib/sanitizer";
import type { ConversionResult, ConversionError } from "@/lib/types";

// Force Node.js runtime (jsdom is not compatible with Edge)
export const runtime = "nodejs";

const urlSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

const FETCH_TIMEOUT = 10000;

async function fetchWithTimeout(
  url: string,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Markify/1.0; +https://markify.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function isHtmlResponse(contentType: string | null): boolean {
  return Boolean(
    contentType?.includes("text/html") ||
      contentType?.includes("application/xhtml+xml")
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

    // Fetch the page
    let response: Response;
    try {
      response = await fetchWithTimeout(url, FETCH_TIMEOUT);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "Request timed out", code: "TIMEOUT" },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch URL", code: "FETCH_FAILED" },
        { status: 502 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
          code: "FETCH_FAILED",
        },
        { status: 502 }
      );
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!isHtmlResponse(contentType)) {
      return NextResponse.json(
        {
          error: `URL does not return HTML content (got: ${contentType || "unknown"})`,
          code: "NOT_HTML",
        },
        { status: 415 }
      );
    }

    // Get HTML content
    const html = await response.text();

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
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
