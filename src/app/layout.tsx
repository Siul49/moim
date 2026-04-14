import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
