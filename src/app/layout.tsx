import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { CSSProperties } from "react";
import { siteConfig } from "@/config/site";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${siteConfig.name} - ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.tagline,
  openGraph: { siteName: siteConfig.name, type: "website", locale: "en_IN" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: siteConfig.accent };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} style={{ "--accent": siteConfig.accent } as CSSProperties}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
