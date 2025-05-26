"use client";

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { User, AgentStatus } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CallLogs from '@/components/calls/CallLogs';
import QueryManager from '@/components/queries/QueryManager';
import KPIDashboard from '@/components/dashboards/KPIDashboard';

interface AgentDashboardProps {
  user: User & {
    agentStatus?: {
      status: AgentStatus;
      pauseReason?: string;
    } | null;
  };
}

export default function AgentDashboard({ user }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Ensure user and user.id are available before proceeding
  if (!user || !user.id) {
    console.warn('AgentDashboard: User data not available, not rendering.');
    return null; // Or render a loading/error state
  }

  const { socket } = useSocket(parseInt(user.id), user.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back, {user.name}. Manage your calls and queries.
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-white shadow-sm rounded-lg p-1">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="calls" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
                Call Logs
              </TabsTrigger>
              <TabsTrigger value="queries" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
                Queries
              </TabsTrigger>
              <TabsTrigger value="performance" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <KPIDashboard role="AGENT" agentId={parseInt(user.id)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="calls">
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <CallLogs agentId={parseInt(user.id)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="queries">
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <QueryManager agentId={parseInt(user.id)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance">
              <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Overview</h2>
                  {/* Add performance metrics and charts here */}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 