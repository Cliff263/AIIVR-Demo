"use client";

import { useState } from 'react';
import { signOut } from "@/actions/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { User, Bell, Search, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';

interface SupervisorTopbarProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
    status?: {
      status: UserStatus;
      lastActive: Date;
    } | null;
  };
}

export default function SupervisorTopbar({ user }: SupervisorTopbarProps) {
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { socket } = useSocket(parseInt(user.id, 10), user.role);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/sign-in');
    } catch (err) {
      console.error('Sign out failed:', err);
      toast.error('Sign out failed', {
        description: 'Please try again',
      });
    }
  };

  if (!user) return null;

  return (
    <div className="fixed top-0 right-0 left-64 z-30 h-16 bg-blue-600 text-white shadow-md">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center flex-1">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-5 h-5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-blue-700 text-white placeholder-blue-200 border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 hover:bg-blue-700 rounded-lg text-blue-100 relative"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    No new notifications
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 hover:bg-blue-700 rounded-lg text-blue-100"
              title="Settings"
              aria-label="View settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Link
                    href="/supervisor/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Settings
                  </Link>
                  <Link
                    href="/supervisor/preferences"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Preferences
                  </Link>
                </div>
              </div>
            )}
          </div>
          <Link 
            href="/supervisor/profile" 
            className="flex items-center space-x-2 hover:bg-blue-700 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-100" />
            </div>
            <span className="text-sm font-medium text-blue-100 hidden md:inline">{user.name}</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-blue-700 rounded-lg text-blue-100 flex items-center gap-2"
            title="Sign Out"
            aria-label="Sign out of your account"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
} 