"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Phone, Clock, BarChart2, AlertCircle, Zap, LineChart } from 'lucide-react';
import { TeamOverview } from '@/features/team/components/TeamOverview';
import { LiveMonitoring } from '@/features/monitoring/components/LiveMonitoring';
import { Analytics } from '@/features/analytics/components/Analytics';
import { QueryManagement } from '@/features/queries/components/QueryManagement';

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

export default function SupervisorDashboard({ supervisorData }: SupervisorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const totalCalls = supervisorData.agents.reduce((acc, agent) => acc + agent.calls.length, 0);
  const activeAgents = supervisorData.agents.filter(agent => agent.statusInfo?.status === 'ONLINE').length;
  const averageHandleTime = "5m 30s"; // This should be calculated from actual data
  const queueSize = 12; // This should be fetched from the queue system

  return (
    <div className="space-y-6">
      {/* Status and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{activeAgents}</div>
            <p className="text-xs text-blue-600">
              of {supervisorData.agents.length} total agents
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalCalls}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Queue Size</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{queueSize}</div>
            <p className="text-xs text-blue-600">
              calls waiting
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Avg Handle Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{averageHandleTime}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-blue-50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="live" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Live Monitoring</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Team</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Analytics</TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Queries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-white border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">Team Status</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamOverview agents={supervisorData.agents} />
              </CardContent>
            </Card>
            <Card className="col-span-3 bg-white border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Analytics type="overview" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <Card className="bg-white border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Live Call Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <LiveMonitoring agents={supervisorData.agents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="bg-white border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <TeamOverview agents={supervisorData.agents} detailed />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-white border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Detailed Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <Analytics type="detailed" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries">
          <Card className="bg-white border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Query Management</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryManagement supervisorId={supervisorData.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 