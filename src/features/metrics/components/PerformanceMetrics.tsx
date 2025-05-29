"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from "@/components/ui/use-toast";

interface PerformanceMetricsProps {
  agentId: string;
  detailed?: boolean;
}

interface MetricsData {
  callsHandled: number;
  averageHandleTime: number;
  firstCallResolution: number;
  customerSatisfaction: number;
  dailyCalls: Array<{
    day: string;
    calls: number;
  }>;
  handleTimeByType: Array<{
    type: string;
    time: number;
  }>;
}

export function PerformanceMetrics({ agentId, detailed = false }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, [agentId]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/metrics?agentId=${agentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance metrics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No metrics available
      </div>
    );
  }

  if (!detailed) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-100 to-blue-300 border-blue-200 shadow-md rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900">Calls Handled</h3>
            <p className="text-2xl font-extrabold text-blue-900 mt-1">{metrics.callsHandled}</p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-100 to-purple-300 border-purple-200 shadow-md rounded-xl p-4">
            <h3 className="text-sm font-semibold text-purple-900">Avg Handle Time</h3>
            <p className="text-2xl font-extrabold text-purple-900 mt-1">{formatTime(metrics.averageHandleTime)}</p>
          </Card>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold text-green-900">
            <span>First Call Resolution</span>
            <span>{metrics.firstCallResolution}%</span>
          </div>
          <Progress value={metrics.firstCallResolution} className="h-2 bg-green-200" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-semibold text-yellow-900">
            <span>Customer Satisfaction</span>
            <span>{metrics.customerSatisfaction}%</span>
          </div>
          <Progress value={metrics.customerSatisfaction} className="h-2 bg-yellow-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-100 to-blue-300 border-blue-200 shadow-md rounded-xl">
          <h3 className="text-sm font-semibold text-blue-900">Calls Handled</h3>
          <p className="text-2xl font-extrabold text-blue-900 mt-1">{metrics.callsHandled}</p>
        </Card>
        <Card className="bg-gradient-to-br from-purple-100 to-purple-300 border-purple-200 shadow-md rounded-xl">
          <h3 className="text-sm font-semibold text-purple-900">Avg Handle Time</h3>
          <p className="text-2xl font-extrabold text-purple-900 mt-1">{formatTime(metrics.averageHandleTime)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-green-100 to-green-300 border-green-200 shadow-md rounded-xl">
          <h3 className="text-sm font-semibold text-green-900">First Call Resolution</h3>
          <p className="text-2xl font-extrabold text-green-900 mt-1">{metrics.firstCallResolution}%</p>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-300 border-yellow-200 shadow-md rounded-xl">
          <h3 className="text-sm font-semibold text-yellow-900">Customer Satisfaction</h3>
          <p className="text-2xl font-extrabold text-yellow-900 mt-1">{metrics.customerSatisfaction}%</p>
        </Card>
      </div>

      <Card className="p-4 bg-white shadow-lg rounded-xl">
        <h3 className="text-base font-bold text-blue-900 mb-4">Daily Call Volume</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.dailyCalls}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke="#3b82f6" fontSize={12} fontWeight="bold" label={{ value: 'Day', position: 'insideBottom', offset: -5, fill: '#3b82f6' }} />
              <YAxis stroke="#3b82f6" fontSize={12} fontWeight="bold" label={{ value: 'Calls', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
              <Tooltip contentStyle={{ background: '#f1f5f9', borderRadius: 8, color: '#1e293b' }} />
              <Bar dataKey="calls" fill="#3b82f6" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 bg-white shadow-lg rounded-xl">
        <h3 className="text-base font-bold text-blue-900 mb-4">Handle Time by Call Type</h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.handleTimeByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" stroke="#a21caf" fontSize={12} fontWeight="bold" label={{ value: 'Type', position: 'insideBottom', offset: -5, fill: '#a21caf' }} />
              <YAxis stroke="#a21caf" fontSize={12} fontWeight="bold" label={{ value: 'Time (s)', angle: -90, position: 'insideLeft', fill: '#a21caf' }} />
              <Tooltip formatter={(value) => formatTime(value as number)} contentStyle={{ background: '#f3e8ff', borderRadius: 8, color: '#581c87' }} />
              <Bar dataKey="time" fill="#a21caf" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 