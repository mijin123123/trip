import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TripStore - 당신의 특별한 여행 파트너",
  description: "전 세계의 특별한 여행 상품을 TripStore에서 만나보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* 클라이언트 컴포넌트는 별도 파일로 분리 */}
        <ClientLayout>
          {children}
        </ClientLayout>
        <div id="root-portal" />
      </body>
    </html>
  );
}
