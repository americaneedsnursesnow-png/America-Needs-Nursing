import type { Metadata } from "next";
import { Inter } from "next/font/google";

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
    icon: "/logo/ANN.png",
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
          <Providers>
          <ConditionalAppShell>{children}</ConditionalAppShell>
        </Providers>
        
      </body>
    </html>
  );
}
