import { describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";

import { extractContent } from "@/lib/content/extractor";

describe("extractContent", () => {
  test("prefers article content over surrounding page chrome", () => {
    const dom = new JSDOM(`
      <!doctype html>
      <html>
        <head>
          <title>Example Site</title>
          <meta property="og:title" content="How to Ship Better Markdown" />
        </head>
        <body>
          <header>
            <nav>
              <a href="/login">Sign in</a>
              <a href="/pricing">Pricing</a>
            </nav>
          </header>
          <article>
            <h1>How to Ship Better Markdown</h1>
            <p>This is the article we actually want.</p>
            <p>It has enough body text to be useful to a reader and a model.</p>
          </article>
          <aside>Related links and newsletter prompts</aside>
        </body>
      </html>
    `);

    const result = extractContent(dom.window.document);

    expect(result.title).toBe("How to Ship Better Markdown");
    expect(result.content).toContain("This is the article we actually want.");
    expect(result.content).not.toContain("Sign in");
    expect(result.textLength).toBeGreaterThan(40);
    expect(result.method).toBe("readability");
  });

  test("falls back to the richer container when readability only captures a short intro", () => {
    const dom = new JSDOM(`
      <!doctype html>
      <html>
        <head>
          <title>Next.js Docs: App Router</title>
        </head>
        <body>
          <main>
            <article>
              <h1>App Router</h1>
              <p>
                The App Router is a file-system based router that uses React's
                latest features.
              </p>
            </article>
            <section>
              <h2>Next Steps</h2>
              <p>Installation guidance with TypeScript and ESLint setup.</p>
              <p>Project structure overview for layouts, pages, and routing.</p>
              <p>Navigation patterns for linking and nested routes.</p>
              <p>Data fetching guidance for server and client components.</p>
            </section>
          </main>
        </body>
      </html>
    `);

    const result = extractContent(dom.window.document);

    expect(result.content).toContain("Next Steps");
    expect(result.content).toContain("Project structure overview");
    expect(result.textLength).toBeGreaterThan(200);
  });

  test("ignores a link-heavy shell wrapper when choosing fallback content", () => {
    const dom = new JSDOM(`
      <!doctype html>
      <html>
        <head>
          <title>Scholarships For Masters Studies in the UK</title>
          <meta
            property="og:title"
            content="Scholarships For Masters Studies in the UK"
          />
        </head>
        <body>
          <div id="content">
            <div class="network-links">
              <a href="https://www.iberdrola.com/">Iberdrola.com</a>
              <a href="https://www.spenergynetworks.co.uk/">
                SP Energy Networks
              </a>
              <a href="https://www.scottishpowerrenewables.com/">
                ScottishPower Renewables
              </a>
              <a href="https://www.manweb.co.uk/">Manweb</a>
              <a href="https://www.spmanweb.co.uk/">SP Manweb</a>
              <a href="https://www.spenergywholesale.co.uk/">
                SP Energy Wholesale
              </a>
            </div>
            <div role="main">
              <h1>Master Scholarship</h1>
              <p>Our applications for 2026-27 are now open.</p>
              <p>
                ScottishPower will provide scholarships for the 2026-2027
                academic year for postgraduate studies at universities in the
                United Kingdom.
              </p>
              <ul>
                <li>Electrical Engineering</li>
                <li>Mechanical Engineering</li>
                <li>Cyber Security</li>
                <li>Business Analytics</li>
              </ul>
              <p>
                Successful candidates receive funding support, mentoring, and a
                potential pathway into the wider energy industry.
              </p>
            </div>
          </div>
        </body>
      </html>
    `);

    const result = extractContent(dom.window.document);

    expect(result.content).toContain("Master Scholarship");
    expect(result.content).toContain("Successful candidates receive funding support");
    expect(result.content).not.toContain("Iberdrola.com");
    expect(result.excerpt).not.toContain("SP Energy Networks");
  });
});
