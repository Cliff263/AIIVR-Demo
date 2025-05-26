"use client";

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CallLogs from '@/components/calls/CallLogs';
import KPIDashboard from '@/components/dashboards/KPIDashboard';
import QueryManager from '@/components/queries/QueryManager';
import AgentStatus from '@/components/AgentStatus';
import { useSocket } from '@/hooks/useSocket';
import { AgentStatus as AgentStatusType } from '@prisma/client';

interface Agent {
  id: string;
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
    id: string;
    name: string;
    role: 'SUPERVISOR';
    agents: Agent[];
  };
}

export default function SupervisorDashboard({ user }: SupervisorDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'PAUSED'>('ALL');

  // Ensure valid supervisorId for socket
  const supervisorId = user?.id ? parseInt(user.id, 10) : 0;
  const { socket } = useSocket(supervisorId, user?.role || 'SUPERVISOR');

  // Handle incoming call notifications
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      console.log('Incoming call:', data);
      setIncomingCall(data);

      const timer = setTimeout(() => {
        setIncomingCall(null);
      }, 5000);

      return () => clearTimeout(timer);
    };

    // Handle real-time agent status updates
    const handleAgentStatusUpdate = (data: { agentId: string; status: AgentStatusType; pauseReason?: string }) => {
        console.log('Received agent status update in Supervisor Dashboard:', data);
        // Find the agent in the list and update their status
        user.agents = user.agents.map(agent => 
            agent.id === data.agentId ? { ...agent, status: { status: data.status, pauseReason: data.pauseReason || undefined } } : agent
        );
        // Force a state update to re-render the list (consider a better state management solution for larger apps)
        setSelectedAgent(null); // A simple way to trigger re-render of the list below
    };

    socket.on('incoming-call', handleIncomingCall);
    socket.on('agent-status-update', handleAgentStatusUpdate);

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('agent-status-update', handleAgentStatusUpdate);
    };
  }, [socket, user.agents]);

  // Filter agents based on selected status
  const filteredAgents = useMemo(() => {
    if (filterStatus === 'ALL') {
      return user.agents;
    }
    return user.agents.filter(agent => agent.status?.status === filterStatus);
  }, [user.agents, filterStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Supervisor Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Welcome back, {user.name}. Monitor and manage your team's performance.
              </p>
            </div>
            <div className="flex items-center gap-4">
               {/* Incoming Call Notification */}
               {incomingCall && (
                 <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                   <p className="font-bold">Incoming Call!</p>
                   <p>From: {incomingCall.phoneNumber}</p>
                 </div>
               )}
              <div className="text-sm text-gray-600">
                Active Agents: {user.agents.filter(a => a.status?.status === 'ONLINE').length}/{user.agents.length}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Filter and Selection */}
        <div className="mb-6 flex items-center gap-4">
           {/* Agent Status Filter */}
           <div>
             <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
             <select
                id="status-filter"
                className="w-48 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'ONLINE' | 'OFFLINE' | 'PAUSED')}
             >
               <option value="ALL">All Statuses</option>
               <option value="ONLINE">Online</option>
               <option value="OFFLINE">Offline</option>
               <option value="PAUSED">Paused</option>
             </select>
           </div>
           {/* Agent Selection - Optional, keep if needed for agent-specific views */}
           {/* <div className="flex-1">
             <label htmlFor="agent-select" className="block text-sm font-medium text-gray-700 mb-2">
               Select Agent
             </label>
             <select
               id="agent-select"
               className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
               value={selectedAgent?.id || ''}
               onChange={(e) => {
                 const agent = user.agents.find(a => a.id === e.target.value);
                 setSelectedAgent(agent || null);
               }}
             >
               <option value="">Select Agent for Details</option>
               {user.agents.map(agent => (
                 <option key={agent.id} value={agent.id}>
                   {agent.name}
                 </option>
               ))}
             </select>
           </div> */}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-white shadow-sm rounded-lg p-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Team Overview
            </TabsTrigger>
            <TabsTrigger value="calls" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Call History
            </TabsTrigger>
            <TabsTrigger value="queries" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
              Query Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Performance Overview</h2>
                <KPIDashboard role="SUPERVISOR" agentId={selectedAgent ? parseInt(selectedAgent.id) : undefined} />
              </div>
            </div>
            
            {/* Agent Status Overview */}
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Agent Status Overview</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAgents.map(agent => (
                    <div
                      key={agent.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition-all duration-200 transform hover:-translate-y-1"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-600">{agent.email}</p>
                      </div>
                      <AgentStatus agentId={parseInt(agent.id)} role="SUPERVISOR" initialStatus={agent.status?.status} initialPauseReason={agent.status?.pauseReason} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Call History</h2>
                <CallLogs role="SUPERVISOR" agentId={selectedAgent ? parseInt(selectedAgent.id) : undefined} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="queries">
            <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Query Management</h2>
                <QueryManager role="SUPERVISOR" agentId={selectedAgent ? parseInt(selectedAgent.id) : undefined} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 