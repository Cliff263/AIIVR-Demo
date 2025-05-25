'use client';

import { useState } from 'react';
import { UserCircleIcon, PhoneIcon, ClockIcon } from '@heroicons/react/24/outline';

interface Agent {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'paused';
  currentCall?: {
    number: string;
    duration: number;
  };
  pauseReason?: string;
  lastActive: Date;
}

const mockAgents: Agent[] = [
  {
    id: '1',
    name: 'John Doe',
    status: 'online',
    currentCall: {
      number: '+27 12 345 6789',
      duration: 120,
    },
    lastActive: new Date(),
  },
  {
    id: '2',
    name: 'Jane Smith',
    status: 'paused',
    pauseReason: 'Lunch',
    lastActive: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    name: 'Mike Johnson',
    status: 'online',
    lastActive: new Date(),
  },
];

export default function AgentStatus() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(true); // Mock supervisor status

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Agent Status</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">View as:</span>
          <button
            onClick={() => setIsSupervisor(!isSupervisor)}
            className={`px-3 py-1 text-sm rounded-md ${
              isSupervisor
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Supervisor
          </button>
          <button
            onClick={() => setIsSupervisor(!isSupervisor)}
            className={`px-3 py-1 text-sm rounded-md ${
              !isSupervisor
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Agent
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockAgents.map((agent) => (
          <div
            key={agent.id}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${getStatusColor(
                        agent.status
                      )}`}
                    />
                    <span className="text-sm text-gray-500">
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      {agent.pauseReason && ` - ${agent.pauseReason}`}
                    </span>
                  </div>
                </div>
              </div>
              {isSupervisor && (
                <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                  Monitor
                </button>
              )}
            </div>

            {agent.currentCall && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  <span>{agent.currentCall.number}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  <span>{formatDuration(agent.currentCall.duration)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedAgent && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium mb-4">Agent Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{selectedAgent.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">
                  {selectedAgent.status.charAt(0).toUpperCase() +
                    selectedAgent.status.slice(1)}
                  {selectedAgent.pauseReason && ` - ${selectedAgent.pauseReason}`}
                </p>
              </div>
              {selectedAgent.currentCall && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Current Call</p>
                    <p className="font-medium">{selectedAgent.currentCall.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Call Duration</p>
                    <p className="font-medium">
                      {formatDuration(selectedAgent.currentCall.duration)}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-gray-500">Last Active</p>
                <p className="font-medium">
                  {selectedAgent.lastActive.toLocaleString()}
                </p>
              </div>
            </div>
            {isSupervisor && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Handle monitoring action
                    setSelectedAgent(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Start Monitoring
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 