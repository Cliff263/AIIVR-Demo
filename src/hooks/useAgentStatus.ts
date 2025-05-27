"use client";

import { useState, useEffect } from "react";
import { useSocket } from "./useSocket";

export type AgentStatus = "ONLINE" | "PAUSED" | "OFFLINE";

interface UseAgentStatusReturn {
  status: AgentStatus;
  pauseReason: string | null;
  isLoading: boolean;
  error: any;
  updateStatus: (newStatus: AgentStatus, pauseReason?: string) => void;
  isConnected: boolean;
}

export function useAgentStatus(): UseAgentStatusReturn {
  const [status, setStatus] = useState<AgentStatus>("OFFLINE");
  const [pauseReason, setPauseReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { socket, emitStatusChange } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: { status: AgentStatus; pauseReason?: string }) => {
      setStatus(data.status);
      setPauseReason(data.pauseReason || null);
    };

    socket.on("agent-status-update", handleStatusUpdate);

    // Set initial status to ONLINE when component mounts
    if (status === "OFFLINE") {
      emitStatusChange("ONLINE");
    }

    return () => {
      socket.off("agent-status-update", handleStatusUpdate);
    };
  }, [socket, status, emitStatusChange]);

  const updateStatus = async (newStatus: AgentStatus, newPauseReason?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Update local state immediately for better UX
      setStatus(newStatus);
      setPauseReason(newPauseReason || null);

      // Emit status change to server
      emitStatusChange(newStatus, newPauseReason);

      // Update status in database
      const response = await fetch("/api/agent/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          pauseReason: newPauseReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      setError(err);
      // Revert local state on error
      setStatus(status);
      setPauseReason(pauseReason);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    pauseReason,
    isLoading,
    error,
    updateStatus,
    isConnected: !!socket,
  };
} 