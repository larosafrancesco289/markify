import { Readability } from "@mozilla/readability";

import type { ExtractedContent } from "@/lib/types";

import {
  ALL_NOISE_SELECTORS,
  CONTENT_CANDIDATE_SELECTORS,
} from "./noise";

function getDocumentTitleCandidates(doc: Document): string[] {
  const candidates = [
    doc
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content")
      ?.trim(),
    doc.querySelector("title")?.textContent?.trim(),
    doc.querySelector("h1")?.textContent?.trim(),
  ];

  return candidates.filter((candidate): candidate is string => Boolean(candidate));
}

function getBestTitle(doc: Document, readabilityTitle?: string): string {
  const titleCandidates = [
    readabilityTitle?.trim(),
    ...getDocumentTitleCandidates(doc),
  ].filter((title): title is string => Boolean(title));

  return titleCandidates.find((title) => title.length > 0) ?? "";
}

function removeNoiseElements(root: ParentNode): void {
  for (const selector of ALL_NOISE_SELECTORS) {
    root.querySelectorAll(selector).forEach((element) => element.remove());
  }
}

function getTextLength(input: string): number {
  return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
}

function getCandidateScore(candidate: Element): number {
  const textLength = candidate.textContent?.replace(/\s+/g, " ").trim().length ?? 0;
  const paragraphCount = candidate.querySelectorAll("p").length;
  const headingCount = candidate.querySelectorAll("h1, h2, h3").length;

  return textLength + paragraphCount * 80 + headingCount * 20;
}

function getBestFallbackContainer(body: HTMLElement): HTMLElement {
  const candidates = CONTENT_CANDIDATE_SELECTORS.flatMap((selector) =>
    Array.from(body.querySelectorAll<HTMLElement>(selector))
  );

  if (candidates.length === 0) {
    return body;
  }

  return candidates.sort((left, right) => {
    return getCandidateScore(right) - getCandidateScore(left);
  })[0];
}

function extractWithReadability(doc: Document): ExtractedContent | null {
  const readableDoc = doc.cloneNode(true) as Document;

  if (readableDoc.body) {
    removeNoiseElements(readableDoc.body);
  }

  const article = new Readability(readableDoc).parse();

  if (!article?.content) {
    return null;
  }

  return {
    title: getBestTitle(doc, article.title ?? undefined),
    content: article.content,
    excerpt: article.excerpt?.trim() ?? "",
    textLength: article.textContent?.trim().length ?? getTextLength(article.content),
    method: "readability",
  };
}

function extractWithFallback(doc: Document): ExtractedContent {
  const title = getBestTitle(doc);
  const clonedBody = doc.body?.cloneNode(true) as HTMLElement | undefined;

  if (!clonedBody) {
    return {
      title,
      content: "",
      excerpt: "",
      textLength: 0,
      method: "fallback",
    };
  }

  removeNoiseElements(clonedBody);
  const contentRoot = getBestFallbackContainer(clonedBody);
  const textContent = contentRoot.textContent?.replace(/\s+/g, " ").trim() ?? "";

  return {
    title,
    content: contentRoot.innerHTML,
    excerpt: textContent.slice(0, 220),
    textLength: textContent.length,
    method: "fallback",
  };
}

function shouldPreferFallback(
  readabilityContent: ExtractedContent,
  fallbackContent: ExtractedContent
): boolean {
  if (fallbackContent.textLength === 0) {
    return false;
  }

  return (
    fallbackContent.textLength >= readabilityContent.textLength * 1.5 &&
    fallbackContent.textLength - readabilityContent.textLength >= 200
  );
}

export function extractContent(doc: Document): ExtractedContent {
  const fallbackContent = extractWithFallback(doc);
  const readabilityContent = extractWithReadability(doc);

  if (!readabilityContent) {
    return fallbackContent;
  }

  if (shouldPreferFallback(readabilityContent, fallbackContent)) {
    return fallbackContent;
  }

  return readabilityContent;
}
