"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CallLogs from '@/components/calls/CallLogs';
import KPIDashboard from '@/components/dashboards/KPIDashboard';
import QueryManager from '@/components/queries/QueryManager';
import AgentStatus from '@/components/AgentStatus';

interface AgentDashboardProps {
  user: {
    id: number;
    name: string;
    role: 'AGENT';
    status: {
      status: 'ONLINE' | 'PAUSED' | 'OFFLINE';
      pauseReason?: string;
    } | null;
  };
}

export default function AgentDashboard({ user }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Agent Dashboard
            </h1>
            <AgentStatus agentId={user.id} role="AGENT" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, {user.name}. Here's your activity overview.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calls">Call Logs</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <KPIDashboard role="AGENT" agentId={user.id} />
          </TabsContent>

          <TabsContent value="calls">
            <CallLogs role="AGENT" agentId={user.id} />
          </TabsContent>

          <TabsContent value="queries">
            <QueryManager role="AGENT" agentId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 