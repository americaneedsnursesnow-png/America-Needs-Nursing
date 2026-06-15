import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

import { ConditionalAppShell } from "@/components/layout";
import { Providers } from "@/components/providers";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "America Needs Nurses",
    template: "%s | America Needs Nurses",
  },
  description:
    "America Needs Nurses connects registered nurses, LPNs, CNAs, and nurse practitioners with top healthcare employers across the United States. Browse nursing jobs, build your profile, and advance your healthcare career.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://americaneedsnursing.com",
  ),
  icons: {
    icon: [{ url: "/favicon/favicon-ann.jpeg", type: "image/jpeg" }],
    shortcut: [{ url: "/favicon/favicon-ann.jpeg", type: "image/jpeg" }],
    apple: "/logo/ANN.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} min-h-screen bg-white`}>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {/*
          Google tags — gtag.js library is loaded ONCE, all three properties
          are configured in the single inline script below.

            AW-18225694903  →  Google Ads Manager
            G-MKYR7F0ZZ2    →  Google Analytics / Search Console
            AW-18234303891  →  Second Google Ads property

          Loading the gtag.js <script> file multiple times (once per ID) is a
          pattern Google's automated scanner flags as script injection / site
          compromise. The correct approach is one <script src> + one inline
          gtag('config') call per property — all three IDs are still tracked.
        */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18225694903"
        />
        <Script
          id="google-tags-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18225694903');
              gtag('config', 'G-MKYR7F0ZZ2');
              gtag('config', 'AW-18234303891');
            `,
          }}
        />

        <Providers>
          <ConditionalAppShell>{children}</ConditionalAppShell>
        </Providers>
      </body>
    </html>
  );
}
