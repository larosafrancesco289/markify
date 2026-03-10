import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { convertPage, ExtractionError } from "@/lib/server/convert-page";
import { FetchError, BrowserError, BrowserTimeoutError } from "@/lib/server/fetcher";
import { logUnexpectedError } from "@/lib/server/logger";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { UrlValidationError, validatePublicHttpUrl } from "@/lib/server/url";
import type { ConversionError, ConversionResult } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema = z.object({
  url: z.string().trim().min(1, "A URL is required"),
});

const DEFAULT_HEADERS = {
  "Cache-Control": "no-store",
} as const;

class RequestBodyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestBodyError";
  }
}

function errorResponse(
  error: string,
  code: ConversionError["code"],
  status: number,
  headers?: HeadersInit
): NextResponse<ConversionError> {
  return NextResponse.json(
    { error, code },
    {
      status,
      headers: { ...DEFAULT_HEADERS, ...headers },
    }
  );
}

function getFetchErrorResponse(
  error: unknown,
  headers: HeadersInit
): NextResponse<ConversionError> {
  if (error instanceof BrowserTimeoutError) {
    return errorResponse(
      "Page took too long to render",
      "BROWSER_TIMEOUT",
      504,
      headers
    );
  }

  if (error instanceof BrowserError) {
    return errorResponse("Failed to render page", "BROWSER_ERROR", 502, headers);
  }

  if (error instanceof FetchError && error.code === "UNSUPPORTED_CONTENT") {
    return errorResponse(
      "The URL did not return an HTML page",
      "UNSUPPORTED_CONTENT",
      415,
      headers
    );
  }

  if (error instanceof FetchError && error.code === "CONTENT_TOO_LARGE") {
    return errorResponse(
      "The page is too large to convert safely",
      "CONTENT_TOO_LARGE",
      413,
      headers
    );
  }

  return errorResponse("Failed to fetch URL", "FETCH_FAILED", 502, headers);
}

async function parseRequestBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new RequestBodyError("Request body must be valid JSON");
  }
}

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstAddress = forwardedFor.split(",")[0]?.trim();

    if (firstAddress) {
      return firstAddress;
    }
  }

  return request.headers.get("x-real-ip")?.trim() || "anonymous";
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ConversionResult | ConversionError>> {
  const rateLimit = consumeRateLimit(getClientKey(request));
  const rateLimitHeaders = {
    "X-RateLimit-Limit": String(rateLimit.limit),
    "X-RateLimit-Remaining": String(rateLimit.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt / 1000)),
  };

  if (!rateLimit.allowed) {
    return errorResponse(
      "Too many conversion requests. Please try again shortly.",
      "RATE_LIMITED",
      429,
      rateLimitHeaders
    );
  }

  try {
    const body = await parseRequestBody(request);
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "A valid URL is required",
        "INVALID_REQUEST",
        400,
        rateLimitHeaders
      );
    }

    const validatedUrl = await validatePublicHttpUrl(parsed.data.url);
    const result = await convertPage(validatedUrl.toString());

    return NextResponse.json(result, {
      status: 200,
      headers: { ...DEFAULT_HEADERS, ...rateLimitHeaders },
    });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return errorResponse(
        error.message,
        "INVALID_REQUEST",
        400,
        rateLimitHeaders
      );
    }

    if (error instanceof UrlValidationError) {
      return errorResponse(
        error.message,
        error.code,
        error.code === "INVALID_URL" ? 400 : 403,
        rateLimitHeaders
      );
    }

    if (error instanceof ExtractionError) {
      return errorResponse(
        "Could not extract meaningful content from the page",
        "EXTRACTION_FAILED",
        422,
        rateLimitHeaders
      );
    }

    if (
      error instanceof FetchError ||
      error instanceof BrowserError ||
      error instanceof BrowserTimeoutError
    ) {
      return getFetchErrorResponse(error, rateLimitHeaders);
    }

    logUnexpectedError("Conversion failed", error, {
      route: "/api/convert",
    });

    return errorResponse(
      "An unexpected error occurred",
      "INTERNAL_ERROR",
      500,
      rateLimitHeaders
    );
  }
}
