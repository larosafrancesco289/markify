import { describe, expect, test } from "bun:test";

import { fetchHtml } from "@/lib/server/fetcher";

describe("fetchHtml", () => {
  test("uses static HTML when it already contains enough content", async () => {
    let browserCallCount = 0;

    const result = await fetchHtml("https://example.com/post", {
      fetchImpl: async () =>
        new Response("<html><body><article>ready</article></body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      browserFetch: async () => {
        browserCallCount += 1;
        return "<html><body>browser</body></html>";
      },
      hasSubstantialContentImpl: () => true,
    });

    expect(result.usedBrowser).toBe(false);
    expect(browserCallCount).toBe(0);
    expect(result.html).toContain("ready");
  });

  test("falls back to browser rendering when the static fetch fails", async () => {
    const result = await fetchHtml("https://example.com/post", {
      fetchImpl: async () => {
        throw new TypeError("network failure");
      },
      browserFetch: async () =>
        "<html><body><article>browser</article></body></html>",
      hasSubstantialContentImpl: () => false,
    });

    expect(result.usedBrowser).toBe(true);
    expect(result.html).toContain("browser");
  });

  test("returns thin static HTML if browser rendering fails after fallback", async () => {
    const result = await fetchHtml("https://example.com/post", {
      fetchImpl: async () =>
        new Response("<html><body><main>thin static copy</main></body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      browserFetch: async () => {
        throw new Error("browser crashed");
      },
      hasSubstantialContentImpl: () => false,
    });

    expect(result.usedBrowser).toBe(false);
    expect(result.html).toContain("thin static copy");
  });
});
