"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallMetrics } from "@/features/calls";
import { useSocket } from "@/hooks/useSocket";
import { AgentStatus as AgentStatusType } from "@prisma/client";

interface SupervisorDashboardProps {
  supervisorData: {
    id: string;
    name: string;
    email: string;
    role: string;
    agents: {
      id: string;
      name: string;
      email: string;
      role: string;
      status: AgentStatusType;
    }[];
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

  useEffect(() => {
    if (!socket) return;

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
      socket.off("call-started");
      socket.off("call-ended");
      socket.off("call-missed");
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-rose-600">
          Welcome back, {supervisorData.name}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="text-rose-600">Team Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <CallMetrics metrics={metrics} />
          </CardContent>
        </Card>

        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="text-rose-600">Agent Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {supervisorData.agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 bg-rose-50 rounded-lg">
                  <div>
                    <p className="font-medium text-rose-900">{agent.name}</p>
                    <p className="text-sm text-rose-600">{agent.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    agent.status === 'ONLINE' ? 'bg-success-100 text-success-800' :
                    agent.status === 'PAUSED' ? 'bg-warning-100 text-warning-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {agent.status}
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