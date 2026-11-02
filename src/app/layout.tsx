import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "노을상사 메신저 · 관리 시스템 데모",
  description: "유리 질감 UI의 사내 메신저와 주문·재고 관리 데모 (가상 데이터)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
