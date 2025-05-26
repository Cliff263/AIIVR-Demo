"use client";

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { AgentStatus as AgentStatusType, PauseReason } from '@prisma/client';

interface AgentStatusProps {
  agentId: number;
  role: 'AGENT' | 'SUPERVISOR';
  initialStatus?: AgentStatusType;
  initialPauseReason?: string | null;
}

export default function AgentStatus({ agentId, role, initialStatus = 'OFFLINE', initialPauseReason = null }: AgentStatusProps) {
  const [status, setStatus] = useState<AgentStatusType>(initialStatus);
  const [pauseReason, setPauseReason] = useState<string | null>(initialPauseReason);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);

  // Ensure valid agentId is passed to useSocket
  const validAgentId = typeof agentId === 'string' ? parseInt(agentId, 10) : agentId;
  const numericAgentId = !isNaN(validAgentId) ? validAgentId : 0; // Use 0 or handle error if ID is invalid

  if (isNaN(validAgentId)) {
    console.warn('Invalid agentId passed to AgentStatus/useSocket:', agentId);
  }

  const { socket, emitStatusChange } = useSocket(numericAgentId, role);

  // Handle initial status
  useEffect(() => {
    if (role === 'AGENT' && status === 'OFFLINE') {
      emitStatusChange('ONLINE');
    }
  }, [role, status, emitStatusChange]);

  // Handle socket updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { status: AgentStatusType; pauseReason?: string }) => {
      console.log('Received status update:', data);
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
    console.log('Updating status:', { newStatus, reason });
    emitStatusChange(newStatus, reason);
    setStatus(newStatus);
    setPauseReason(reason || null);
    setIsMenuOpen(false);
    setIsPauseModalOpen(false);
  };

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

  const pauseReasons = [
    { value: 'LUNCH', label: 'Lunch' },
    { value: 'BATHROOM', label: 'Bathroom' },
    { value: 'SMOKE', label: 'Smoke' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'CASE_WORK', label: 'Case Work' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-200 ${getStatusBgColor(status)}`}
      >
        <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(status)}`} />
        <span className={`text-sm font-semibold ${getStatusTextColor(status)}`}>
          {status}
          {pauseReason && ` (${pauseReason})`}
        </span>
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-strong bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => updateStatus('ONLINE')}
              className="block w-full text-left px-4 py-2.5 text-sm font-medium text-success-700 hover:bg-success-50 transition-colors duration-200"
              role="menuitem"
            >
              Set Online
            </button>
            <button
              onClick={() => setIsPauseModalOpen(true)}
              className="block w-full text-left px-4 py-2.5 text-sm font-medium text-warning-700 hover:bg-warning-50 transition-colors duration-200"
              role="menuitem"
            >
              Set Paused
            </button>
            <button
              onClick={() => updateStatus('OFFLINE')}
              className="block w-full text-left px-4 py-2.5 text-sm font-medium text-secondary-700 hover:bg-secondary-50 transition-colors duration-200"
              role="menuitem"
            >
              Set Offline
            </button>
          </div>
        </div>
      )}

      {/* Pause Reason Modal */}
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
    </div>
  );
} 