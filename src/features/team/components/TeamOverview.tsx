"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  calls: any[];
  statusInfo: {
    status: string;
    lastActive: Date;
  } | null;
}

interface TeamOverviewProps {
  agents: Agent[];
  detailed?: boolean;
}

export function TeamOverview({ agents, detailed = false }: TeamOverviewProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'bg-green-500';
      case 'PAUSED':
        return 'bg-yellow-500';
      case 'OFFLINE':
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return 'Available';
      case 'PAUSED':
        return 'Paused';
      case 'OFFLINE':
      default:
        return 'Offline';
    }
  };

  if (!detailed) {
    return (
      <div className="space-y-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(agent.statusInfo?.status || 'OFFLINE')}`} />
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getStatusText(agent.statusInfo?.status || 'OFFLINE')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{agent.calls.length} calls</p>
                <p className="text-xs text-muted-foreground">
                  Last active: {new Date(agent.statusInfo?.lastActive || '').toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(agent.statusInfo?.status || 'OFFLINE')}`} />
              <div>
                <p className="font-medium">{agent.name}</p>
                <p className="text-sm text-muted-foreground">
                  {getStatusText(agent.statusInfo?.status || 'OFFLINE')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <UserCheck className="w-4 h-4 mr-2" />
                View Details
              </Button>
              {agent.statusInfo?.status === 'PAUSED' && (
                <Button variant="outline" size="sm">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>Calls Today</span>
              </div>
              <p className="text-xl font-semibold mt-1">{agent.calls.length}</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Avg Handle Time</span>
              </div>
              <p className="text-xl font-semibold mt-1">5m 30s</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4" />
                <span>First Call Resolution</span>
              </div>
              <p className="text-xl font-semibold mt-1">85%</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Last Active: {new Date(agent.statusInfo?.lastActive || '').toLocaleTimeString()}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                Total Calls: {agent.calls.length}
              </div>
            </div>
            <Badge variant="outline">
              {agent.statusInfo?.status === 'ONLINE' ? 'Available' : 
               agent.statusInfo?.status === 'PAUSED' ? 'Paused' : 'Offline'}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
} 