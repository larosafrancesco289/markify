import { ALL_NOISE_SELECTORS } from "./noise";
import type { ExtractedContent } from "./types";

function getTitle(doc: Document): string {
  // Try og:title first (usually the cleanest)
  const ogTitle = doc
    .querySelector('meta[property="og:title"]')
    ?.getAttribute("content")
    ?.trim();
  if (ogTitle) return ogTitle;

  // Try <title> element
  const title = doc.querySelector("title")?.textContent?.trim();
  if (title) return title;

  // Fall back to first h1
  const h1 = doc.querySelector("h1")?.textContent?.trim();
  if (h1) return h1;

  return "";
}

function removeNoiseElements(body: HTMLElement): void {
  for (const selector of ALL_NOISE_SELECTORS) {
    const elements = body.querySelectorAll(selector);
    for (const el of elements) {
      el.remove();
    }
  }
}

export function extractContent(doc: Document): ExtractedContent {
  const title = getTitle(doc);
  const body = doc.body?.cloneNode(true) as HTMLElement | undefined;

  if (!body) {
    return { title, content: "" };
  }

  removeNoiseElements(body);

  return { title, content: body.innerHTML };
}
