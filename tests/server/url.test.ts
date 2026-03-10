import { describe, expect, test } from "bun:test";

import { validatePublicHttpUrl } from "@/lib/server/url";

describe("validatePublicHttpUrl", () => {
  test("accepts public http and https URLs", async () => {
    await expect(
      validatePublicHttpUrl("https://8.8.8.8/docs/article")
    ).resolves.toBeInstanceOf(URL);
  });

  test("rejects unsupported protocols", async () => {
    await expect(validatePublicHttpUrl("ftp://example.com")).rejects.toMatchObject(
      {
        code: "INVALID_URL",
      }
    );
  });

  test("rejects local and private addresses", async () => {
    await expect(validatePublicHttpUrl("http://127.0.0.1:3000")).rejects.toMatchObject(
      {
        code: "URL_NOT_ALLOWED",
      }
    );
  });

  test("rejects bracketed private IPv6 addresses", async () => {
    await expect(validatePublicHttpUrl("http://[::1]:3000")).rejects.toMatchObject(
      {
        code: "URL_NOT_ALLOWED",
      }
    );
  });
});
