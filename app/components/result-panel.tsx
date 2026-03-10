"use client";

import type { ConversionResult } from "@/lib/types";

import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LoadingSpinner,
  MarkdownIcon,
} from "./icons";

interface ResultPanelProps {
  result: ConversionResult | null;
  isLoading: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB").format(value);
}

function getLineCount(markdown: string): number {
  return markdown.split("\n").length;
}

export function ResultPanel({
  result,
  isLoading,
  onCopy,
  onDownload,
}: ResultPanelProps) {
  if (isLoading) {
    return (
      <section className="flex min-h-[32rem] flex-1 items-center justify-center rounded-[2rem] border border-white/55 bg-white/75 p-8 shadow-[0_32px_80px_rgba(35,29,24,0.14)] backdrop-blur">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
            <LoadingSpinner className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
            Building your markdown
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-soft">
            Fetching the page, stripping UI noise, and converting the main
            content into a cleaner markdown document.
          </p>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="flex min-h-[32rem] flex-1 items-center justify-center rounded-[2rem] border border-dashed border-ink/20 bg-white/60 p-8 shadow-[0_32px_80px_rgba(35,29,24,0.1)] backdrop-blur">
        <div className="max-w-md text-center text-ink-soft">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-ink/5 text-ink/40">
            <div className="h-8 w-8">
              <MarkdownIcon />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
            Output appears here
          </h2>
          <p className="mt-3 text-sm leading-6">
            You’ll get a copy-ready markdown document, plus a quick read on
            whether Markify used static HTML or a browser-rendered pass.
          </p>
        </div>
      </section>
    );
  }

  const lineCount = getLineCount(result.markdown);
  const charCount = result.markdown.length;

  return (
    <section className="flex min-h-[32rem] flex-1 flex-col rounded-[2rem] border border-white/55 bg-white/75 shadow-[0_32px_80px_rgba(35,29,24,0.14)] backdrop-blur">
      <div className="border-b border-ink/10 px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-ink-soft">
              <span className="rounded-full border border-ink/10 bg-ink/5 px-3 py-1">
                {result.usedBrowser ? "Browser render" : "Static fetch"}
              </span>
              <span className="rounded-full border border-ink/10 bg-ink/5 px-3 py-1">
                {result.extractedBy === "readability"
                  ? "Readability extract"
                  : "Fallback extract"}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-ink">
                {result.title || "Untitled conversion"}
              </h2>
              {result.excerpt ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">
                  {result.excerpt}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink transition hover:border-accent/30 hover:text-accent"
            >
              <ExternalLinkIcon />
              <span>Open source</span>
            </a>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink transition hover:border-accent/30 hover:text-accent"
            >
              <CopyIcon />
              <span>Copy</span>
            </button>
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper transition hover:bg-accent"
            >
              <DownloadIcon />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-6 text-sm text-ink-soft">
          <p>{formatNumber(lineCount)} lines</p>
          <p>{formatNumber(charCount)} characters</p>
          <p className="truncate">Source: {result.url}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4 md:p-6">
        <div className="h-full overflow-auto rounded-[1.5rem] border border-ink/10 bg-ink px-5 py-5 shadow-inner shadow-black/10">
          <pre className="font-mono text-sm leading-7 whitespace-pre-wrap break-words text-paper">
            {result.markdown}
          </pre>
        </div>
      </div>
    </section>
  );
}
