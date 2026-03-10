# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start development server (http://localhost:3000)
bun run build        # Production build
bun run lint         # Run ESLint
```

## Architecture

Markify is a Next.js 16 app that converts public web pages into cleaner, LLM-friendly markdown. It uses the App Router with two server endpoints:

- `POST /api/convert` for URL-to-markdown conversion
- `GET /api/health` for a lightweight health check

### Conversion Pipeline

1. **Validate + limit** - `app/api/convert/route.ts` validates the request, rate limits it, and blocks unsafe URLs
2. **Fetch** - `lib/server/fetcher.ts` performs a static fetch with retries and browser fallback when needed
3. **Extract** - `lib/content/extractor.ts` prefers Mozilla Readability and falls back to the best content container
4. **Sanitize** - `lib/content/sanitizer.ts` uses DOMPurify with a strict allowlist
5. **Convert** - `lib/content/converter.ts` uses Turndown with custom rules for code blocks, tables, figures, and absolute links
6. **Normalize** - Unicode punctuation is normalized to ASCII-friendly equivalents

### Key Libraries

- **@mozilla/readability** - Extracts article content from HTML (like Firefox Reader View)
- **turndown** - HTML to Markdown conversion
- **isomorphic-dompurify** - HTML sanitization
- **jsdom** - Server-side DOM parsing (requires Node.js runtime, not Edge)

### Project Structure

- `app/page.tsx` - Main page container and request flow
- `app/components/` - UI pieces for the input form, result panel, and icons
- `app/api/convert/route.ts` - Conversion endpoint
- `app/api/health/route.ts` - Health endpoint
- `lib/content/` - Extraction, sanitization, markdown conversion, and noise heuristics
- `lib/server/` - URL validation, rate limiting, fetch/browser logic, and orchestration
- `lib/types.ts` - Shared TypeScript contracts
- `tests/` - Regression coverage for content extraction, conversion, URL validation, fetch fallback, and rate limiting

### Styling

Uses Tailwind CSS 4 with custom CSS variables and `next/font/google` for Newsreader + JetBrains Mono. Toast notifications via Sonner.
