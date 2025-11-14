// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated Next.js root layout:
//   - Root HTML structure with metadata
//   - Google Fonts integration (Geist, Geist Mono)
//   - Dark mode configuration
//   - ClientBody wrapper for global components
//   - Global CSS imports
// Author review: Code reviewed, tested, and validated by team.

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PeerPrep",
  description: "Master coding interviews with peer-to-peer collaboration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body suppressHydrationWarning className="antialiased min-h-screen">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
