import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentSession } from "@/actions/auth";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { prisma } from "@/lib/prisma";
import type { UserStatus } from "@prisma/client";
import { Toaster } from "@/components/ui/toaster"

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
      where: { id: user.id }
    });

    // Transform user data to match Sidebar component's expected type
    transformedUser = {
      id: user.id,
      name: user.name,
      role: user.role,
      status: userWithStatus ? {
        status: userWithStatus.status as UserStatus,
        lastActive: userWithStatus.updatedAt,
      } : null,
    };
  }

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        {transformedUser && (
          <>
            <Sidebar />
            <Topbar user={transformedUser} />
          </>
        )}
        <main className={transformedUser ? "ml-64 pt-16 min-h-screen" : "min-h-screen"}>
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
