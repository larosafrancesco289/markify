import { describe, expect, test } from "bun:test";

import { consumeRateLimit } from "@/lib/server/rate-limit";

describe("consumeRateLimit", () => {
  test("blocks requests once the window limit is exceeded", () => {
    const key = `test-${Date.now()}`;
    const now = Date.now();

    let latestResult = consumeRateLimit(key, now);

    for (let index = 1; index < 20; index += 1) {
      latestResult = consumeRateLimit(key, now);
    }

    const blockedResult = consumeRateLimit(key, now);

    expect(latestResult.allowed).toBe(true);
    expect(blockedResult.allowed).toBe(false);
    expect(blockedResult.remaining).toBe(0);
  });
});
