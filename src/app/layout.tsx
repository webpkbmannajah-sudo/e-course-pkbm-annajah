import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/components/Toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PKBM An-Najah - Solusi pendidikan kesetaraan di Fakfak",
  description: "PKBM An-Najah memberikan solusi pendidikan kesetaraan Paket A, B, dan C di Fakfak dengan pembelajaran fleksibel.",
  keywords: [
    "PKBM An-Najah",
    "pendidikan kesetaraan",
    "sekolah kesetaraan",
    "Fakfak",
    "Paket A",
    "Paket B",
    "Paket C",
    "setara SD",
    "setara SMP",
    "setara SMA",
    "ijazah kesetaraan",
    "belajar online",
    "ujian online"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
