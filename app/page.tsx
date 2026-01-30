"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { ConversionResult } from "@/lib/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!url.trim()) return;

      setIsLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Conversion failed");
        }

        setResult(data);
        toast.success("Converted successfully");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    [url]
  );

  const handleCopy = useCallback(async () => {
    if (!result?.markdown) return;
    try {
      await navigator.clipboard.writeText(result.markdown);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }, [result?.markdown]);

  const handleDownload = useCallback(() => {
    if (!result?.markdown) return;
    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${result.title || "converted"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success("Downloaded");
  }, [result]);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-ink/10 py-6 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex items-baseline justify-between stagger-children">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Markify
          </h1>
          <p className="text-ink-light text-sm hidden sm:block">
            URL → Markdown
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Input Section */}
        <section className="lg:w-[400px] xl:w-[480px] p-6 md:p-12 border-b lg:border-b-0 lg:border-r border-ink/10 flex flex-col">
          <div className="stagger-children">
            <h2 className="text-xl font-semibold mb-2">Paste a URL</h2>
            <p className="text-ink-light text-sm mb-6 leading-relaxed">
              Enter any webpage URL and get clean, LLM-friendly markdown. Works
              with articles, documentation, blog posts, and more.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-4 py-3 bg-paper-dark border border-ink/20 rounded-sm
                         font-mono text-sm placeholder:text-ink-faint
                         focus:outline-none focus:border-ink/40 focus:ring-1 focus:ring-ink/20
                         transition-all duration-200"
                disabled={isLoading}
              />
              {url && !isLoading && (
                <button
                  type="button"
                  onClick={() => setUrl("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors"
                  aria-label="Clear URL"
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
              )}
            </div>

            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className="w-full py-3 bg-accent text-paper font-semibold rounded-sm
                       hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center justify-center gap-2"
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

          {error && (
            <div className="mt-6 p-4 bg-accent/10 border border-accent/30 rounded-sm animate-fade-in">
              <p className="text-accent text-sm">{error}</p>
            </div>
          )}

          {/* Tips section */}
          <div className="mt-auto pt-8 hidden lg:block">
            <div className="border-t border-ink/10 pt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-3">
                Tips
              </h3>
              <ul className="text-sm text-ink-light space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">→</span>
                  Works best with article pages
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">→</span>
                  Removes navigation and ads
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">→</span>
                  Preserves code blocks
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Output Section */}
        <section className="flex-1 flex flex-col min-h-[400px] lg:min-h-0">
          {!result && !isLoading && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center text-ink-faint stagger-children">
                <div className="w-16 h-16 mx-auto mb-4 opacity-30">
                  <MarkdownIcon />
                </div>
                <p className="text-lg">Your markdown will appear here</p>
                <p className="text-sm mt-1">Paste a URL and click convert</p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center animate-pulse-ink">
                <div className="w-12 h-12 mx-auto mb-4">
                  <LoadingSpinner className="w-12 h-12" />
                </div>
                <p className="text-ink-light">Fetching and converting...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="flex-1 flex flex-col animate-fade-in">
              {/* Output toolbar */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-ink/10 bg-paper-dark/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    Output
                  </span>
                  {result.title && (
                    <span className="text-sm text-ink-light truncate max-w-[200px] md:max-w-[400px]">
                      {result.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-ink-light
                             hover:text-ink hover:bg-paper-dark rounded-sm transition-all duration-200"
                    title="Copy to clipboard"
                  >
                    <CopyIcon />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-ink-light
                             hover:text-ink hover:bg-paper-dark rounded-sm transition-all duration-200"
                    title="Download as .md"
                  >
                    <DownloadIcon />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              </div>

              {/* Markdown output */}
              <div className="flex-1 overflow-auto p-6 md:p-8">
                <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-ink-light">
                  {result.markdown}
                </pre>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-ink/10 py-4 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-ink-faint">
          <span>Clean markdown for LLMs</span>
          <span>Built with Readability + Turndown</span>
        </div>
      </footer>
    </main>
  );
}

function LoadingSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ConvertIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function MarkdownIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <path d="M8 12h48c2.2 0 4 1.8 4 4v32c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4zm6 28V24h6l6 8 6-8h6v16h-6v-9l-6 8-6-8v9h-6zm36-8l-8 8v-6h-4v-4h4v-6l8 8z" />
    </svg>
  );
}
