"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Clock, CheckCircle, UserCheck } from 'lucide-react';
import AgentStatusToggle from '@/features/agent/AgentStatusToggle';
import { CallLogs } from '@/features/calls/components/CallLogs';
import { PerformanceMetrics } from '@/features/metrics/components/PerformanceMetrics';
import { AssignedQueries } from '@/features/queries/components/AssignedQueries';
import { UserStatus } from "@prisma/client";
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { AgentActivityLogs } from '@/features/activity/components/AgentActivityLogs';
import useSWR from 'swr';

interface Call {
  id: string;
  timestamp: Date;
  duration: number;
  type: string;
  status: string;
}

interface AgentDashboardProps {
  agentData: {
    id: string;
    name: string;
    calls: Call[];
    statusInfo: {
      status: UserStatus;
      lastActive: Date;
    } | null;
  };
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AgentDashboard({ agentData }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { socket } = useSocket(agentData?.id || null, 'AGENT');
  const { data: metrics, mutate: mutateMetrics } = useSWR(`/api/metrics?agentId=${agentData.id}`, fetcher, { refreshInterval: 0 });

  useEffect(() => {
    if (!socket) return;

    // Handle status updates from supervisor
    const handleStatusUpdate = (data: {
      status: string;
      changedBy?: string;
      description?: string;
      timestamp: Date;
    }) => {
      toast.info(
        `Your status has been changed to ${data.status}${data.changedBy ? ` by ${data.changedBy}` : ''}`,
        {
          description: data.description,
          duration: 5000
        }
      );
    };

    // Handle supervisor intervention
    const handleSupervisorIntervention = (data: {
      description: string;
      timestamp: Date;
    }) => {
      toast.warning(
        'Supervisor Intervention',
        {
          description: data.description,
          duration: 5000
        }
      );
    };

    // Listen for real-time metric updates
    const handleMetricUpdate = () => {
      mutateMetrics();
    };

    // Join agent room for notifications
    socket.emit('join-room', `agent-${agentData.id}`);

    // Listen for events
    socket.on('status-update', handleStatusUpdate);
    socket.on('supervisor-intervention', handleSupervisorIntervention);
    socket.on('agent-performance-update', handleMetricUpdate);
    socket.on('call-update', handleMetricUpdate);

    return () => {
      socket.off('status-update', handleStatusUpdate);
      socket.off('supervisor-intervention', handleSupervisorIntervention);
      socket.off('agent-performance-update', handleMetricUpdate);
      socket.off('call-update', handleMetricUpdate);
    };
  }, [socket, agentData.id, mutateMetrics]);

  if (!agentData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
          <p className="text-gray-500">Please wait while we load your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Metrics Cards (without Current Status) */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-100 to-green-300 border-green-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-900">Total Calls Today</CardTitle>
            <Phone className="h-5 w-5 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-green-900">{metrics?.callsHandled ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-100 to-purple-300 border-purple-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-900">Average Handle Time</CardTitle>
            <Clock className="h-5 w-5 text-purple-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-purple-900">{metrics ? `${Math.floor(metrics.averageHandleTime / 60)}m ${Math.round(metrics.averageHandleTime % 60)}s` : '0m 0s'}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-300 border-yellow-200 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-900">First Call Resolution</CardTitle>
            <CheckCircle className="h-5 w-5 text-yellow-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-yellow-900">{metrics?.firstCallResolution ?? 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-blue-50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Overview</TabsTrigger>
          <TabsTrigger value="calls" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Call Logs</TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Assigned Queries</TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Performance</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
              <CardHeader className="w-full border-b-0 pb-0">
                <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="w-full pt-0">
                <PerformanceMetrics agentId={agentData.id} detailed />
              </CardContent>
            </Card>
            <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
              <CardHeader className="w-full border-b-0 pb-0">
                <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="w-full pt-0">
                <CallLogs showFilters={false} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Call History</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <CallLogs showFilters={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Assigned Queries</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <AssignedQueries agentId={agentData.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Detailed Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <PerformanceMetrics agentId={agentData.id} detailed />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Activity Logs</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <AgentActivityLogs userId={agentData.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 