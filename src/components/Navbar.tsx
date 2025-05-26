"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { AgentStatus, UserRole, PauseReason } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
    status: {
      status: AgentStatus;
      pauseReason?: string | null;
    } | null;
  };
}

// Status colors
const getStatusColor = (status: AgentStatus) => {
  switch (status) {
    case 'ONLINE':
      return 'bg-success-500';
    case 'PAUSED':
      return 'bg-warning-500';
    case 'OFFLINE':
    default:
      return 'bg-secondary-400';
  }
};

const getStatusTextColor = (status: AgentStatus) => {
  switch (status) {
    case 'ONLINE':
      return 'text-success-700';
    case 'PAUSED':
      return 'text-warning-700';
    case 'OFFLINE':
    default:
      return 'text-secondary-600';
  }
};

const getStatusBgColor = (status: AgentStatus) => {
  switch (status) {
    case 'ONLINE':
      return 'bg-success-50 hover:bg-success-100';
    case 'PAUSED':
      return 'bg-warning-50 hover:bg-warning-100';
    case 'OFFLINE':
    default:
      return 'bg-secondary-50 hover:bg-secondary-100';
  }
};

// Pause reasons (must match Prisma enum PauseReason)
const pauseReasons = [
  { value: PauseReason.LUNCH, label: 'Lunch' },
  { value: PauseReason.BATHROOM, label: 'Bathroom' },
  { value: PauseReason.SMOKE, label: 'Smoke' },
  { value: PauseReason.ON_LEAVE, label: 'On Leave' },
  { value: PauseReason.CASE_WORK, label: 'Case Work' },
  // Add other reasons from schema if needed
];

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Derive userId and role, ensuring they are valid before useSocket
  const userId = user?.id ? parseInt(user.id, 10) : 0; // Default to 0 if user or user.id is null/undefined
  const userRole = user?.role || 'AGENT'; // Default role if user is null/undefined, adjust as needed

  const [status, setStatus] = useState<AgentStatus>(user?.status?.status || 'OFFLINE');
  const [pauseReason, setPauseReason] = useState<string | null>(user?.status?.pauseReason || null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);

  // useSocket hook is called unconditionally, but handles invalid userId internally
  const { socket, emitStatusChange } = useSocket(userId, userRole);

  // Handle initial status - only emit if socket is connected and user is an agent
  useEffect(() => {
    if (user?.role === 'AGENT' && status === 'OFFLINE' && socket && socket.connected && userId > 0) {
      emitStatusChange('ONLINE');
    }
  }, [user?.role, status, emitStatusChange, socket, userId]); // Added userId to dependency array

  // Handle socket updates - only listen if socket is available
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { status: AgentStatus; pauseReason?: string }) => {
      console.log('Navbar received status update:', data);
      setStatus(data.status);
      setPauseReason(data.pauseReason || null);
    };

    // Listen for status updates
    socket.on('agent-status-update', handleStatusUpdate);

    return () => {
      socket.off('agent-status-update', handleStatusUpdate);
    };
  }, [socket]);

  const updateStatus = (newStatus: AgentStatus, reason?: string) => {
     // Only attempt to emit if socket is connected and userId is valid
    if (socket && socket.connected && userId > 0) {
      console.log('Navbar updating status:', { newStatus, reason });
      emitStatusChange(newStatus, reason);
      setStatus(newStatus);
      setPauseReason(reason || null);
      setIsStatusMenuOpen(false);
      setIsPauseModalOpen(false);
    } else {
      console.warn('Navbar: Socket not connected or userId invalid, cannot update status.');
    }
  };

  const handleSignOut = async () => {
     // Only attempt to sign out if user is available
    if(user) {
       await signOut();
       router.push('/auth/sign-in');
    } else {
      console.warn('Navbar: User not available, cannot sign out.');
    }
  };

  // Only render the full navbar if user data is available
  if (!user) {
     return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-secondary-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
             {/* Logo and App Name */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  AIIVR Demo
                </span>
              </Link>
            </div>
             {/* Optional: Sign In link for non-logged-in users */}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-secondary-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                className="dark:invert transition-transform group-hover:scale-105"
                src="/next.svg"
                alt="Next.js logo"
                width={100}
                height={24}
                priority
              />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                AIIVR Demo
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-4 py-2 rounded-lg border border-secondary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              />
              <button
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                onClick={() => {/* Implement search logic */}}
                aria-label="Search"
              >
                <svg
                  className="h-5 w-5 text-secondary-400 hover:text-primary-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            {/* User Role and Status */}
            <div className="flex items-center gap-3">
              {user.role === 'AGENT' && userId > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-200 ${getStatusBgColor(status)}`}
                  >
                    <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status)}`} />
                    <span className={`text-sm font-semibold ${getStatusTextColor(status)}`}>
                      {status}
                      {pauseReason && ` (${pauseReason})`}
                    </span>
                  </button>

                  {isStatusMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="status-menu-button">
                      <div className="py-1" role="none">
                        <button
                          onClick={() => updateStatus('ONLINE')}
                          className="block px-4 py-2 text-sm text-success-700 hover:bg-gray-100 w-full text-left" role="menuitem"
                        >
                          Online
                        </button>
                        <button
                          onClick={() => setIsPauseModalOpen(true)}
                          className="block px-4 py-2 text-sm text-warning-700 hover:bg-gray-100 w-full text-left" role="menuitem"
                        >
                          Paused
                        </button>
                        <button
                          onClick={() => updateStatus('OFFLINE')}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left" role="menuitem"
                        >
                          Offline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user.role === 'SUPERVISOR' && (
                <span className="text-sm font-semibold text-gray-700">(Supervisor)</span>
              )}

              {/* Profile Link */}
              <Link 
                href="/profile" 
                className="flex items-center gap-2 hover:bg-secondary-50 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold shadow-soft">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-secondary-700 hidden sm:block">
                  {user.name}
                  {user.role === 'SUPERVISOR' && ' (Supervisor)'}
                </span>
              </Link>

              {/* Sign Out Button */}
              <form action={handleSignOut}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-secondary-700 hover:text-danger-600 hover:border-danger-600 transition-colors"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Pause Reason Modal (Navbar) */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Pause Reason</h3>
            <div className="space-y-2">
              {pauseReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => updateStatus('PAUSED', reason.value)}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  {reason.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsPauseModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 