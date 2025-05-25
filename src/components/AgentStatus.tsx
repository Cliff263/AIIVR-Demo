'use client';

import { useState } from 'react';
import { UserCircleIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';
import { AgentStatusInfo, AgentStatus as AgentStatusType, PauseReason, User, UserRole } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

interface AgentStatusProps {
  agent?: SafeUser & {
    status?: AgentStatusInfo | null;
  };
  onStatusChange?: (status: AgentStatusType, pauseReason?: PauseReason | null) => void;
  isSupervisor?: boolean;
  currentUser: SafeUser;
  onResumeAgent?: (agentId: number) => void;
}

const PAUSE_REASONS: PauseReason[] = [
  'LUNCH',
  'BATHROOM',
  'SMOKE',
  'ON_LEAVE',
  'CASE_WORK'
];

export default function AgentStatus({ 
  agent = { 
    id: 0, 
    email: '', 
    name: '', 
    role: 'AGENT' as UserRole, 
    createdAt: new Date(), 
    updatedAt: new Date(),
    supervisorId: null
  }, 
  onStatusChange, 
  isSupervisor = false,
  currentUser,
  onResumeAgent
}: AgentStatusProps) {
  const [isPaused, setIsPaused] = useState(agent.status?.status === 'PAUSED');
  const [selectedReason, setSelectedReason] = useState<PauseReason | null | undefined>(agent.status?.pauseReason);
  const [showPauseMenu, setShowPauseMenu] = useState(false);

  const handleStatusToggle = () => {
    if (isPaused) {
      setIsPaused(false);
      setSelectedReason(null);
      onStatusChange?.('ONLINE', null);
    } else {
      setShowPauseMenu(true);
    }
  };

  const handlePause = (reason: PauseReason) => {
    setIsPaused(true);
    setSelectedReason(reason);
    setShowPauseMenu(false);
    onStatusChange?.('PAUSED', reason);
  };

  const handleResume = () => {
    if (isSupervisor && onResumeAgent) {
      onResumeAgent(agent.id);
    } else {
      handleStatusToggle();
    }
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

  const formatPauseReason = (reason: PauseReason) => {
    return reason.toLowerCase().replace('_', ' ');
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserCircleIcon className="h-10 w-10 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-500">{agent.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className={`h-3 w-3 rounded-full ${getStatusColor(agent.status?.status || 'OFFLINE')} mr-2`} />
            <span className="text-sm text-gray-500">
              {agent.status?.status || 'OFFLINE'}
              {agent.status?.pauseReason && ` (${formatPauseReason(agent.status.pauseReason)})`}
            </span>
          </div>
          {!isSupervisor && (
            <div className="relative">
              <button
                onClick={handleStatusToggle}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isPaused
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              
              {showPauseMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu">
                    {PAUSE_REASONS.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => handlePause(reason)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        {formatPauseReason(reason)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {isSupervisor && isPaused && (
            <button
              onClick={handleResume}
              className="px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200"
            >
              Resume Agent
            </button>
          )}
        </div>
      </div>

      {agent.status?.lastActive && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          Last active: {new Date(agent.status.lastActive).toLocaleString()}
        </div>
      )}
    </div>
  );
} 