'use client';

import { useState } from 'react';
import { AgentStatus as AgentStatusType, PauseReason, User } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

interface AgentStatusProps {
  agent: SafeUser;
  isSupervisor?: boolean;
  onResumeAgent?: (agentId: number) => void;
}

const PAUSE_REASONS: { value: PauseReason; label: string }[] = [
  { value: 'LUNCH', label: 'Lunch Break' },
  { value: 'BATHROOM', label: 'Bathroom Break' },
  { value: 'SMOKE', label: 'Smoke Break' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'CASE_WORK', label: 'Case Work' },
];

export default function AgentStatus({ agent, isSupervisor, onResumeAgent }: AgentStatusProps) {
  const [status, setStatus] = useState<AgentStatusType>('OFFLINE');
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(null);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [selectedReason, setSelectedReason] = useState<PauseReason | null>(null);

  const handleStatusToggle = async () => {
    if (status === 'OFFLINE') {
      // Go online
      const newStatus: AgentStatusType = 'ONLINE';
      setStatus(newStatus);
    } else if (status === 'ONLINE') {
      // Show pause menu
      setShowPauseMenu(true);
    } else if (status === 'PAUSED') {
      // Resume if supervisor
      if (isSupervisor && onResumeAgent) {
        onResumeAgent(agent.id);
      } else {
        // Go back online
        const newStatus: AgentStatusType = 'ONLINE';
        setStatus(newStatus);
        setPauseReason(null);
      }
    }
  };

  const handlePause = async (reason: PauseReason) => {
    const newStatus: AgentStatusType = 'PAUSED';
    setStatus(newStatus);
    setPauseReason(reason);
    setShowPauseMenu(false);
  };

  const getStatusColor = (status: AgentStatusType) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500';
      case 'OFFLINE':
        return 'bg-gray-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`h-3 w-3 rounded-full ${getStatusColor(status)}`} />
          <span className="font-medium">{agent.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {status === 'PAUSED' && pauseReason && (
            <span className="text-sm text-gray-500">
              {PAUSE_REASONS.find(r => r.value === pauseReason)?.label}
            </span>
          )}
          <button
            onClick={handleStatusToggle}
            className={`px-3 py-1 rounded-md text-sm font-medium ${
              status === 'ONLINE'
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : status === 'PAUSED'
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            {status === 'ONLINE'
              ? 'Online'
              : status === 'PAUSED'
              ? isSupervisor
                ? 'Resume'
                : 'Resume'
              : 'Offline'}
          </button>
        </div>
      </div>

      {/* Pause Menu */}
      {showPauseMenu && (
        <div className="mt-2 p-2 bg-gray-50 rounded-md">
          <div className="text-sm font-medium text-gray-700 mb-2">Select Reason:</div>
          <div className="space-y-1">
            {PAUSE_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => handlePause(reason.value)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                {reason.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowPauseMenu(false)}
            className="mt-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
} 