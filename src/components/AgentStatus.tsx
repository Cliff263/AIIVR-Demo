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
}

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
  currentUser
}: AgentStatusProps) {
  const [isPaused, setIsPaused] = useState(agent.status?.status === 'PAUSED');
  const [selectedReason, setSelectedReason] = useState<PauseReason | null | undefined>(agent.status?.pauseReason);

  const handleStatusToggle = () => {
    const newStatus = isPaused ? 'ONLINE' : 'PAUSED';
    setIsPaused(!isPaused);
    onStatusChange?.(newStatus, selectedReason);
  };

  const handleReasonChange = (reason: PauseReason) => {
    setSelectedReason(reason);
    if (isPaused) {
      onStatusChange?.('PAUSED', reason);
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
            </span>
          </div>
          {!isSupervisor && (
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
          )}
        </div>
      </div>

      {isPaused && (
        <div className="mt-4">
          <label htmlFor="pause-reason" className="block text-sm font-medium text-gray-700">Pause Reason</label>
          <select
            id="pause-reason"
            value={selectedReason || ''}
            onChange={(e) => handleReasonChange(e.target.value as PauseReason)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            aria-label="Select pause reason"
          >
            <option value="">Select a reason</option>
            {Object.values(PauseReason).map((reason) => (
              <option key={reason} value={reason}>
                {reason.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      )}

      {agent.status?.lastActive && (
        <div className="mt-4 flex items-center text-sm text-gray-500">
          <ClockIcon className="h-4 w-4 mr-1" />
          Last active: {new Date(agent.status.lastActive).toLocaleString()}
        </div>
      )}
    </div>
  );
} 