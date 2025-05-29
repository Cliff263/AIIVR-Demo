"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Phone, Clock, BarChart2, AlertCircle, Zap, LineChart } from 'lucide-react';
import { TeamOverview } from '@/features/team/components/TeamOverview';
import { LiveMonitoring } from '@/features/monitoring/components/LiveMonitoring';
import { Analytics } from '@/features/analytics/components/Analytics';
import { QueryManagement } from '@/features/queries/components/QueryManagement';
import { useSocket } from "@/hooks/useSocket";
import { toast } from "sonner";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import useSWR from 'swr';

interface SupervisorDashboardProps {
  supervisorData: {
    id: string;
    name: string;
    agents: {
      id: string;
      name: string;
      calls: any[];
      statusInfo: {
        status: string;
        lastActive: Date;
      } | null;
    }[];
    calls: any[];
    statusInfo: {
      status: string;
      lastActive: Date;
    } | null;
  };
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SupervisorDashboard({ supervisorData }: SupervisorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { socket } = useSocket(supervisorData.id, 'SUPERVISOR');
  const router = useRouter();
  // Use SWR for agents
  const { data, mutate } = useSWR('/api/agents', fetcher, { fallbackData: { agents: supervisorData.agents } });
  const [agents, setAgents] = useState(data?.agents || supervisorData.agents);
  const [totalAgents, setTotalAgents] = useState(0);
  const [activeAgents, setActiveAgents] = useState(0);

  // Keep agents in sync with SWR
  useEffect(() => {
    if (data?.agents) setAgents(data.agents);
  }, [data]);

  // Fetch total and active agents count
  useEffect(() => {
    const fetchAgentCounts = async () => {
      try {
        const response = await fetch('/api/agents/counts');
        const data = await response.json();
        setTotalAgents(data.totalAgents);
        setActiveAgents(data.activeAgents);
      } catch (error) {
        console.error('Failed to fetch agent counts:', error);
      }
    };
    fetchAgentCounts();
  }, []);

  useEffect(() => {
    if (!socket) return;
    // Handle agent status updates
    const handleAgentStatusUpdate = (data: {
      agentId: string;
      status: string;
      description?: string;
      changedBy?: string;
      timestamp: Date;
      agentName?: string;
      pauseReason?: string;
    }) => {
      setAgents((prevAgents: { id: string; name: string; calls: any[]; statusInfo: any }[]) => {
        const updatedAgents = prevAgents.map((agent) =>
          agent.id === data.agentId
            ? {
                ...agent,
                statusInfo: {
                  ...agent.statusInfo,
                  status: data.status,
                  lastActive: data.timestamp ? new Date(data.timestamp) : new Date(),
                  pauseReason: data.pauseReason || undefined,
                },
              }
            : agent
        );
        return updatedAgents;
      });
      mutate(); // Revalidate SWR cache
      if (data.status === 'ONLINE') {
        setActiveAgents(prev => prev + 1);
      } else if (data.status === 'OFFLINE' || data.status === 'PAUSED') {
        setActiveAgents(prev => Math.max(0, prev - 1));
      }
    };
    socket.on('agent-status-update', handleAgentStatusUpdate);
    return () => {
      socket.off('agent-status-update', handleAgentStatusUpdate);
    };
  }, [socket, mutate]);

  const totalCalls = agents.reduce((acc: number, agent: { calls: any[] }) => acc + agent.calls.length, 0);
  const averageHandleTime = "5m 30s"; // This should be calculated from actual data
  const queueSize = 12; // This should be fetched from the queue system

  return (
    <div className="space-y-6">
      {/* Status and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-100 to-blue-300 border-blue-200 shadow-md hover:shadow-lg cursor-pointer transition-all" onClick={() => setActiveTab('team')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-900">Active Agents</CardTitle>
            <Users className="h-5 w-5 text-blue-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-900">{activeAgents}</div>
            <p className="text-xs text-blue-700">
              of {totalAgents} total agents
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-100 to-green-300 border-green-200 shadow-md hover:shadow-lg cursor-pointer transition-all" onClick={() => router.push('/supervisor/calls')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-900">Total Calls Today</CardTitle>
            <Phone className="h-5 w-5 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-green-900">{totalCalls}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-300 border-yellow-200 shadow-md hover:shadow-lg cursor-pointer transition-all" onClick={() => setActiveTab('analytics')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-900">Queue Size</CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-yellow-900">{queueSize}</div>
            <p className="text-xs text-yellow-700">
              calls waiting
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-100 to-purple-300 border-purple-200 shadow-md hover:shadow-lg cursor-pointer transition-all" onClick={() => setActiveTab('analytics')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-900">Avg Handle Time</CardTitle>
            <Clock className="h-5 w-5 text-purple-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-purple-900">{averageHandleTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-blue-50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Overview</TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Live Monitoring</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Team</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Analytics</TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-bold text-blue-900">Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
              <CardHeader className="w-full border-b-0 pb-0">
                <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="w-full pt-0">
                <Analytics userRole={UserRole.SUPERVISOR} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Live Call Monitoring</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <LiveMonitoring agents={agents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Team Management</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <TeamOverview agents={agents} detailed />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <Analytics userRole={UserRole.SUPERVISOR} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries">
          <Card className="w-full bg-white border-0 shadow-xl rounded-2xl p-6 flex flex-col items-start justify-center min-h-[320px]">
            <CardHeader className="w-full border-b-0 pb-0">
              <CardTitle className="text-2xl font-extrabold text-blue-900 mb-2">Query Management</CardTitle>
            </CardHeader>
            <CardContent className="w-full pt-0">
              <QueryManagement userRole={UserRole.SUPERVISOR} userId={supervisorData.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 