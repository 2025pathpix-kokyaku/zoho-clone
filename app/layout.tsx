import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zoho Clone CRM",
  description: "Custom CRM System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          {/* 左側：サイドバー (固定幅) */}
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          
          {/* 右側：メインエリア */}
          {/* min-w-0 が重要です。これがないとテーブルが画面を突き破ります */}
          <main className="flex-1 min-w-0 bg-slate-50 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}