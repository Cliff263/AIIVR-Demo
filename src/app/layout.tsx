import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { prisma } from "@/lib/prisma";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AIIVR Demo",
  description: "AIIVR Demo Application",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getCurrentSession();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get user's status information
  const userWithStatus = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      status: true,
      supervisedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      agents: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
        }
      }
    }
  });

  if (!userWithStatus) {
    redirect('/auth/sign-in');
  }

  // Transform user data to match Navbar component's expected type
  const transformedUser = {
    id: userWithStatus.id,
    name: userWithStatus.name,
    email: userWithStatus.email,
    role: userWithStatus.role,
    createdAt: userWithStatus.createdAt,
    updatedAt: userWithStatus.updatedAt,
    supervisorId: userWithStatus.supervisorId,
    status: userWithStatus.status ? {
      status: userWithStatus.status.status,
      pauseReason: userWithStatus.status.pauseReason?.toString(),
    } : null,
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar user={transformedUser} />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
