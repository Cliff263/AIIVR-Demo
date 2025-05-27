"use client";

import { useState, useEffect } from "react";
import { useSocket } from "./useSocket";
import { AgentStatus, PauseReason } from "@prisma/client";
import { StatusService } from "@/lib/statusService";

export type UseAgentStatusReturn = {
  status: AgentStatus;
  pauseReason: PauseReason | null;
  isLoading: boolean;
  error: Error | null;
  updateStatus: (status: AgentStatus, pauseReason?: PauseReason) => Promise<void>;
  isConnected: boolean;
};

export function useAgentStatus(userId: string): UseAgentStatusReturn {
  const [status, setStatus] = useState<AgentStatus>("OFFLINE");
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { socket, isConnected } = useSocket(parseInt(userId), 'AGENT');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const statusInfo = await StatusService.getAgentStatus(userId);
        if (statusInfo) {
          setStatus(statusInfo.status);
          setPauseReason(statusInfo.pauseReason);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch status'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [userId]);

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { status: AgentStatus; pauseReason?: PauseReason }) => {
      setStatus(data.status);
      if (data.pauseReason) {
        setPauseReason(data.pauseReason);
      }
    };

    socket.on('agent-status-update', handleStatusUpdate);

    return () => {
      socket.off('agent-status-update', handleStatusUpdate);
    };
  }, [socket]);

  const updateStatus = async (newStatus: AgentStatus, newPauseReason?: PauseReason) => {
    if (!socket || !isConnected) {
      throw new Error('Socket not connected');
    }

    try {
      await StatusService.updateAgentStatus(userId, {
        status: newStatus,
        pauseReason: newPauseReason
      });

      socket.emit('status-change', {
        status: newStatus,
        pauseReason: newPauseReason
      });

      setStatus(newStatus);
      if (newPauseReason) {
        setPauseReason(newPauseReason);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update status'));
      throw err;
    }
  };

  return {
    status,
    pauseReason,
    isLoading,
    error,
    updateStatus,
    isConnected,
  };
} 