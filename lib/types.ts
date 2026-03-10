export type ExtractionMethod = "readability" | "fallback";

export type ConversionErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_URL"
  | "URL_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "FETCH_FAILED"
  | "UNSUPPORTED_CONTENT"
  | "CONTENT_TOO_LARGE"
  | "BROWSER_ERROR"
  | "BROWSER_TIMEOUT"
  | "EXTRACTION_FAILED"
  | "INTERNAL_ERROR";

export interface ConversionResult {
  title: string;
  markdown: string;
  excerpt: string;
  url: string;
  usedBrowser: boolean;
  extractedBy: ExtractionMethod;
}

export interface ConversionError {
  error: string;
  code: ConversionErrorCode;
}

export interface ExtractedContent {
  title: string;
  content: string;
  excerpt: string;
  textLength: number;
  method: ExtractionMethod;
}

export interface FetchResult {
  html: string;
  usedBrowser: boolean;
}
