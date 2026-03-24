import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Payedge — Interactive Payment Flow Simulator",
  description: "Interactive payment flow simulator",
  icons: {
    icon: ["/edge 1.png?v=4"],
    shortcut: ["/edge 1.png"],
  },

  generator: "Next.js",
  openGraph: {
    title: "Payedge — Interactive Payment Flow Simulator",
    description:
      "interactive simulator for modelling real-world payment flows across success, failure, and recovery states. Implemented a state machine-driven architecture to handle scenarios like retries, card declines, idempotency collisions, and partial failures.",
    url: "https://payedge-omega.vercel.app/",
    siteName: "Payedge",
    images: [
      {
        url: "https://github.com/Fred-omojole/payedge/blob/master/assets/payedge%20cover.png?raw=true",
        width: 1200,
        height: 630,
        alt: "Payedge — Interactive Payment Flow Simulator",
      },
    ],
    locale: "en-US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Payedge — Interactive Payment Flow Simulator",
    description:
      "interactive simulator for modelling real-world payment flows across success, failure, and recovery states. Implemented a state machine-driven architecture to handle scenarios like retries, card declines, idempotency collisions, and partial failures.",
    creator: "Freddy's Space — Frontend Engineer",
    creatorId: "omoyele60762",
    images: [
      "https://github.com/Fred-omojole/payedge/blob/master/assets/payedge%20cover.png?raw=true",
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "fintech",
  keywords: [
    "fintech",
    "payment systems",
    "developer tools",
    "simulation",
    "state machines",
    "frontend systems",
    "system design",
    "interactive UI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
