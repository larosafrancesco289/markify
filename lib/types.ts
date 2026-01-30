export interface ConversionResult {
  title: string;
  markdown: string;
  url: string;
  usedBrowser?: boolean;
}

export interface ConversionError {
  error: string;
  code: string;
}

export interface ExtractedContent {
  title: string;
  content: string;
}
