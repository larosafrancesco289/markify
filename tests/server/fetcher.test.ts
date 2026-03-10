import { describe, expect, test } from "bun:test";

import { BrowserError, fetchHtml } from "@/lib/server/fetcher";

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

  test("falls back to browser rendering when static HTML only contains a thin landing shell", async () => {
    const result = await fetchHtml("https://developer.chrome.com/blog/", {
      fetchImpl: async () =>
        new Response(
          `
            <html>
              <body>
                <main role="main" id="main-content" class="devsite-main-content">
                  <article class="devsite-article">
                    <div class="devsite-article-meta" role="navigation">
                      <a href="/">Chrome for Developers</a>
                      <a href="/blog">Blog</a>
                    </div>
                    <div class="devsite-article-body devsite-no-page-title">
                      <section class="devsite-landing-row">
                        <header class="devsite-landing-row-header">
                          <div class="devsite-landing-row-header-text">
                            <h2>Blog</h2>
                            <div class="devsite-landing-row-description">
                              Our latest news, updates, and stories for developers
                            </div>
                          </div>
                        </header>
                        <devsite-dynamic-content></devsite-dynamic-content>
                      </section>
                    </div>
                  </article>
                </main>
              </body>
            </html>
          `,
          {
            status: 200,
            headers: { "content-type": "text/html" },
          }
        ),
      browserFetch: async () =>
        "<html><body><main><article><h1>Blog</h1><p>Loaded articles from the browser.</p></article></main></body></html>",
    });

    expect(result.usedBrowser).toBe(true);
    expect(result.html).toContain("Loaded articles from the browser");
  });

  test("throws a browser error when thin static HTML still needs browser rendering", async () => {
    const resultPromise = fetchHtml("https://example.com/post", {
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

    await expect(resultPromise).rejects.toBeInstanceOf(BrowserError);
  });

  test("routes Kaggle URLs straight to the browser", async () => {
    let staticFetchCallCount = 0;
    let browserCallCount = 0;

    const result = await fetchHtml(
      "https://www.kaggle.com/competitions/deep-past-initiative-machine-translation/overview",
      {
        fetchImpl: async () => {
          staticFetchCallCount += 1;
          return new Response("<html><body>static</body></html>", {
            status: 200,
            headers: { "content-type": "text/html" },
          });
        },
        browserFetch: async () => {
          browserCallCount += 1;
          return "<html><body><article>browser</article></body></html>";
        },
        hasSubstantialContentImpl: () => true,
      }
    );

    expect(staticFetchCallCount).toBe(0);
    expect(browserCallCount).toBe(1);
    expect(result.usedBrowser).toBe(true);
  });

  test("does not misclassify unrelated hosts that only contain x.com", async () => {
    let staticFetchCallCount = 0;
    let browserCallCount = 0;

    const result = await fetchHtml("https://dropbox.com/s/example", {
      fetchImpl: async () => {
        staticFetchCallCount += 1;
        return new Response("<html><body><article>static</article></body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      },
      browserFetch: async () => {
        browserCallCount += 1;
        return "<html><body><article>browser</article></body></html>";
      },
      hasSubstantialContentImpl: () => true,
    });

    expect(staticFetchCallCount).toBe(1);
    expect(browserCallCount).toBe(0);
    expect(result.usedBrowser).toBe(false);
  });

  test("does not misclassify unrelated hosts that only contain twitter.com", async () => {
    let staticFetchCallCount = 0;
    let browserCallCount = 0;

    const result = await fetchHtml("https://nottwitter.com/post", {
      fetchImpl: async () => {
        staticFetchCallCount += 1;
        return new Response("<html><body><article>static</article></body></html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        });
      },
      browserFetch: async () => {
        browserCallCount += 1;
        return "<html><body><article>browser</article></body></html>";
      },
      hasSubstantialContentImpl: () => true,
    });

    expect(staticFetchCallCount).toBe(1);
    expect(browserCallCount).toBe(0);
    expect(result.usedBrowser).toBe(false);
  });
});
