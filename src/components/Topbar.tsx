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
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationsRef = useRef<any[]>([]);

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
    const pushNotification = (notif) => setNotifications((prev) => [notif, ...prev]);

    // SUPERVISOR EVENTS
    if (user.role === 'SUPERVISOR') {
      // Incoming call
      const handleCallCreated = (call) => {
        pushNotification({
          id: 'call-' + call.id,
          title: 'Incoming Call',
          description: `Call from ${call.phoneNumber || 'Unknown'} (Agent: ${call.agent?.name || 'N/A'})`,
          createdAt: call.timestamp || new Date().toISOString(),
          read: false,
        });
      };
      // Agent status change
      const handleAgentStatusUpdate = (data) => {
        // Try to get agent name from the event, fallback to agentId
        const agentName = data.agentName || data.name || data.agent_id || data.agentId || 'Unknown Agent';
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
            message = `Agent ${agentName} is now PAUSED${data.pauseReason ? ` (reason: ${data.pauseReason})` : ''}`;
            break;
          case 'OFFLINE':
            message = `Agent ${agentName} is now OFFLINE`;
            break;
          default:
            message = `Agent ${agentName} status changed to ${data.status}`;
        }
        pushNotification({
          id: 'agent-status-' + data.agentId + '-' + data.status + '-' + (data.timestamp || Date.now()),
          title: 'Agent Status Change',
          description: message,
          createdAt: data.timestamp || new Date().toISOString(),
          read: false,
        });
      };
      // Query completion/assignment
      const handleQueryStatusUpdate = (data) => {
        pushNotification({
          id: 'query-status-' + data.queryId + '-' + data.status,
          title: 'Query Update',
          description: `Query #${data.queryId} status: ${data.status}${data.agentId ? ` (Agent: ${data.agentId})` : ''}`,
          createdAt: data.timestamp || new Date().toISOString(),
          read: false,
        });
      };
      socket.on('call-created', handleCallCreated);
      socket.on('agent-status-update', handleAgentStatusUpdate);
      socket.on('query-status-update', handleQueryStatusUpdate);
      // Clean up
      return () => {
        socket.off('call-created', handleCallCreated);
        socket.off('agent-status-update', handleAgentStatusUpdate);
        socket.off('query-status-update', handleQueryStatusUpdate);
      };
    }

    // AGENT EVENTS
    if (user.role === 'AGENT') {
      // Forced status change by supervisor
      const handleStatusUpdate = (data) => {
        pushNotification({
          id: 'forced-status-' + data.status + '-' + (data.timestamp || Date.now()),
          title: 'Status Changed by Supervisor',
          description: `Your status was changed to ${data.status}${data.changedBy ? ` by ${data.changedBy}` : ''}${data.description ? `: ${data.description}` : ''}`,
          createdAt: data.timestamp || new Date().toISOString(),
          read: false,
        });
      };
      // Supervisor intervention
      const handleSupervisorIntervention = (data) => {
        pushNotification({
          id: 'supervisor-intervention-' + (data.timestamp || Date.now()),
          title: 'Supervisor Intervention',
          description: data.description,
          createdAt: data.timestamp || new Date().toISOString(),
          read: false,
        });
      };
      // New assigned query or query update
      const handleQueryStatusUpdate = (data) => {
        pushNotification({
          id: 'query-status-' + data.queryId + '-' + data.status,
          title: 'Query Update',
          description: `Query #${data.queryId} status: ${data.status}`,
          createdAt: data.timestamp || new Date().toISOString(),
          read: false,
        });
      };
      socket.on('status-update', handleStatusUpdate);
      socket.on('supervisor-intervention', handleSupervisorIntervention);
      socket.on('query-status-update', handleQueryStatusUpdate);
      // Clean up
      return () => {
        socket.off('status-update', handleStatusUpdate);
        socket.off('supervisor-intervention', handleSupervisorIntervention);
        socket.off('query-status-update', handleQueryStatusUpdate);
      };
    }
  }, [socket, user.role]);

  // Mark all notifications as read when dropdown is opened
  useEffect(() => {
    if (isNotificationsOpen && notifications.some(n => !n.read)) {
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
    }
  }, [isNotificationsOpen]);

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
              {notifications.some(n => !n.read) && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  <div className="mt-2 text-sm text-gray-700 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-gray-500">No new notifications</div>
                    ) : (
                      <ul className="divide-y divide-blue-50">
                        {notifications.slice(0, 10).map((n) => (
                          <li key={n.id} className="py-2">
                            <div className="font-semibold text-blue-900">{n.title}</div>
                            <div className="text-xs text-blue-500">{new Date(n.createdAt).toLocaleString()}</div>
                            <div className="text-sm text-gray-700">{n.description}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
