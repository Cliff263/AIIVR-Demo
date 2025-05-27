"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from "@/actions/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

interface NavbarProps {
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

// Status colors
const getStatusColor = (status: UserStatus) => {
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

const getStatusTextColor = (status: UserStatus) => {
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

const getStatusBgColor = (status: UserStatus) => {
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

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [status, setStatus] = useState<UserStatus>(user.status?.status || 'OFFLINE');
  
  const { socket, isConnected, emitStatusChange } = useSocket(user.id, user.role);

  // Handle initial status - only emit if socket is connected and user is an agent
  useEffect(() => {
    if (user?.role === 'AGENT' && status === 'OFFLINE' && isConnected) {
      emitStatusChange('ONLINE');
    }
  }, [user?.role, status, emitStatusChange, isConnected]);

  // Handle socket updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { status: UserStatus; lastActive: Date }) => {
      console.log('Navbar received status update:', data);
      setStatus(data.status);
    };

    const handleStatusChangeConfirmation = (data: { 
      status: UserStatus;
      timestamp: Date;
      lastActive: Date;
    }) => {
      toast.success('Status updated', {
        description: `Status changed to ${data.status}`,
      });
    };

    // Listen for status updates
    socket.on('agent-status-update', handleStatusUpdate);
    socket.on('status-change-confirmation', handleStatusChangeConfirmation);

    return () => {
      socket.off('agent-status-update', handleStatusUpdate);
      socket.off('status-change-confirmation', handleStatusChangeConfirmation);
    };
  }, [socket]);

  const updateStatus = (newStatus: UserStatus) => {
    if (isConnected) {
      emitStatusChange(newStatus);
      setStatus(newStatus);
      setIsStatusMenuOpen(false);
      setIsPauseModalOpen(false);
    } else {
      toast.error('Connection error', {
        description: 'Cannot update status while disconnected',
      });
    }
  };

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
            {user.role === 'AGENT' && (
              <div className="relative">
                <button
                  onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-200 ${getStatusBgColor(status)}`}
                >
                  <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status)}`} />
                  <span className={`text-sm font-semibold ${getStatusTextColor(status)}`}>
                    {status}
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

      {/* Pause Reason Modal */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-soft">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Pause Reason</h3>
            <div className="space-y-2">
              {/* Remove pause reasons section */}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 