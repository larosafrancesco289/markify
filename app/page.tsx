"use client";

import { startTransition, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ResultPanel } from "@/app/components/result-panel";
import { UrlForm } from "@/app/components/url-form";
import type { ConversionError, ConversionResult } from "@/lib/types";

function getUrlValidationMessage(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(trimmedValue);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "Use an http or https URL.";
    }

    if (
      parsedUrl.hostname === "localhost" ||
      parsedUrl.hostname.endsWith(".local")
    ) {
      return "Local and private-network URLs are blocked for safety.";
    }

    return null;
  } catch {
    return "Enter a complete URL, including https://";
  }
}

function toDownloadFileName(title: string): string {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${normalized || "markify-export"}.md`;
}

async function parseApiResponse<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as T;
}

function getErrorMessage(error: ConversionError | null): string {
  if (!error) {
    return "Conversion failed. Please try again.";
  }

  switch (error.code) {
    case "RATE_LIMITED":
      return "You’ve hit the conversion limit for this minute. Please wait a moment and try again.";
    case "UNSUPPORTED_CONTENT":
      return "That URL does not look like an HTML page, so there is nothing to convert.";
    case "CONTENT_TOO_LARGE":
      return "That page is unusually large. Try a more focused article or documentation page.";
    case "EXTRACTION_FAILED":
      return "Markify could not isolate meaningful content on that page.";
    case "URL_NOT_ALLOWED":
      return "For safety, Markify only fetches public URLs.";
    default:
      return error.error;
  }
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validationMessage = useMemo(() => getUrlValidationMessage(url), [url]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedUrl = url.trim();

      if (!trimmedUrl) {
        return;
      }

      if (validationMessage) {
        setErrorMessage(validationMessage);
        toast.error(validationMessage);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setResult(null);

      try {
        const response = await fetch("/api/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedUrl }),
        });

        const payload = await parseApiResponse<ConversionResult | ConversionError>(
          response
        );

        if (!response.ok) {
          const nextErrorMessage = getErrorMessage(
            (payload as ConversionError | null) ?? null
          );
          throw new Error(nextErrorMessage);
        }

        startTransition(() => {
          setResult(payload as ConversionResult);
        });

        toast.success("Markdown is ready");
      } catch (error) {
        const nextErrorMessage =
          error instanceof Error ? error.message : "An unexpected error occurred";

        startTransition(() => {
          setErrorMessage(nextErrorMessage);
        });
        toast.error(nextErrorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [url, validationMessage]
  );

  const handleCopy = useCallback(async () => {
    if (!result?.markdown) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.markdown);
      toast.success("Markdown copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }, [result?.markdown]);

  const handleDownload = useCallback(() => {
    if (!result?.markdown) {
      return;
    }

    const blob = new Blob([result.markdown], { type: "text/markdown" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = toDownloadFileName(result.title);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    toast.success("Markdown downloaded");
  }, [result]);

  return (
    <main className="min-h-screen px-5 py-8 md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-ink/8 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-soft">
            Markify
          </p>
          <p className="hidden text-sm italic text-ink-faint sm:block">
            web &rarr; markdown
          </p>
        </header>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[24rem_1fr] lg:gap-14">
          <UrlForm
            url={url}
            isLoading={isLoading}
            validationMessage={validationMessage}
            errorMessage={errorMessage}
            onSubmit={handleSubmit}
            onUrlChange={(nextUrl) => {
              setUrl(nextUrl);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
          />
          <ResultPanel
            result={result}
            isLoading={isLoading}
            onCopy={handleCopy}
            onDownload={handleDownload}
          />
        </div>

      </div>
    </main>
  );
}
