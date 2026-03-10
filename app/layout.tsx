import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Markify | Reader-grade URL to Markdown",
  description:
    "Convert public web pages into clean, LLM-friendly markdown with browser fallback and safer fetch controls.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${newsreader.variable} ${jetBrainsMono.variable} antialiased`}
      >
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--ink)",
              color: "var(--paper)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "var(--font-serif)",
            },
          }}
        />
      </body>
    </html>
  );
}
