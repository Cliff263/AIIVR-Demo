import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import WebSocketProvider from "@/components/WebSocketProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AIIVR Demo",
  description: "AIIVR Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">
        <WebSocketProvider />
        {children}
      </body>
    </html>
  );
}
