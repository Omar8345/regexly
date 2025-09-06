import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regexly",
  description:
    "Paste text, test regex instantly. Highlight matches in real-time.",
  icons: {
    icon: [{ url: "/favicon.svg" }],
  },
  other: {
    "google-site-verification": "MH-JVemEsRUFQ7P643QmnRHRJwLTigwJ7amgqZp5Kpk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  );
}
