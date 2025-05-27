"use client";

import { useState, useEffect } from "react";
import { getAgentStatus } from "@/actions/status";
import type { AgentStatusInfo, AgentStatus } from "@prisma/client";

export function useAgentStatus(userId: string) {
  const [status, setStatus] = useState<AgentStatusInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { status: newStatus, error: statusError } = await getAgentStatus(userId);
        if (mounted) {
          if (statusError) {
            if (statusError === "Unauthorized") {
              // Handle unauthorized error gracefully
              setStatus({ status: "OFFLINE", pauseReason: null } as AgentStatusInfo);
              setError(null);
            } else {
              setError(statusError);
            }
          } else {
            setStatus(newStatus);
            setError(null);
          }
        }
      } catch (err) {
        if (mounted) {
          setError("Failed to fetch status");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchStatus();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const updateStatus = async (newStatus: AgentStatus) => {
    if (!userId) {
      throw new Error("No user ID provided");
    }

    try {
      const response = await fetch("/api/agent/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status";
      setError(errorMessage);
      throw err;
    }
  };

  return { 
    status: status?.status || 'OFFLINE',
    pauseReason: status?.pauseReason,
    isLoading: loading,
    error,
    isConnected: true, // This will be updated when we implement socket connection
    updateStatus
  };
} 