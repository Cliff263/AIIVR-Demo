"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallMetrics } from "@/features/calls";
import { useSocket } from "@/hooks/useSocket";
import { Call, AgentStatus as AgentStatusType } from "@prisma/client";
import AgentStatus from "@/features/agent/AgentStatus";
import AgentStatusToggle from "@/features/agent/AgentStatusToggle";
import CallList from "@/features/calls/CallList";
import QueryManager from "@/components/queries/QueryManager";

interface AgentDashboardProps {
  agentData: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: AgentStatusType;
    calls: Call[];
  };
}

export default function AgentDashboard({
  agentData,
}: AgentDashboardProps) {
  const userId = agentData.id;
  const { socket } = useSocket(userId, 'AGENT');
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    averageHandleTime: 0,
    missedCalls: 0,
  });
  const [status, setStatus] = useState(agentData.status);

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
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-rose-600">
            Welcome back, {agentData.name}
          </h2>
          <AgentStatus status={status} socket={socket} />
        </div>
        <AgentStatusToggle status={status} setStatus={setStatus} socket={socket} />
      </div>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-rose-100 shadow-md hover:shadow-lg transition-shadow md:col-span-2 xl:col-span-2">
          <CardHeader className="bg-rose-50/50 border-b border-rose-100">
            <CardTitle className="text-xl font-semibold text-rose-600">Call Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <CallMetrics metrics={metrics} />
          </CardContent>
        </Card>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-rose-600">Call Logs</h3>
        <CallList calls={agentData.calls} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-rose-600">Assigned Queries</h3>
        <QueryManager role="AGENT" agentId={agentData.id} />
      </div>
    </div>
  );
} 