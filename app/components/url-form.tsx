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
    label: "Reference",
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
  const displayMessage = validationMessage || errorMessage;

  return (
    <section className="space-y-8 lg:sticky lg:top-12">
      <h1 className="max-w-[16ch] text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink">
        Reader-grade markdown for the web.
      </h1>

      <form className="space-y-3" onSubmit={onSubmit}>
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
            aria-label="Page URL"
            className="w-full rounded-lg border border-ink/12 bg-paper-warm px-4 py-3.5 pr-10 font-mono text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/12 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {url ? (
            <button
              type="button"
              onClick={() => onUrlChange("")}
              disabled={isLoading}
              aria-label="Clear URL"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink disabled:opacity-40"
            >
              <svg
                width="14"
                height="14"
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

        {displayMessage ? (
          <p className="text-sm text-accent">{displayMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={!url.trim() || isLoading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3.5 text-sm font-semibold text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              <span>Converting...</span>
            </>
          ) : (
            <>
              <ConvertIcon />
              <span>Convert to Markdown</span>
            </>
          )}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_URLS.map((example) => (
          <button
            key={example.url}
            type="button"
            disabled={isLoading}
            onClick={() => onUrlChange(example.url)}
            className="rounded-full border border-ink/10 px-3 py-1.5 text-sm text-ink-soft transition hover:border-accent/30 hover:text-accent disabled:opacity-40"
          >
            {example.label}
          </button>
        ))}
      </div>
    </section>
  );
}
