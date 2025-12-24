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
        {/* 
           flex-col md:flex-row: スマホは縦積み、PCは横並び
           h-screen: 画面いっぱいの高さ
        */}
        <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-slate-50">
          
          {/* サイドバー (中身でレスポンシブ制御) */}
          <Sidebar />
          
          {/* 
             メインエリア 
             pt-16: スマホ用ヘッダーの高さ分だけ下げる
             md:pt-0: PCでは下げない
          */}
          <main className="flex-1 min-w-0 overflow-auto pt-16 md:pt-0 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}