"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CallLogs from '@/components/calls/CallLogs';
import KPIDashboard from '@/components/dashboards/KPIDashboard';
import QueryManager from '@/components/queries/QueryManager';
import AgentStatus from '@/components/AgentStatus';

interface Agent {
  id: number;
  name: string;
  email: string;
  role: 'AGENT';
  status: {
    status: 'ONLINE' | 'PAUSED' | 'OFFLINE';
    pauseReason?: string;
  } | null;
}

interface SupervisorDashboardProps {
  user: {
    id: number;
    name: string;
    role: 'SUPERVISOR';
    agents: Agent[];
  };
}

export default function SupervisorDashboard({ user }: SupervisorDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Supervisor Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <select
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={selectedAgent?.id || ''}
                onChange={(e) => {
                  const agent = user.agents.find(a => a.id === Number(e.target.value));
                  setSelectedAgent(agent || null);
                }}
                aria-label="Select agent"
              >
                <option value="">All Agents</option>
                {user.agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, {user.name}. Here's your team's activity overview.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="calls">Call Logs</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <KPIDashboard role="SUPERVISOR" agentId={selectedAgent?.id} />
            
            {/* Agent Status Overview */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Agent Status Overview</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {user.agents.map(agent => (
                    <div
                      key={agent.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.email}</p>
                      </div>
                      <AgentStatus agentId={agent.id} role="SUPERVISOR" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <CallLogs role="SUPERVISOR" agentId={selectedAgent?.id} />
          </TabsContent>

          <TabsContent value="queries">
            <QueryManager role="SUPERVISOR" agentId={selectedAgent?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 