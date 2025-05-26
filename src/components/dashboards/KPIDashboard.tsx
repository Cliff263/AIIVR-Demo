import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import useSWR from 'swr';

interface KPIMetrics {
  totalCalls: number;
  averageHandleTime: number;
  firstCallResolution: number;
  customerSatisfaction: number;
  queueLength: number;
  activeAgents: number;
  currentCallDuration?: number;
  callsInQueue?: number;
  averageWaitTime?: number;
  teamPerformance?: number;
}

interface KPIDashboardProps {
  role: 'AGENT' | 'SUPERVISOR';
  agentId?: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function KPIDashboard({ role, agentId }: KPIDashboardProps) {
  const [metrics, setMetrics] = useState<KPIMetrics>({
    totalCalls: 0,
    averageHandleTime: 0,
    firstCallResolution: 0,
    customerSatisfaction: 0,
    queueLength: 0,
    activeAgents: 0,
    currentCallDuration: 0,
    callsInQueue: 0,
    averageWaitTime: 0,
    teamPerformance: 0,
  });

  // Ensure valid agentId
  const validAgentId = typeof agentId === 'string' ? parseInt(agentId, 10) : agentId;
  if (!validAgentId || isNaN(validAgentId)) {
    console.warn('Invalid agentId passed to KPIDashboard/useSocket:', agentId);
  }
  const { socket } = useSocket(validAgentId || 0, role);
  
  // SWR for initial data and fallback
  const { data: initialMetrics, error } = useSWR<KPIMetrics>(
    `/api/metrics${agentId ? `?agentId=${agentId}` : ''}`,
    fetcher,
    {
      refreshInterval: 30000, // Fallback polling every 30 seconds
      onSuccess: (data) => {
        setMetrics(prev => ({ ...prev, ...data }));
      },
    }
  );

  useEffect(() => {
    if (!socket) return;

    const handleMetricsUpdate = (data: KPIMetrics) => {
      setMetrics(prev => ({ ...prev, ...data }));
    };

    const handleCallUpdate = (data: { callId: number; duration: number }) => {
      setMetrics(prev => ({
        ...prev,
        currentCallDuration: data.duration,
        totalCalls: prev.totalCalls + 1,
      }));
    };

    const handleQueueUpdate = (data: { queueLength: number; waitTime: number }) => {
      setMetrics(prev => ({
        ...prev,
        queueLength: data.queueLength,
        averageWaitTime: data.waitTime,
      }));
    };

    socket.on('metrics-update', handleMetricsUpdate);
    socket.on('call-update', handleCallUpdate);
    socket.on('queue-update', handleQueueUpdate);

    return () => {
      socket.off('metrics-update', handleMetricsUpdate);
      socket.off('call-update', handleCallUpdate);
      socket.off('queue-update', handleQueueUpdate);
    };
  }, [socket]);

  const agentMetrics = [
    {
      name: 'Current Call Duration',
      value: metrics.currentCallDuration ? `${Math.floor(metrics.currentCallDuration / 60)}m ${metrics.currentCallDuration % 60}s` : 'No active call',
      change: '+0%',
      changeType: 'neutral',
      icon: '⏱️',
      color: 'bg-primary-50 text-primary-700',
    },
    {
      name: 'Total Calls Today',
      value: metrics.totalCalls,
      change: '+4.75%',
      changeType: 'positive',
      icon: '📞',
      color: 'bg-success-50 text-success-700',
    },
    {
      name: 'Average Handle Time',
      value: `${Math.floor(metrics.averageHandleTime / 60)}m ${metrics.averageHandleTime % 60}s`,
      change: '-2.5%',
      changeType: 'positive',
      icon: '⏱️',
      color: 'bg-info-50 text-info-700',
    },
    {
      name: 'First Call Resolution',
      value: `${metrics.firstCallResolution}%`,
      change: '+1.2%',
      changeType: 'positive',
      icon: '🎯',
      color: 'bg-warning-50 text-warning-700',
    },
    {
      name: 'Customer Satisfaction',
      value: `${metrics.customerSatisfaction}%`,
      change: '+0.5%',
      changeType: 'positive',
      icon: '😊',
      color: 'bg-success-50 text-success-700',
    },
  ];

  const supervisorMetrics = [
    {
      name: 'Active Agents',
      value: metrics.activeAgents,
      change: '+2',
      changeType: 'positive',
      icon: '👥',
      color: 'bg-primary-50 text-primary-700',
    },
    {
      name: 'Calls in Queue',
      value: metrics.callsInQueue || 0,
      change: metrics.queueLength > 5 ? 'High' : 'Normal',
      changeType: metrics.queueLength > 5 ? 'negative' : 'positive',
      icon: '📊',
      color: metrics.queueLength > 5 ? 'bg-danger-50 text-danger-700' : 'bg-success-50 text-success-700',
    },
    {
      name: 'Average Wait Time',
      value: metrics.averageWaitTime ? `${Math.floor(metrics.averageWaitTime / 60)}m ${metrics.averageWaitTime % 60}s` : '0s',
      change: '-3s',
      changeType: 'positive',
      icon: '⏳',
      color: 'bg-info-50 text-info-700',
    },
    {
      name: 'Team Performance',
      value: `${metrics.teamPerformance || 0}%`,
      change: '+2.5%',
      changeType: 'positive',
      icon: '📈',
      color: 'bg-success-50 text-success-700',
    },
    {
      name: 'Customer Satisfaction',
      value: `${metrics.customerSatisfaction}%`,
      change: '+0.5%',
      changeType: 'positive',
      icon: '😊',
      color: 'bg-warning-50 text-warning-700',
    },
  ];

  const metricsData = role === 'AGENT' ? agentMetrics : supervisorMetrics;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {metricsData.map((metric) => (
        <div
          key={metric.name}
          className="bg-white overflow-hidden shadow-soft rounded-xl border border-secondary-200 hover:shadow-medium transition-all duration-200 transform hover:-translate-y-1"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{metric.icon}</span>
                  <p className="text-sm font-medium text-secondary-600">
                    {metric.name}
                  </p>
                </div>
                <p className="mt-2 text-3xl font-semibold text-secondary-900">
                  {metric.value}
                </p>
              </div>
              <div
                className={`px-2.5 py-1 rounded-full text-sm font-medium ${metric.color}`}
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