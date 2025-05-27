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
    updateStatus,
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
            {user.role === "AGENT" && (
              <AgentStatusToggle status={statusState} setStatus={updateStatus} socket={socket} />
            )}
          </div>
          <div className="border-t border-gray-200">
            <dl className="divide-y divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.name}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.email}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{user.role}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Status</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                    {statusLoading ? "Loading..." : status}
                  </span>
                  {pauseReason && (
                    <span className="ml-2 text-xs text-gray-500">({pauseReason})</span>
                  )}
                  <span className={`ml-4 text-xs ${isConnected ? "text-green-600" : "text-gray-400"}`}>
                    {isConnected ? "LIVE" : "OFFLINE"}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {user.role === "SUPERVISOR" && agents.length > 0 && (
          <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Agents</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {agents.map((agent) => (
                  <li key={agent.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.email}</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agentStatuses[agent.id]?.status)}`}>
                          {agentStatuses[agent.id]?.status || "OFFLINE"}
                        </span>
                        {agentStatuses[agent.id]?.pauseReason && (
                          <span className="ml-2 text-xs text-gray-500">({agentStatuses[agent.id]?.pauseReason})</span>
                        )}
                      </div>
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