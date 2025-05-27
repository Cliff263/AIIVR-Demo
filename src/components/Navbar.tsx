"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from "@/actions/auth";
import { AgentStatus as AgentStatusType, UserRole, PauseReason } from "@prisma/client";
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from "next/navigation";

interface NavbarProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
    status: {
      status: AgentStatusType;
      pauseReason?: string | null;
    } | null;
  };
}

// Status colors
const getStatusColor = (status: AgentStatusType) => {
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

const getStatusTextColor = (status: AgentStatusType) => {
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

const getStatusBgColor = (status: AgentStatusType) => {
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
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [status, setStatus] = useState<AgentStatusType>(user.status?.status || 'OFFLINE');
  const [pauseReason, setPauseReason] = useState<string | null>(user.status?.pauseReason || null);
  const userId = parseInt(user.id, 10);
  
  // Derive userId and role, ensuring they are valid before useSocket
  const userRoleDerived = user?.role || 'AGENT'; // Default role if user is null/undefined, adjust as needed

  // useSocket hook is called unconditionally, but handles invalid userId internally
  const { socket, emitStatusChange } = useSocket(userId, userRoleDerived);

  // Handle initial status - only emit if socket is connected and user is an agent
  useEffect(() => {
    if (user?.role === 'AGENT' && status === 'OFFLINE' && socket && socket.connected && userId > 0) {
      emitStatusChange('ONLINE');
    }
  }, [user?.role, status, emitStatusChange, socket, userId]); // Added userId to dependency array

  // Handle socket updates - only listen if socket is available
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { status: AgentStatusType; pauseReason?: string }) => {
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

  const updateStatus = (newStatus: AgentStatusType, reason?: string) => {
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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
             {/* Logo and App Name */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <span className="text-xl font-bold text-rose-600">
                  AIIVR
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <span className="text-xl font-bold text-rose-600">
                AIIVR
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
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
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-soft bg-white ring-1 ring-gray-200 focus:outline-none z-10" role="menu" aria-orientation="vertical" aria-labelledby="status-menu-button">
                    <button
                      onClick={() => updateStatus('ONLINE')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 w-full text-left" role="menuitem"
                    >
                      Online
                    </button>
                    <button
                      onClick={() => setIsPauseModalOpen(true)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 w-full text-left" role="menuitem"
                    >
                      Paused
                    </button>
                    <button
                      onClick={() => updateStatus('OFFLINE')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 w-full text-left" role="menuitem"
                    >
                      Offline
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Profile Section */}
            <div className="flex items-center gap-4">
              <Link 
                href="/profile" 
                className="flex items-center gap-2 hover:bg-rose-50 px-3 py-2 rounded-lg transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-rose-600 flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-medium text-gray-900">
                    {user.name}
                  </span>
                  {user.role === 'SUPERVISOR' && (
                    <span className="text-sm text-rose-600 ml-1">(Supervisor)</span>
                  )}
                </div>
              </Link>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-rose-600 hover:text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pause Reason Modal (Navbar) */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Pause Reason</h3>
            <div className="space-y-2">
              {pauseReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => updateStatus('PAUSED', reason.value)}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-md text-left transition-colors"
                >
                  {reason.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsPauseModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-colors"
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