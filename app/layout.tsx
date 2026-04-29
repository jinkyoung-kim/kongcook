// 작업일: 2026-04-28
// 앱 루트 레이아웃

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kongcook — 나만의 레시피 저장소",
  description: "유튜브, SNS, 레시피 앱에서 발견한 레시피를 한 곳에 모아보세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${geistSans.variable}`}>
      <body className="bg-stone-50 min-h-screen font-sans antialiased">
        <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">🍳</span>
            <a href="/" className="font-bold text-stone-800 text-lg tracking-tight hover:text-orange-600 transition-colors">
              Kongcook
            </a>
            <span className="text-stone-400 text-sm ml-1">나만의 레시피 모음</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
