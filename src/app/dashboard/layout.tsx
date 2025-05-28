"use client";

import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { UserRole, UserStatus } from "@prisma/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    role: UserRole;
    status: {
      status: UserStatus;
      lastActive: Date;
    } | null;
  };
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar stays fixed on the left */}
      <div className="fixed inset-y-0 left-0 z-40 w-64 hidden md:flex">
        <Sidebar user={user} />
      </div>

      {/* Main content now spans full width without left margin */}
      <div className="flex-1 flex flex-col">
        {/* Topbar fixed without left margin */}
        <div className="fixed top-0 left-0 right-0 z-30 h-16 bg-white shadow">
          <Topbar user={user} />
        </div>

        {/* Content without top padding */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 