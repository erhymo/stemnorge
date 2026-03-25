import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "StemNorge",
  description: "Les ukens sak, ta stilling og stem anonymt når avstemningen er åpen.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://stemnorge.no"),
  openGraph: {
    title: "StemNorge",
    description: "Ukentlig folkestemme, presentert ryddig",
    siteName: "StemNorge",
    locale: "nb_NO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StemNorge",
    description: "Ukentlig folkestemme, presentert ryddig",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <Header />
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
