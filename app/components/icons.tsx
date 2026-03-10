import type { JSX } from "react";

interface IconProps {
  className?: string;
}

const STROKE_ICON_PROPS = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function LoadingSpinner({
  className = "h-4 w-4",
}: IconProps): JSX.Element {
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

export function ConvertIcon(): JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...STROKE_ICON_PROPS}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

export function CopyIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...STROKE_ICON_PROPS}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function DownloadIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...STROKE_ICON_PROPS}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function MarkdownIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor">
      <path d="M8 12h48c2.2 0 4 1.8 4 4v32c0 2.2-1.8 4-4 4H8c-2.2 0-4-1.8-4-4V16c0-2.2 1.8-4 4-4zm6 28V24h6l6 8 6-8h6v16h-6v-9l-6 8-6-8v9h-6zm36-8l-8 8v-6h-4v-4h4v-6l8 8z" />
    </svg>
  );
}

export function ExternalLinkIcon(): JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" {...STROKE_ICON_PROPS}>
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4" />
    </svg>
  );
}
