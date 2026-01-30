# Markify

A web application that converts any webpage into clean, LLM-friendly markdown. Built with Next.js 16.

## Features

- Converts web pages to markdown optimized for large language models
- Handles JavaScript-rendered content through headless browser automation
- Removes navigation, ads, cookie banners, and other noise
- Normalizes Unicode characters to ASCII equivalents
- Preserves code blocks, tables, and semantic structure

## Installation

```bash
# Install dependencies
bun install

# Install Playwright browsers (required for JS-heavy sites)
bunx playwright install firefox chromium
```

## Usage

### Development Server

```bash
bun run dev
```

Open http://localhost:3000 in your browser. Enter a URL and click "Convert" to generate markdown.

### Production Build

```bash
bun run build
bun run start
```

### API Endpoint

**POST** `/api/convert`

Request body:

```json
{
  "url": "https://example.com/article"
}
```

Response:

```json
{
  "title": "Article Title",
  "markdown": "# Article Title\n\nContent here...",
  "url": "https://example.com/article",
  "usedBrowser": false
}
```

#### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_URL` | 400 | URL format invalid or missing |
| `EXTRACTION_FAILED` | 422 | No content could be extracted |
| `BROWSER_ERROR` | 502 | Browser rendering failed |
| `BROWSER_TIMEOUT` | 504 | Page took too long to render |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Architecture

### Conversion Pipeline

```
URL → Fetch HTML → Extract Content → Sanitize → Convert → Normalize
```

1. **Fetch**: Retrieves HTML with a 10-second timeout. Falls back to headless browser for JavaScript-heavy sites.
2. **Extract**: Parses HTML with jsdom, removes noise elements, and extracts the page title.
3. **Sanitize**: Applies DOMPurify with a strict allowlist of HTML tags and attributes.
4. **Convert**: Transforms HTML to markdown using Turndown with custom rules for code blocks, tables, and figures.
5. **Normalize**: Converts Unicode characters (smart quotes, em dashes) to ASCII equivalents.

### Browser Automation

The application uses Playwright to render JavaScript-heavy sites. Browser rendering activates for:

- Single-page applications (React, Next.js, Vue)
- Platforms that require JavaScript: Medium, Substack, LinkedIn, Twitter, Reddit, YouTube
- Pages where static fetch returns insufficient content

Browser sessions run with resource blocking (images, fonts, media) and automatic cookie consent dismissal.

### Noise Removal

Two filtering systems remove unwanted content:

1. **CSS Selectors** (160+ patterns): Navigation, ads, social widgets, comment sections, modals, icons, related content
2. **Regex Patterns** (269 patterns): UI buttons, cookie notices, "Sign in" links, share prompts, reading time metadata

## Project Structure

```
app/
├── page.tsx              # Main UI component
├── layout.tsx            # Root layout with metadata
├── globals.css           # Tailwind styles and CSS variables
└── api/
    └── convert/
        └── route.ts      # POST endpoint for conversion

lib/
├── browser.ts            # Playwright configuration and management
├── converter.ts          # Turndown rules and post-processing
├── extractor.ts          # Title detection and content extraction
├── fetcher.ts            # Dual-mode HTML fetching
├── noise.ts              # CSS selectors for noise removal
├── sanitizer.ts          # DOMPurify config and Unicode normalization
├── types.ts              # TypeScript interfaces
└── utils.ts              # Class name utilities
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `@mozilla/readability` | Article content extraction (Firefox Reader View algorithm) |
| `playwright` | Headless browser automation for JS-rendered pages |
| `turndown` | HTML to markdown conversion |
| `isomorphic-dompurify` | HTML sanitization |
| `jsdom` | Server-side DOM parsing |
| `zod` | Request validation |

## Configuration

### Timeouts

| Operation | Duration |
|-----------|----------|
| Static fetch | 10 seconds |
| Browser navigation | 25 seconds |
| Network idle wait | 20 seconds |
| Total browser timeout | 45 seconds |
| JS render delay | 2.5 seconds |

### Browser Limits

- Maximum concurrent contexts: 3
- Blocked resources: images, fonts, video, audio

## Runtime Requirements

This application requires Node.js runtime and cannot run on Edge or serverless environments. The dependencies jsdom, Readability, and Playwright require a full Node.js environment.

## Development

```bash
# Run linter
bun run lint
```

## License

MIT
