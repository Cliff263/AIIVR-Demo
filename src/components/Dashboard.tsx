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
import AgentStatus from './AgentStatus';

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
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  change?: string;
}

interface AgentStatus {
  userId: number;
  status: 'ONLINE' | 'OFFLINE' | 'PAUSED';
  pauseReason?: string | null;
  lastActive: Date;
}

interface DashboardProps {
  user: SafeUser;
}

export default function Dashboard({ user }: DashboardProps) {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [timeRange, setTimeRange] = useState('today');

  // Mock data for agent statuses
  useEffect(() => {
    setAgentStatuses([
      {
        userId: 1,
        status: 'ONLINE',
        lastActive: new Date(),
      },
      {
        userId: 2,
        status: 'PAUSED',
        pauseReason: 'LUNCH',
        lastActive: new Date(),
      },
    ]);
  }, []);

  const handleResumeAgent = (agentId: number) => {
    setAgentStatuses((prev) =>
      prev.map((status) =>
        status.userId === agentId
          ? { ...status, status: 'ONLINE', pauseReason: null }
          : status
      )
    );
  };

  const kpis: KPI[] = [
    {
      label: 'Total Calls',
      value: '1,234',
      icon: PhoneIcon,
      change: '+12%',
    },
    {
      label: 'Average Handle Time',
      value: '4m 32s',
      icon: ClockIcon,
      change: '-5%',
    },
    {
      label: 'Active Agents',
      value: agentStatuses.filter((status) => status.status === 'ONLINE').length,
      icon: UserGroupIcon,
    },
    {
      label: 'First Call Resolution',
      value: '85%',
      icon: ChartBarIcon,
      change: '+2%',
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          {user.role === 'SUPERVISOR' && (
            <p className="text-sm text-gray-500 mt-1">
              {agentStatuses.length > 0 ? 'Viewing Agent Details' : 'Overview'}
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
      {user.role === 'SUPERVISOR' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Agent Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agentStatuses.map((status) => (
                <AgentStatus
                  key={status.userId}
                  agent={{ id: status.userId, name: `Agent ${status.userId}`, role: 'AGENT' } as SafeUser}
                  isSupervisor
                  onResumeAgent={handleResumeAgent}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <kpi.icon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{kpi.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{kpi.value}</p>
                {kpi.change && (
                  <p
                    className={`text-sm ${
                      kpi.change.startsWith('+')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {kpi.change}
                  </p>
                )}
              </div>
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