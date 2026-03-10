"use client";

import type { ConversionResult } from "@/lib/types";

import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LoadingSpinner,
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
      <section className="flex min-h-[28rem] flex-1 items-center justify-center rounded-xl border border-ink/10 p-8">
        <LoadingSpinner className="h-6 w-6 text-accent" />
      </section>
    );
  }

  if (!result) {
    return (
      <section className="flex min-h-[28rem] flex-1 items-center justify-center rounded-xl border border-dashed border-ink/12 p-8">
        <p className="text-sm text-ink-faint">Markdown output</p>
      </section>
    );
  }

  const lineCount = getLineCount(result.markdown);
  const charCount = result.markdown.length;

  return (
    <section className="animate-fade-up flex min-h-[28rem] flex-1 flex-col rounded-xl border border-ink/10 bg-white/30">
      <div className="border-b border-ink/8 px-5 py-4 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              {result.title || "Untitled"}
            </h2>
            {result.excerpt ? (
              <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                {result.excerpt}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <a
              href={result.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs text-ink-soft transition hover:text-accent"
            >
              <ExternalLinkIcon />
              <span>Source</span>
            </a>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs text-ink-soft transition hover:text-accent"
            >
              <CopyIcon />
              <span>Copy</span>
            </button>
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs text-paper transition hover:bg-accent"
            >
              <DownloadIcon />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-faint">
          <span>{result.usedBrowser ? "Browser render" : "Static fetch"}</span>
          <span>
            {result.extractedBy === "readability" ? "Readability" : "Fallback"}{" "}
            extract
          </span>
          <span>{formatNumber(lineCount)} lines</span>
          <span>{formatNumber(charCount)} chars</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-3 md:p-4">
        <div className="h-full overflow-auto rounded-lg bg-code-bg p-5">
          <pre className="font-mono text-sm leading-7 whitespace-pre-wrap break-words text-[#e8e0d4]">
            {result.markdown}
          </pre>
        </div>
      </div>
    </section>
  );
}
