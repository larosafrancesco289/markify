# Markify

Markify turns public web pages into cleaner, LLM-friendly markdown.

It fetches the page, extracts the main readable content, strips common UI noise, sanitizes the HTML, and converts the result into copy-ready markdown. When a static fetch is weak or incomplete, it can fall back to Playwright for a browser-rendered pass.

## Why it exists

- Web pages are noisy. Markdown for LLMs should not include nav, cookie banners, promos, or broken fragments.
- Static scraping is cheap but unreliable. Some pages need a real browser pass.
- A small tool like this still needs guardrails: URL validation, rate limiting, health checks, and regression tests.

## Quick start

```bash
bun install
bunx playwright install firefox chromium
cp .env.example .env.local
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
bun run dev
bun run lint
bun run test
bun run build
bun run check
```

`bun run check` runs lint, tests, and the production build.

## API

### `POST /api/convert`

Request:

```json
{
  "url": "https://example.com/article"
}
```

Successful response:

```json
{
  "title": "Article Title",
  "markdown": "# Article Title\n\nContent here...",
  "excerpt": "A short summary of the extracted article...",
  "url": "https://example.com/article",
  "usedBrowser": false,
  "extractedBy": "readability"
}
```

### `GET /api/health`

Returns:

```json
{
  "status": "ok"
}
```

### Error codes

| Code | Status | Meaning |
| --- | --- | --- |
| `INVALID_REQUEST` | 400 | Request body is malformed or missing a URL |
| `INVALID_URL` | 400 | URL format or protocol is invalid |
| `URL_NOT_ALLOWED` | 403 | Local, private-network, or credentialed URLs are blocked |
| `RATE_LIMITED` | 429 | Too many conversion requests in the current window |
| `UNSUPPORTED_CONTENT` | 415 | The URL did not return HTML |
| `CONTENT_TOO_LARGE` | 413 | The page exceeded the configured processing limit |
| `EXTRACTION_FAILED` | 422 | Meaningful content could not be extracted |
| `FETCH_FAILED` | 502 | Upstream fetch failed |
| `BROWSER_ERROR` | 502 | Browser rendering failed |
| `BROWSER_TIMEOUT` | 504 | Browser rendering timed out |
| `INTERNAL_ERROR` | 500 | Unexpected failure |

## Architecture

### Pipeline

```text
URL -> validate -> rate limit -> fetch -> extract -> sanitize -> convert -> normalize
```

### Server flow

1. `app/api/convert/route.ts` validates the request, applies rate limiting, blocks unsafe URLs, and returns a typed response.
2. `lib/server/fetcher.ts` tries a static fetch first, retries transient failures, and falls back to Playwright if needed.
3. `lib/content/extractor.ts` prefers Mozilla Readability, then falls back to a best-content-container heuristic.
4. `lib/content/sanitizer.ts` runs DOMPurify and normalizes Unicode punctuation.
5. `lib/content/converter.ts` converts the cleaned HTML to markdown with custom rules for code blocks, tables, figures, and absolute links.

### Project layout

```text
app/
  api/
    convert/route.ts
    health/route.ts
  components/
    icons.tsx
    result-panel.tsx
    url-form.tsx
  globals.css
  layout.tsx
  page.tsx

lib/
  content/
    converter.ts
    extractor.ts
    noise.ts
    sanitizer.ts
  server/
    browser.ts
    config.ts
    convert-page.ts
    fetcher.ts
    logger.ts
    rate-limit.ts
    url.ts
  types.ts

tests/
  content/
  server/
```

## Configuration

Markify is usable with no environment variables, but the server behavior can be tuned through `.env.local`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MARKIFY_STATIC_FETCH_TIMEOUT_MS` | `10000` | Timeout for the first-pass static fetch |
| `MARKIFY_MAX_HTML_BYTES` | `2000000` | Maximum HTML payload size accepted for conversion |
| `MARKIFY_MIN_EXTRACTED_TEXT_LENGTH` | `180` | Minimum text size considered meaningful content |
| `MARKIFY_RATE_LIMIT_WINDOW_MS` | `60000` | Rate-limit window length |
| `MARKIFY_RATE_LIMIT_MAX_REQUESTS` | `20` | Requests allowed per rate-limit window |
| `MARKIFY_BROWSER_CONCURRENCY` | `3` | Maximum concurrent Playwright contexts |
| `MARKIFY_BROWSER_NAVIGATION_TIMEOUT_MS` | `25000` | Browser navigation timeout |
| `MARKIFY_BROWSER_NETWORK_IDLE_TIMEOUT_MS` | `20000` | Wait for network idle before extraction |
| `MARKIFY_BROWSER_TOTAL_TIMEOUT_MS` | `45000` | Overall page timeout for browser-based extraction |
| `MARKIFY_BROWSER_CONTENT_WAIT_TIMEOUT_MS` | `8000` | How long to wait for likely content selectors |
| `MARKIFY_BROWSER_RENDER_DELAY_MS` | `2500` | Additional delay for client-side rendering/hydration |
| `MARKIFY_FETCH_RETRY_COUNT` | `2` | Number of static fetch attempts for transient failures |

## Security and resilience

- Only public `http` and `https` URLs are accepted.
- Localhost, private-network, link-local, and credentialed URLs are blocked to reduce SSRF risk.
- Requests are rate limited in memory.
- Static fetches use timeouts and size limits.
- Browser extraction blocks heavy assets such as fonts, media, and images where possible.

## Testing

The test suite focuses on real failure modes:

- article extraction over full-body noise
- markdown conversion of relative links and code blocks
- URL safety validation
- static fetch and browser fallback behavior
- in-memory rate limiting

Run everything with:

```bash
bun run check
```

## License

MIT
