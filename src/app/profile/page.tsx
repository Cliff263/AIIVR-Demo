"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useEffect, useState } from "react";
import { AgentStatusToggle } from "@/features/agent";
import { useSocket } from "@/hooks/useSocket";

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface AgentStatusInfo {
  status: string;
  pauseReason?: string | null;
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatusInfo>>({});
  const {
    status,
    pauseReason,
    isLoading: statusLoading,
    isConnected,
    error: statusError,
    updateStatus
  } = useAgentStatus(user?.id || "");
  const { socket } = useSocket(user?.id || "", user?.role || "AGENT");
  const [statusState, setStatusState] = useState(status);

  // Fetch agents for supervisor
  useEffect(() => {
    if (!user || user.role !== "SUPERVISOR") return;
    const fetchAgents = async () => {
      const res = await fetch("/api/supervisor/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    };
    fetchAgents();
  }, [user]);

  // Poll agent statuses for supervisor
  useEffect(() => {
    if (!user || user.role !== "SUPERVISOR" || agents.length === 0) return;
    let isMounted = true;
    const fetchStatuses = async () => {
      const statuses: Record<string, AgentStatusInfo> = {};
      await Promise.all(
        agents.map(async (agent) => {
          const res = await fetch(`/api/agent/${agent.id}/status`);
          if (res.ok) {
            const data = await res.json();
            statuses[agent.id] = {
              status: data.status,
              pauseReason: data.pauseReason,
            };
          }
        })
      );
      if (isMounted) setAgentStatuses(statuses);
    };
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user, agents]);

  // Update statusState when status changes
  useEffect(() => {
    setStatusState(status);
  }, [status]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth/sign-in";
    return null;
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ONLINE":
        return "text-green-700 bg-green-50";
      case "PAUSED":
        return "text-yellow-700 bg-yellow-50";
      case "OFFLINE":
      default:
        return "text-gray-700 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-blue-100">
          <div className="px-6 py-8 border-b border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center text-4xl font-bold text-blue-900 shadow-md">
                {user.name?.[0]}
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-blue-900">{user.name}</h3>
                <p className="text-base text-blue-700">{user.email}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ml-0 mt-2 ${getStatusColor(status)} shadow-sm`}>{statusLoading ? "Loading..." : status}</span>
                {pauseReason && (
                  <span className="ml-2 text-xs text-gray-500">({pauseReason})</span>
                )}
                <span className={`ml-4 text-xs ${isConnected ? "text-green-600" : "text-gray-400"}`}>{isConnected ? "LIVE" : "OFFLINE"}</span>
              </div>
            </div>
            {user.role === "AGENT" && (
              <AgentStatusToggle status={statusState} setStatus={updateStatus} socket={socket} />
            )}
          </div>
          <dl className="divide-y divide-blue-100">
            <div className="py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-base font-semibold text-blue-900">Full name</dt>
              <dd className="mt-1 text-base text-blue-700 sm:mt-0 sm:col-span-2">{user.name}</dd>
            </div>
            <div className="py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-base font-semibold text-blue-900">Email address</dt>
              <dd className="mt-1 text-base text-blue-700 sm:mt-0 sm:col-span-2">{user.email}</dd>
            </div>
            <div className="py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-base font-semibold text-blue-900">Role</dt>
              <dd className="mt-1 text-base text-blue-700 sm:mt-0 sm:col-span-2">{user.role}</dd>
            </div>
          </dl>
        </div>
        {user.role === "SUPERVISOR" && (
          <div className="mt-8 bg-white shadow-2xl rounded-3xl overflow-hidden border border-blue-100">
            <div className="px-6 py-6 border-b border-blue-100">
              <h3 className="text-xl font-bold text-blue-900">Assigned Agents</h3>
            </div>
            <div className="border-t border-blue-100">
              <ul className="divide-y divide-blue-100">
                {agents.map((agent) => (
                  <li key={agent.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-base font-semibold text-blue-900">{agent.name}</p>
                      <p className="text-sm text-blue-700">{agent.email}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(agentStatuses[agent.id]?.status)} shadow-sm`}>
                        {agentStatuses[agent.id]?.status || "OFFLINE"}
                      </span>
                      {agentStatuses[agent.id]?.pauseReason && (
                        <span className="ml-2 text-xs text-gray-500">({agentStatuses[agent.id]?.pauseReason})</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 