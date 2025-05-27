"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { AgentStatus as AgentStatusType } from "@prisma/client";

interface AgentStatusProps {
  status: AgentStatusType;
  socket: any;
}

export default function AgentStatus({ status, socket }: AgentStatusProps) {
  const [currentCall, setCurrentCall] = useState<{
    id: string;
    customerName: string;
    duration: number;
  } | null>(null);
  const [metrics, setMetrics] = useState({
    totalCalls: 0,
    averageHandleTime: 0,
    missedCalls: 0,
  });

  useEffect(() => {
    if (!socket) return;

    socket.on("call:started", (data: { callId: string; customerName: string }) => {
      setCurrentCall({
        id: data.callId,
        customerName: data.customerName,
        duration: 0,
      });
    });

    socket.on("call:ended", () => {
      setCurrentCall(null);
    });

    socket.on("metrics:update", (data: typeof metrics) => {
      setMetrics(data);
    });

    return () => {
      socket.off("call:started");
      socket.off("call:ended");
      socket.off("metrics:update");
    };
  }, [socket]);

  useEffect(() => {
    if (!currentCall) return;

    const timer = setInterval(() => {
      setCurrentCall((prev) => {
        if (!prev) return null;
        return { ...prev, duration: prev.duration + 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentCall]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status: AgentStatusType) => {
    switch (status) {
      case "ONLINE":
        return "bg-green-500";
      case "PAUSED":
        return "bg-yellow-500";
      case "OFFLINE":
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <Card className="border-rose-100 shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 bg-rose-50/50 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className={`h-4 w-4 rounded-full ${getStatusColor(status)}`} />
            <CardTitle className="text-lg md:text-xl font-bold text-rose-600">Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-gray-900 uppercase tracking-wide">{status}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex flex-col gap-2">
          {currentCall ? (
            <div className="flex items-center gap-2">
              <Icons.phone className="h-5 w-5 text-rose-600" />
              <span className="text-base md:text-lg font-medium text-rose-600">
                On call with {currentCall.customerName} ({formatDuration(currentCall.duration)})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Icons.phoneOff className="h-5 w-5 text-gray-400" />
              <span className="text-base md:text-lg text-gray-500">No active call</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 