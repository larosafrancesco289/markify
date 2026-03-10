"use client";

import type { FormEventHandler } from "react";

import { ConvertIcon, LoadingSpinner } from "./icons";

const EXAMPLE_URLS = [
  {
    label: "Docs page",
    url: "https://nextjs.org/docs/app",
  },
  {
    label: "Blog post",
    url: "https://developer.chrome.com/blog/",
  },
  {
    label: "Reference article",
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
  },
] as const;

interface UrlFormProps {
  url: string;
  isLoading: boolean;
  validationMessage: string | null;
  errorMessage: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onUrlChange: (nextUrl: string) => void;
}

export function UrlForm({
  url,
  isLoading,
  validationMessage,
  errorMessage,
  onSubmit,
  onUrlChange,
}: UrlFormProps) {
  return (
    <section className="flex w-full max-w-[28rem] flex-col gap-8 rounded-[2rem] border border-white/55 bg-white/75 p-6 shadow-[0_32px_80px_rgba(35,29,24,0.14)] backdrop-blur md:p-8">
      <div className="space-y-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-ink/5 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.24em] text-ink-soft">
          URL to Markdown
        </div>
        <div className="space-y-3">
          <h1 className="max-w-[16ch] text-4xl font-semibold tracking-[-0.04em] text-ink md:text-5xl">
            Reader-grade markdown for the web.
          </h1>
          <p className="max-w-xl text-base leading-7 text-ink-soft">
            Paste any public article, blog post, or documentation page and get
            clean markdown with fewer nav scraps, cookie banners, and broken
            links.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="space-y-2 text-sm font-medium text-ink" htmlFor="url">
          <span>Page URL</span>
          <div className="relative">
            <input
              id="url"
              type="url"
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="https://example.com/article"
              autoComplete="url"
              spellCheck={false}
              disabled={isLoading}
              className="w-full rounded-2xl border border-ink/12 bg-paper px-4 py-4 pr-12 font-mono text-sm text-ink shadow-inner shadow-white/60 outline-none transition focus:border-accent/60 focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {url ? (
              <button
                type="button"
                onClick={() => onUrlChange("")}
                disabled={isLoading}
                aria-label="Clear URL"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink disabled:opacity-40"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            ) : null}
          </div>
        </label>

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-4 text-sm font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-accent disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-ink/40"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Converting page...</span>
            </>
          ) : (
            <>
              <ConvertIcon />
              <span>Convert to Markdown</span>
            </>
          )}
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-ink-soft">
          <span>Validation</span>
          <span>{url.trim() ? "Ready to fetch" : "Waiting for URL"}</span>
        </div>
        <p
          className={`min-h-6 text-sm ${
            validationMessage || errorMessage ? "text-accent" : "text-ink-soft"
          }`}
        >
          {validationMessage || errorMessage || "Only public http and https URLs are accepted."}
        </p>
      </div>

      <div className="space-y-3 rounded-[1.5rem] border border-ink/10 bg-paper/80 p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-ink-soft">
          Try an example
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_URLS.map((example) => (
            <button
              key={example.url}
              type="button"
              disabled={isLoading}
              onClick={() => onUrlChange(example.url)}
              className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm text-ink transition hover:border-accent/30 hover:text-accent disabled:opacity-40"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-[1.5rem] border border-ink/10 bg-ink/[0.03] p-4 text-sm text-ink-soft md:grid-cols-3">
        <p>Readability-first extraction with a smarter fallback.</p>
        <p>Browser rendering only when static HTML is weak or incomplete.</p>
        <p>Safer fetching with rate limits and blocked local-network targets.</p>
      </div>
    </section>
  );
}
