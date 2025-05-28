"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mic, Headphones, Volume2, VolumeX, MessageSquare, Clock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface Agent {
  id: string;
  name: string;
  calls: any[];
  statusInfo: {
    status: string;
    lastActive: Date;
  } | null;
}

interface LiveMonitoringProps {
  agents: Agent[];
}

interface ActiveCall {
  id: string;
  agentId: string;
  agentName: string;
  phoneNumber: string;
  startTime: Date;
  duration: number;
  type: 'INBOUND' | 'OUTBOUND';
}

export function LiveMonitoring({ agents }: LiveMonitoringProps) {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [monitoringCall, setMonitoringCall] = useState<string | null>(null);
  const [isWhispering, setIsWhispering] = useState(false);
  const [isBarging, setIsBarging] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActiveCalls = async () => {
    try {
      const response = await fetch('/api/monitoring');
      if (!response.ok) {
        throw new Error('Failed to fetch active calls');
      }
      const data = await response.json();
      setActiveCalls(data);
    } catch (error) {
      console.error('Error fetching active calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch active calls',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handleMonitor = async (callId: string) => {
    try {
      if (monitoringCall === callId) {
        const response = await fetch('/api/monitoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callId,
            action: 'STOP_MONITORING'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to stop monitoring');
        }

        setMonitoringCall(null);
        setIsWhispering(false);
        setIsBarging(false);
      } else {
        const response = await fetch('/api/monitoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            callId,
            action: 'START_MONITORING'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start monitoring');
        }

        setMonitoringCall(callId);
      }
    } catch (error) {
      console.error('Error handling monitoring:', error);
      toast({
        title: 'Error',
        description: 'Failed to handle monitoring action',
        variant: 'destructive'
      });
    }
  };

  const handleWhisper = async (callId: string) => {
    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          action: isWhispering ? 'STOP_WHISPER' : 'START_WHISPER'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to handle whisper action');
      }

      setIsWhispering(!isWhispering);
      if (isBarging) setIsBarging(false);
    } catch (error) {
      console.error('Error handling whisper:', error);
      toast({
        title: 'Error',
        description: 'Failed to handle whisper action',
        variant: 'destructive'
      });
    }
  };

  const handleBarge = async (callId: string) => {
    try {
      const response = await fetch('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          action: isBarging ? 'STOP_BARGE' : 'START_BARGE'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to handle barge action');
      }

      setIsBarging(!isBarging);
      if (isWhispering) setIsWhispering(false);
    } catch (error) {
      console.error('Error handling barge:', error);
      toast({
        title: 'Error',
        description: 'Failed to handle barge action',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {activeCalls.map((call) => (
          <Card key={call.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                <div>
                  <p className="font-medium">{call.agentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {call.phoneNumber}
                  </p>
                </div>
              </div>
              <Badge variant="outline">
                {call.type}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Started: {new Date(call.startTime).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Duration: {formatDuration(call.duration)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={monitoringCall === call.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleMonitor(call.id)}
                className="flex items-center gap-2"
              >
                <Headphones className="w-4 h-4" />
                {monitoringCall === call.id ? 'Stop Monitoring' : 'Monitor'}
              </Button>

              {monitoringCall === call.id && (
                <>
                  <Button
                    variant={isWhispering ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleWhisper(call.id)}
                    className="flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    {isWhispering ? 'Stop Whispering' : 'Whisper'}
                  </Button>

                  <Button
                    variant={isBarging ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleBarge(call.id)}
                    className="flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    {isBarging ? 'Stop Barge' : 'Barge'}
                  </Button>
                </>
              )}
            </div>

            {monitoringCall === call.id && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isWhispering ? (
                      <Mic className="w-4 h-4 text-blue-500" />
                    ) : isBarging ? (
                      <Volume2 className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Headphones className="w-4 h-4 text-blue-500" />
                    )}
                    <span className="text-sm font-medium">
                      {isWhispering ? 'Whispering' : 
                       isBarging ? 'Barging' : 'Monitoring'}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMonitoringCall(null);
                      setIsWhispering(false);
                      setIsBarging(false);
                    }}
                  >
                    <VolumeX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {activeCalls.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No active calls to monitor</p>
        </div>
      )}
    </div>
  );
} 