"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallMetrics } from "@/features/calls";
import { useSocket } from "@/hooks/useSocket";
import { AgentStatus as AgentStatusType } from "@prisma/client";
import QueryManager from "@/components/queries/QueryManager";
import { ActivityLogs } from "./ActivityLogs";

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
    <div className="w-full min-h-screen p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-rose-600">
          Welcome back, {supervisorData.name}
        </h2>
      </div>
      {/* Team Metrics & Agent Status */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="text-rose-600">Team Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <CallMetrics metrics={metrics} />
          </CardContent>
        </Card>
        <Card className="border-rose-100 lg:col-span-2">
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
                    agent.status === 'ONLINE' ? 'bg-green-100 text-green-800' :
                    agent.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {agent.status}
                  </span>
                  {/* Placeholder for override button */}
                  <button className="ml-4 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Override</button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Queue Management & Call Monitoring */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="text-rose-600">Queue Management</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for real-time queue stats */}
            <div className="text-gray-500">Queue stats coming soon...</div>
          </CardContent>
        </Card>
        <Card className="border-rose-100">
          <CardHeader>
            <CardTitle className="text-rose-600">Live Call Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Placeholder for live call monitoring list */}
            <div className="text-gray-500">Live call monitoring coming soon...</div>
          </CardContent>
        </Card>
      </div>
      {/* Query Management */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-rose-600">Query Management</h3>
        <QueryManager role="SUPERVISOR" />
      </div>
      {/* Activity Logs */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-rose-600">Activity Logs</h3>
        <ActivityLogs />
      </div>
    </div>
  );
} 