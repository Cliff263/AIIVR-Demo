"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Clock, CheckCircle, UserCheck } from 'lucide-react';
import AgentStatusToggle from '@/features/agent/AgentStatusToggle';
import { CallLogs } from '@/features/calls/components/CallLogs';
import { PerformanceMetrics } from '@/features/metrics/components/PerformanceMetrics';
import { AssignedQueries } from '@/features/queries/components/AssignedQueries';
import { UserStatus } from "@prisma/client";

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

export default function AgentDashboard({ agentData }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Status and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Current Status</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <AgentStatusToggle 
              status={agentData.statusInfo?.status || 'OFFLINE'} 
              setStatus={(status) => {
                // Handle status update
                console.log('Status updated:', status);
              }}
              socket={null} // You'll need to pass the actual socket instance here
            />
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Calls Today</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{agentData.calls.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Average Handle Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">5m 30s</div>
          </CardContent>
        </Card>
        <Card className="bg-white border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">First Call Resolution</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">85%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-blue-50">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="calls" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Call Logs</TabsTrigger>
          <TabsTrigger value="queries" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Assigned Queries</TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-white border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <CallLogs showFilters={false} />
              </CardContent>
            </Card>
            <Card className="col-span-3 bg-white border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <PerformanceMetrics agentId={agentData.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calls">
          <Card className="bg-white border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Call History</CardTitle>
            </CardHeader>
            <CardContent>
              <CallLogs showFilters={true} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries">
          <Card className="bg-white border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Assigned Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignedQueries agentId={agentData.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card className="bg-white border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Detailed Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <PerformanceMetrics agentId={agentData.id} detailed />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 