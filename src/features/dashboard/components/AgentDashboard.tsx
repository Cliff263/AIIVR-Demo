"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AgentStatus } from "@/features/agent";
import { AgentStatusToggle } from "@/features/agent";
import { CallMetrics } from "@/features/calls";
import { useSocket } from "@/hooks/useSocket";
import { Call, AgentStatus as AgentStatusType } from "@prisma/client";

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
  const userId = parseInt(agentData.id, 10);
  const { socket } = useSocket(userId, 'AGENT');
  const [status, setStatus] = useState<AgentStatusType>(agentData.status || "OFFLINE");
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    averageHandleTime: 0,
    missedCalls: 0,
  });

  useEffect(() => {
    if (!socket) return;

    // Listen for live agent status updates
    const handleStatusUpdate = (data: { status: AgentStatusType }) => {
      setStatus(data.status);
    };
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-rose-600">
          Welcome back, {agentData.name}
        </h2>
        <AgentStatusToggle status={status} setStatus={setStatus} socket={socket} />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <Card className="border-rose-100 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="bg-rose-50/50 border-b border-rose-100">
            <CardTitle className="text-xl font-semibold text-rose-600">Your Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <AgentStatus status={status} socket={socket} />
          </CardContent>
        </Card>

        <Card className="border-rose-100 shadow-md hover:shadow-lg transition-shadow md:col-span-2 xl:col-span-2">
          <CardHeader className="bg-rose-50/50 border-b border-rose-100">
            <CardTitle className="text-xl font-semibold text-rose-600">Call Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <CallMetrics metrics={metrics} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 