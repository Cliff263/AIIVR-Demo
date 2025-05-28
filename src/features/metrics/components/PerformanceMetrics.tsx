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
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Calls Handled</h3>
            <p className="text-2xl font-bold mt-1">{metrics.callsHandled}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Handle Time</h3>
            <p className="text-2xl font-bold mt-1">{formatTime(metrics.averageHandleTime)}</p>
          </Card>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>First Call Resolution</span>
            <span>{metrics.firstCallResolution}%</span>
          </div>
          <Progress value={metrics.firstCallResolution} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Customer Satisfaction</span>
            <span>{metrics.customerSatisfaction}%</span>
          </div>
          <Progress value={metrics.customerSatisfaction} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Calls Handled</h3>
          <p className="text-2xl font-bold mt-1">{metrics.callsHandled}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Avg Handle Time</h3>
          <p className="text-2xl font-bold mt-1">{formatTime(metrics.averageHandleTime)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">First Call Resolution</h3>
          <p className="text-2xl font-bold mt-1">{metrics.firstCallResolution}%</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground">Customer Satisfaction</h3>
          <p className="text-2xl font-bold mt-1">{metrics.customerSatisfaction}%</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Daily Call Volume</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.dailyCalls}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="calls" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Handle Time by Call Type</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={metrics.handleTimeByType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip formatter={(value) => formatTime(value as number)} />
              <Bar dataKey="time" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
} 