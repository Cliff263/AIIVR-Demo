'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { User, UserRole } from '@prisma/client';
import { PhoneIcon, UserGroupIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

type SafeUser = Omit<User, 'passwordHash'>;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface KPI {
  label: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}

interface AgentStatus {
  id: number;
  name: string;
  status: 'online' | 'offline' | 'paused';
  pauseReason?: string;
  lastActive: Date;
  currentCall?: {
    type: 'inbound' | 'outbound';
    duration: number;
    contact: string;
  };
}

const mockKPIs: KPI[] = [
  {
    label: 'Total Calls',
    value: 156,
    change: 12,
    trend: 'up',
    icon: PhoneIcon,
  },
  {
    label: 'Average Handle Time',
    value: 245,
    change: -8,
    trend: 'down',
    icon: ClockIcon,
  },
  {
    label: 'First Call Resolution',
    value: 78,
    change: 5,
    trend: 'up',
    icon: ChartBarIcon,
  },
  {
    label: 'Active Agents',
    value: 12,
    change: 2,
    trend: 'up',
    icon: UserGroupIcon,
  },
];

interface DashboardProps {
  currentUser: SafeUser;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const [timeRange, setTimeRange] = useState('today');
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);

  // Mock data for agent statuses
  useEffect(() => {
    // This would be replaced with actual API call
    setAgentStatuses([
      {
        id: 1,
        name: 'John Doe',
        status: 'online',
        lastActive: new Date(),
        currentCall: {
          type: 'inbound',
          duration: 245,
          contact: '+1234567890',
        },
      },
      {
        id: 2,
        name: 'Jane Smith',
        status: 'paused',
        pauseReason: 'Lunch',
        lastActive: new Date(),
      },
    ]);
  }, []);

  const callVolumeData = {
    labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
    datasets: [
      {
        label: 'Call Volume',
        data: [12, 19, 15, 25, 22, 30, 28, 24],
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const callTypeData = {
    labels: ['Inbound', 'Outbound', 'Missed'],
    datasets: [
      {
        data: [65, 25, 10],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const isSupervisor = currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          {isSupervisor && (
            <p className="text-sm text-gray-500 mt-1">
              {selectedAgent ? 'Viewing Agent Details' : 'Overview'}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              timeRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Agent Status Section (Supervisor View) */}
      {isSupervisor && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Agent Status</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {agentStatuses.map((agent) => (
              <div
                key={agent.id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedAgent(agent.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`h-3 w-3 rounded-full ${
                      agent.status === 'online' ? 'bg-green-500' :
                      agent.status === 'paused' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="font-medium">{agent.name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {agent.status === 'paused' && agent.pauseReason && (
                      <span className="text-yellow-600">{agent.pauseReason}</span>
                    )}
                    {agent.currentCall && (
                      <span className="text-blue-600">
                        On call: {agent.currentCall.contact}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockKPIs.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <kpi.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="ml-3 text-sm font-medium text-gray-500">{kpi.label}</h3>
            </div>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">
                {kpi.label === 'Average Handle Time'
                  ? `${kpi.value}s`
                  : kpi.label === 'First Call Resolution' || kpi.label === 'Customer Satisfaction'
                  ? `${kpi.value}%`
                  : kpi.value}
              </p>
              <p
                className={`ml-2 text-sm font-medium ${
                  kpi.trend === 'up'
                    ? 'text-green-600'
                    : kpi.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}
              >
                {kpi.change > 0 ? '+' : ''}
                {kpi.change}%
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Call Volume</h3>
          <div className="h-80">
            <Line
              data={callVolumeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Call Distribution</h3>
          <div className="h-80 flex items-center justify-center">
            <Doughnut
              data={callTypeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 