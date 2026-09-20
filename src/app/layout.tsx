import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/use-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StreakPay — Build Your Streak. Unlock Your Rewards.",
    template: "%s | StreakPay",
  },
  description:
    "Complete daily activities, build consistency, explore virtual markets, and manage your rewards in one futuristic platform.",
  keywords: [
    "streak",
    "rewards",
    "trading",
    "fintech",
    "daily tasks",
    "virtual trading",
    "SPK",
    "STREAK AI",
  ],
  authors: [{ name: "StreakPay" }],
  creator: "StreakPay",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "StreakPay",
    title: "StreakPay — Build Your Streak. Unlock Your Rewards.",
    description:
      "Complete daily activities, build consistency, explore virtual markets, and manage your rewards in one futuristic platform.",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
