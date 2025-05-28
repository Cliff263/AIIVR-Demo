"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useSocket } from '@/hooks/useSocket';

interface Call {
  id: string;
  type: 'INBOUND' | 'OUTBOUND' | 'MISSED';
  phoneNumber: string;
  duration?: number;
  timestamp: Date;
  recordingUrl?: string;
  status: 'COMPLETED' | 'MISSED' | 'FAILED';
  notes?: string;
}

interface CallLogsProps {
  showFilters?: boolean;
}

export function CallLogs({ showFilters = true }: CallLogsProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [filter, setFilter] = useState<'all' | 'inbound' | 'outbound' | 'missed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // TODO: Replace with actual userId and role from context or props
  const userId = 1;
  const role = 'AGENT';
  const { socket } = useSocket(userId, role);

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleCallCreated = (newCall: Call) => {
      setCalls((prev) => [newCall, ...prev]);
      toast({ title: 'New Call', description: 'A new call was logged.' });
    };
    socket.on('call-created', handleCallCreated);
    return () => {
      socket.off('call-created', handleCallCreated);
    };
  }, [socket, toast]);

  const fetchCalls = async () => {
    try {
      const response = await fetch('/api/calls');
      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }
      const data = await response.json();
      setCalls(data);
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch call logs',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCalls = calls.filter(call => {
    if (filter === 'all') return true;
    return call.type.toLowerCase() === filter;
  });

  const getCallIcon = (type: Call['type']) => {
    switch (type) {
      case 'INBOUND':
        return <PhoneIncoming className="w-4 h-4 text-green-500" />;
      case 'OUTBOUND':
        return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
      case 'MISSED':
        return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const handlePlayback = (call: Call) => {
    if (selectedCall?.id === call.id) {
      setIsPlaying(!isPlaying);
    } else {
      setSelectedCall(call);
      setIsPlaying(true);
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
      {showFilters && (
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'inbound' ? 'default' : 'outline'}
            onClick={() => setFilter('inbound')}
          >
            Inbound
          </Button>
          <Button
            variant={filter === 'outbound' ? 'default' : 'outline'}
            onClick={() => setFilter('outbound')}
          >
            Outbound
          </Button>
          <Button
            variant={filter === 'missed' ? 'default' : 'outline'}
            onClick={() => setFilter('missed')}
          >
            Missed
          </Button>
        </div>
      )}

      {filteredCalls.length > 0 ? (
        filteredCalls.map((call) => (
          <Card key={call.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getCallIcon(call.type)}
                <div>
                  <p className="font-medium">{call.phoneNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(call.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {formatDuration(call.duration)}
                </div>
                {call.recordingUrl && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlayback(call)}
                    >
                      {selectedCall?.id === call.id && isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(call.recordingUrl, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {call.notes && (
              <p className="mt-2 text-sm text-muted-foreground">{call.notes}</p>
            )}
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-4">No calls found</p>
      )}
    </div>
  );
} 