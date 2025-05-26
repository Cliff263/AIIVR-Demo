import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useSocket } from './useSocket';

interface AgentStatus {
  status: 'ONLINE' | 'PAUSED' | 'OFFLINE';
  pauseReason?: string;
  lastUpdated: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useAgentStatus(agentId: number, role: 'AGENT' | 'SUPERVISOR') {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  
  // Ensure valid agentId
  const validAgentId = typeof agentId === 'string' ? parseInt(agentId, 10) : agentId;
  if (!validAgentId || isNaN(validAgentId)) {
    console.warn('Invalid agentId passed to useAgentStatus/useSocket:', agentId);
  }
  const { socket, emitStatusChange } = useSocket(validAgentId, role);
  
  // SWR polling as fallback
  const { data, error, isLoading } = useSWR<AgentStatus>(
    `/api/agent/${validAgentId}/status`,
    fetcher,
    {
      refreshInterval: 5000, // Poll every 5 seconds
      onSuccess: (data) => {
        setStatus(data);
      },
    }
  );

  // Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: AgentStatus) => {
      console.log('Received status update:', data);
      setStatus(data);
    };

    // Listen for status updates
    socket.on('agent-status-update', handleStatusUpdate);

    return () => {
      socket.off('agent-status-update', handleStatusUpdate);
    };
  }, [socket]);

  const updateStatus = (newStatus: 'ONLINE' | 'PAUSED' | 'OFFLINE', pauseReason?: string) => {
    emitStatusChange(newStatus, pauseReason);
  };

  return {
    status: status || data,
    isLoading,
    error,
    updateStatus,
    isConnected: !!socket?.connected,
  };
} 