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

Markify is a Next.js 16 app that converts web pages to clean, LLM-friendly markdown. It uses the App Router with a single API endpoint.

### Conversion Pipeline

1. **Fetch** - `app/api/convert/route.ts` receives a URL, fetches the HTML with a 10s timeout
2. **Parse** - Uses jsdom to parse HTML, then Mozilla Readability to extract main content
3. **Sanitize** - `lib/sanitizer.ts` uses DOMPurify with a strict allowlist of HTML tags/attributes
4. **Convert** - `lib/converter.ts` uses Turndown with custom rules for code blocks, tables, and figures
5. **Normalize** - Unicode characters are converted to ASCII equivalents (smart quotes, dashes, etc.)

### Key Libraries

- **@mozilla/readability** - Extracts article content from HTML (like Firefox Reader View)
- **turndown** - HTML to Markdown conversion
- **isomorphic-dompurify** - HTML sanitization
- **jsdom** - Server-side DOM parsing (requires Node.js runtime, not Edge)

### Project Structure

- `app/page.tsx` - Single-page client component with URL input and markdown output
- `app/api/convert/route.ts` - POST endpoint for URL-to-markdown conversion
- `lib/converter.ts` - Turndown configuration with custom rules for noise removal
- `lib/sanitizer.ts` - HTML sanitization and Unicode normalization
- `lib/types.ts` - TypeScript interfaces for API responses

### Styling

Uses Tailwind CSS 4 with custom CSS variables for colors (`--ink`, `--paper`, `--accent`). Toast notifications via Sonner.
