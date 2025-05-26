import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface KPIMetrics {
  totalCalls: number;
  averageHandleTime: number;
  firstCallResolution: number;
  customerSatisfaction: number;
  queueLength: number;
  activeAgents: number;
}

interface KPIDashboardProps {
  role: 'AGENT' | 'SUPERVISOR';
  agentId?: number;
}

export default function KPIDashboard({ role, agentId }: KPIDashboardProps) {
  const [metrics, setMetrics] = useState<KPIMetrics>({
    totalCalls: 0,
    averageHandleTime: 0,
    firstCallResolution: 0,
    customerSatisfaction: 0,
    queueLength: 0,
    activeAgents: 0,
  });

  const { socket } = useSocket(agentId || 0, role);

  useEffect(() => {
    if (!socket) return;

    const handleMetricsUpdate = (data: KPIMetrics) => {
      setMetrics(data);
    };

    socket.on('metrics-update', handleMetricsUpdate);

    return () => {
      socket.off('metrics-update', handleMetricsUpdate);
    };
  }, [socket]);

  const metricsData = [
    {
      name: 'Total Calls',
      value: metrics.totalCalls,
      change: '+4.75%',
      changeType: 'positive',
    },
    {
      name: 'Average Handle Time',
      value: `${Math.floor(metrics.averageHandleTime / 60)}m ${metrics.averageHandleTime % 60}s`,
      change: '-2.5%',
      changeType: 'positive',
    },
    {
      name: 'First Call Resolution',
      value: `${metrics.firstCallResolution}%`,
      change: '+1.2%',
      changeType: 'positive',
    },
    {
      name: 'Customer Satisfaction',
      value: `${metrics.customerSatisfaction}%`,
      change: '+0.5%',
      changeType: 'positive',
    },
    {
      name: 'Queue Length',
      value: metrics.queueLength,
      change: '-3',
      changeType: 'positive',
    },
    {
      name: 'Active Agents',
      value: metrics.activeAgents,
      change: '+2',
      changeType: 'positive',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {metricsData.map((metric) => (
        <div
          key={metric.name}
          className="bg-white overflow-hidden shadow-sm rounded-xl border border-gray-200"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {metric.name}
                </p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">
                  {metric.value}
                </p>
              </div>
              <div
                className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  metric.changeType === 'positive'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {metric.change}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 