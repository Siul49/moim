import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "MOIM — AI 캘린더 비서",
  description:
    "캘린더와 에브리타임 연동 한 번으로 모두의 빈 시간을 자동으로 찾아주는 스마트 스케줄러",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn(geistSans.variable, geistMono.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
