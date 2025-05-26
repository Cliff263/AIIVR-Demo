"use client";

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { AgentStatus as AgentStatusType } from '@prisma/client';

interface AgentStatusProps {
  agentId: number;
  role: 'AGENT' | 'SUPERVISOR';
}

export default function AgentStatus({ agentId, role }: AgentStatusProps) {
  const [status, setStatus] = useState<AgentStatusType>('OFFLINE');
  const [pauseReason, setPauseReason] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { socket } = useSocket(agentId, role);

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { status: AgentStatusType; pauseReason?: string }) => {
      setStatus(data.status);
      setPauseReason(data.pauseReason || null);
    };

    socket.on('status-update', handleStatusUpdate);

    return () => {
      socket.off('status-update', handleStatusUpdate);
    };
  }, [socket]);

  const updateStatus = (newStatus: AgentStatusType, reason?: string) => {
    if (!socket) return;

    socket.emit('update-status', {
      status: newStatus,
      pauseReason: reason,
    });

    setStatus(newStatus);
    setPauseReason(reason || null);
    setIsMenuOpen(false);
  };

  const getStatusColor = (status: AgentStatusType) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-emerald-500';
      case 'PAUSED':
        return 'bg-red-500';
      case 'OFFLINE':
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusTextColor = (status: AgentStatusType) => {
    switch (status) {
      case 'ONLINE':
        return 'text-emerald-600';
      case 'PAUSED':
        return 'text-red-600';
      case 'OFFLINE':
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className={`h-2 w-2 rounded-full ${getStatusColor(status)}`} />
        <span className={`text-sm font-medium ${getStatusTextColor(status)}`}>
          {status}
          {pauseReason && ` (${pauseReason})`}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => updateStatus('ONLINE')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Set Online
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter pause reason:');
                if (reason) {
                  updateStatus('PAUSED', reason);
                }
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Set Paused
            </button>
            <button
              onClick={() => updateStatus('OFFLINE')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Set Offline
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 