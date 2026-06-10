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
  description: "Find jobs and hire talent.",
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
        {/* Google tag (gtag.js) */}
        <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=AW-18225694903" />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18225694903');
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
