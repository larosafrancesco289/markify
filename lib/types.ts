export interface ConversionResult {
  title: string;
  markdown: string;
  url: string;
}

export interface ConversionError {
  error: string;
  code: string;
}
