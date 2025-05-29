"use client";

import { useState, useEffect, useRef } from 'react';
import { signOut } from "@/actions/auth";
import { UserRole, UserStatus } from "@prisma/client";
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { User, Bell, Search, LogOut } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
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

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

interface AgentStatusUpdate {
  agentId: string;
  status: string;
  description?: string;
  changedBy?: string;
  timestamp: Date;
  agentName?: string;
  name?: string;
  pauseReason?: string;
}

interface SystemNotification {
  title?: string;
  message: string;
  timestamp?: Date;
}

const getStatusColor = (status: UserStatus) => {
  switch (status) {
    case 'ONLINE':
      return 'bg-green-500';
    case 'PAUSED':
      return 'bg-yellow-500';
    case 'OFFLINE':
    default:
      return 'bg-gray-500';
  }
};

const getStatusTextColor = (status: UserStatus) => {
  switch (status) {
    case 'ONLINE':
      return 'text-green-700';
    case 'PAUSED':
      return 'text-yellow-700';
    case 'OFFLINE':
    default:
      return 'text-gray-600';
  }
};

const getStatusBgColor = (status: UserStatus) => {
  switch (status) {
    case 'ONLINE':
      return 'bg-green-50 hover:bg-green-100';
    case 'PAUSED':
      return 'bg-yellow-50 hover:bg-yellow-100';
    case 'OFFLINE':
    default:
      return 'bg-gray-50 hover:bg-gray-100';
  }
};

export default function Topbar({ user }: TopbarProps) {
  const router = useRouter();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [status, setStatus] = useState<UserStatus>(user.status?.status || 'OFFLINE');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<Notification[]>([]);

  const { socket, isConnected, emitStatusChange } = useSocket(user.id, user.role);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (user?.role === 'AGENT' && status === 'OFFLINE' && isConnected) {
      emitStatusChange('ONLINE');
    }
  }, [user?.role, status, emitStatusChange, isConnected]);

  useEffect(() => {
    if (!socket) return;

    // --- Common notification handlers ---
    const pushNotification = (notif: Notification) => setNotifications((prev) => [notif, ...prev]);

    // SUPERVISOR EVENTS
    if (user.role === 'SUPERVISOR') {
      // Agent status change
      const handleAgentStatusUpdate = (data: AgentStatusUpdate) => {
        console.log('[Topbar] Received agent-status-update:', data);
        const agentName = data.agentName || data.name || data.agentId || 'Unknown Agent';
        let message = '';
        switch (data.status) {
          case 'LOGIN':
            message = `Agent ${agentName} logged in`;
            break;
          case 'LOGOUT':
            message = `Agent ${agentName} logged out`;
            break;
          case 'ONLINE':
            message = `Agent ${agentName} is now ONLINE`;
            break;
          case 'PAUSED':
            message = `Agent ${agentName} is PAUSED${data.pauseReason ? `: ${data.pauseReason}` : ''}`;
            break;
          case 'OFFLINE':
            message = `Agent ${agentName} is now OFFLINE`;
            break;
          default:
            message = `Agent ${agentName} status changed to ${data.status}`;
        }

        pushNotification({
          id: `status-${data.agentId}-${data.status}-${Date.now()}`,
          title: 'Agent Status Change',
          description: message,
          timestamp: data.timestamp || new Date(),
          read: false
        });
      };

      // System notifications
      const handleSystemNotification = (data: SystemNotification) => {
        pushNotification({
          id: `system-${Date.now()}-${Math.random()}`,
          title: data.title || 'System Notification',
          description: data.message,
          timestamp: data.timestamp || new Date(),
          read: false
        });
      };

      // Listen for events
      socket.on('agent-status-update', handleAgentStatusUpdate);
      socket.on('system-notification', handleSystemNotification);

      return () => {
        socket.off('agent-status-update', handleAgentStatusUpdate);
        socket.off('system-notification', handleSystemNotification);
      };
    }

    // AGENT EVENTS
    if (user.role === 'AGENT') {
      // System notifications
      const handleSystemNotification = (data: SystemNotification) => {
        pushNotification({
          id: `system-${Date.now()}-${Math.random()}`,
          title: data.title || 'System Notification',
          description: data.message,
          timestamp: data.timestamp || new Date(),
          read: false
        });
      };

      socket.on('system-notification', handleSystemNotification);

      return () => {
        socket.off('system-notification', handleSystemNotification);
      };
    }
  }, [socket, user.role]);

  // Fetch initial notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        setNotifications(data.notifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // Mark all notifications as read when dropdown is opened
  useEffect(() => {
    if (isNotificationsOpen && notifications?.some(n => !n.read)) {
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    }
  }, [isNotificationsOpen, notifications]);

  const updateStatus = (newStatus: UserStatus) => {
    if (isConnected) {
      emitStatusChange(newStatus);
      setStatus(newStatus);
      setIsStatusMenuOpen(false);
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
          {user.role === 'AGENT' && (
            <div className="relative">
              <button
                onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-200 ${getStatusBgColor(status)}`}
                title={`Current status: ${status}`}
                aria-label={`Change status, current status: ${status}`}
              >
                <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status)}`} />
                <span className={`text-sm font-semibold ${getStatusTextColor(status)}`}>
                  {status}
                </span>
              </button>

              {isStatusMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <button
                    onClick={() => updateStatus('ONLINE')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
                  >
                    Online
                  </button>
                  <button
                    onClick={() => updateStatus('PAUSED')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
                  >
                    Paused
                  </button>
                  <button
                    onClick={() => updateStatus('OFFLINE')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
                  >
                    Offline
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 hover:bg-blue-700 rounded-lg text-blue-100 relative"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications?.some(n => !n.read) && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-fade-in">
                <div className="p-4 border-b flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-500" /> Notifications
                  </h3>
                  <button
                    className="text-xs text-blue-600 hover:underline font-semibold"
                    onClick={() => setNotifications((prev) => prev?.map(n => ({ ...n, read: true })) || [])}
                  >
                    Mark all as read
                  </button>
                </div>
                <div className="text-sm text-gray-700 max-h-80 overflow-y-auto divide-y divide-blue-50">
                  {notifications?.length === 0 ? (
                    <div className="text-gray-500 p-6 text-center">No new notifications</div>
                  ) : (
                    <ul>
                      {notifications?.slice(0, 10).map((n) => (
                        <li key={n.id} className={`flex items-start gap-3 px-4 py-3 ${!n.read ? 'bg-blue-50' : ''}`}>
                          <div className="pt-1">
                            <Bell className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-blue-900">{n.title}</div>
                            <div className="text-xs text-blue-500 mb-1">{new Date(n.timestamp).toLocaleString()}</div>
                            <div className="text-sm text-gray-700">{n.description}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link 
            href="/profile" 
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
