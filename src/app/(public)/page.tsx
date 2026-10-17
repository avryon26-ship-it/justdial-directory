import type { Metadata } from "next";
import { HomeView } from "@/components/public/HomeView";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} - ${siteConfig.tagline}` },
  description: `Search local businesses, shops and services across Tamil Nadu. Phone numbers, WhatsApp, timings and directions for doctors, restaurants, schools and more.`,
  alternates: { canonical: "/" },
  openGraph: { title: siteConfig.name, description: siteConfig.tagline, url: "/" },
};

export default function Home() {
  return <HomeView />;
}
