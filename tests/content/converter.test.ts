import { describe, expect, test } from "bun:test";

import { convertToMarkdown } from "@/lib/content/converter";

describe("convertToMarkdown", () => {
  test("resolves relative assets and keeps structured content", () => {
    const markdown = convertToMarkdown(
      `
        <article>
          <p>Read the <a href="/guide">guide</a>.</p>
          <figure>
            <img src="/images/diagram.png" alt="System diagram" />
          </figure>
          <pre><code class="language-ts">const answer = 42;</code></pre>
        </article>
      `,
      {
        title: "Guide",
        baseUrl: "https://example.com/docs/getting-started",
      }
    );

    expect(markdown).toContain("# Guide");
    expect(markdown).toContain("[guide](https://example.com/guide)");
    expect(markdown).toContain(
      "![System diagram](https://example.com/images/diagram.png)"
    );
    expect(markdown).toContain("```ts");
    expect(markdown).toContain("const answer = 42;");
  });
});
