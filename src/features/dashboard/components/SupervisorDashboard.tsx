"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallMetrics } from "@/features/calls";
import { useSocket } from "@/hooks/useSocket";
import { Call, AgentStatus as AgentStatusType, User } from "@prisma/client";
import AgentStatus from "@/features/agent/AgentStatus";
import AgentStatusToggle from "@/features/agent/AgentStatusToggle";

interface SupervisorDashboardProps {
  supervisorData: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: AgentStatusType;
    calls: Call[];
    agents: (User & {
      calls: Call[];
      statusInfo: {
        status: AgentStatusType;
        lastActive: Date;
      } | null;
    })[];
  };
}

export default function SupervisorDashboard({
  supervisorData,
}: SupervisorDashboardProps) {
  const userId = supervisorData.id;
  const { socket } = useSocket(userId, 'SUPERVISOR');
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    averageHandleTime: 0,
    missedCalls: 0,
  });
  const [status, setStatus] = useState(supervisorData.status);

  useEffect(() => {
    if (!socket) return;

    // Listen for live agent status updates
    const handleStatusUpdate = (newStatus: AgentStatusType) => setStatus(newStatus);
    socket.on("agent-status-update", handleStatusUpdate);

    socket.on("call-started", () => {
      setMetrics((prev) => ({
        ...prev,
        totalCalls: prev.totalCalls + 1,
      }));
    });

    socket.on("call-ended", (duration: number) => {
      setMetrics((prev) => ({
        ...prev,
        averageHandleTime: (prev.averageHandleTime * prev.totalCalls + duration) / (prev.totalCalls + 1),
      }));
    });

    socket.on("call-missed", () => {
      setMetrics((prev) => ({
        ...prev,
        missedCalls: prev.missedCalls + 1,
      }));
    });

    return () => {
      socket.off("agent-status-update", handleStatusUpdate);
      socket.off("call-started");
      socket.off("call-ended");
      socket.off("call-missed");
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-600">
            Welcome back, {supervisorData.name}
          </h2>
          <AgentStatus status={status} socket={socket} />
        </div>
        <AgentStatusToggle status={status} setStatus={setStatus} socket={socket} />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow md:col-span-2 xl:col-span-2">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100">
            <CardTitle className="text-xl font-semibold text-blue-600">Team Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <CallMetrics metrics={metrics} />
          </CardContent>
        </Card>

        <Card className="border-blue-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100">
            <CardTitle className="text-xl font-semibold text-blue-600">Active Agents</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-4">
              {supervisorData.agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${
                      agent.statusInfo?.status === 'ONLINE' ? 'bg-green-500' :
                      agent.statusInfo?.status === 'PAUSED' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="font-medium text-gray-700">{agent.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {agent.calls.length} calls
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 