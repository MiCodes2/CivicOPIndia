import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupabaseProvider from "@/components/providers/SupabaseProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivicOp - Civic Operations of India | Real-Time Governance Dashboard",
  description: "Join India's leading civic engagement platform. Track protests, file RTI, report issues, and participate in AI-powered governance. Future: AI verification, predictive analytics, municipal APIs. Building transparent democracy through technology.",
  keywords: ["civic engagement", "India", "protests", "RTI", "governance", "transparency", "AI", "democracy", "citizen rights", "municipal dashboard", "civic operations"],
  authors: [{ name: "CivicOp Team" }],
  creator: "CivicOp",
  publisher: "Civic Opposition of India",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://civicopindia.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "CivicOp - Civic Operations of India",
    description: "Real-time civic governance dashboard. Track protests, file RTI, report issues. AI-powered verification, predictive analytics, municipal APIs coming in 2026.",
    url: "https://civicopindia.com",
    siteName: "CivicOp",
    images: [
      {
        url: "/og-image.jpg", // You'll need to create this
        width: 1200,
        height: 630,
        alt: "CivicOp - Civic Operations of India",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicOp - Civic Operations of India",
    description: "Real-time civic governance dashboard. AI-powered verification, predictive analytics, municipal APIs.",
    images: ["/og-image.jpg"],
    creator: "@CivicOp_india",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      "/favicon.ico",
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <Navbar />
          {children}
          <Footer />
        </SupabaseProvider>
      </body>
    </html>
  );
}
