import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentSession } from "@/actions/auth";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";
import type { AgentStatus } from "@prisma/client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AIIVR Demo",
  description: "AIIVR Demo Application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await getCurrentSession();

  // Get user's status information if user is logged in
  let transformedUser = null;
  if (user) {
    const userWithStatus = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        statusInfo: true,
      }
    });

    // Transform user data to match Navbar component's expected type
    transformedUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      status: userWithStatus?.statusInfo ? {
        status: userWithStatus.statusInfo.status as AgentStatus,
        pauseReason: userWithStatus.statusInfo.pauseReason?.toString(),
      } : null,
    };
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        {transformedUser && <Navbar user={transformedUser} />}
        <main className={transformedUser ? "pt-16 min-h-screen" : "min-h-screen"}>
          {children}
        </main>
      </body>
    </html>
  );
}
