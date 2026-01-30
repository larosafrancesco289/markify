import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Markify — URL to Markdown",
  description: "Convert any webpage to clean, LLM-friendly markdown",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--ink)",
              color: "var(--paper)",
              border: "none",
              fontFamily: "'Newsreader', Georgia, serif",
            },
          }}
        />
      </body>
    </html>
  );
}
