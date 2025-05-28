"use client";

import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface Query {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  updatedAt: Date;
  assignedTo: string;
  notes?: string[];
}

interface AssignedQueriesProps {
  agentId: string;
}

export function AssignedQueries({ agentId }: AssignedQueriesProps) {
  const [queries, setQueries] = useState<Query[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchQueries();
  }, [agentId]);

  const fetchQueries = async () => {
    try {
      const response = await fetch(`/api/queries?agentId=${agentId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch queries');
      }
      const data = await response.json();
      setQueries(data);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch assigned queries',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Query['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-500';
      case 'IN_PROGRESS':
        return 'bg-yellow-500';
      case 'RESOLVED':
        return 'bg-green-500';
      case 'CLOSED':
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: Query['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'HIGH':
        return 'bg-red-500';
    }
  };

  const updateQueryStatus = async (queryId: string, newStatus: Query['status']) => {
    try {
      const response = await fetch('/api/queries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: queryId,
          status: newStatus,
          notes: [`Status updated to ${newStatus} at ${new Date().toLocaleString()}`]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update query status');
      }

      const updatedQuery = await response.json();
      setQueries(queries.map(query => 
        query.id === queryId ? updatedQuery : query
      ));

      toast({
        title: 'Success',
        description: 'Query status updated successfully',
      });
    } catch (error) {
      console.error('Error updating query status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update query status',
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
        <div className="space-y-4">
          {queries.map((query) => (
            <Card 
              key={query.id} 
              className={`p-4 cursor-pointer transition-colors ${
                selectedQuery?.id === query.id ? 'border-blue-500' : ''
              }`}
              onClick={() => setSelectedQuery(query)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{query.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {query.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(query.status)}>
                    {query.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(query.priority)}>
                    {query.priority}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(query.createdAt).toLocaleDateString()}
                </div>
                {query.notes && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {query.notes.length}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {selectedQuery && (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedQuery.title}</h2>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(selectedQuery.status)}>
                    {selectedQuery.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(selectedQuery.priority)}>
                    {selectedQuery.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedQuery.description}
                </p>
              </div>

              {selectedQuery.notes && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Notes</h3>
                  <div className="space-y-2">
                    {selectedQuery.notes.map((note, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {selectedQuery.status === 'OPEN' && (
                  <Button
                    onClick={() => updateQueryStatus(selectedQuery.id, 'IN_PROGRESS')}
                    className="flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Start Progress
                  </Button>
                )}
                {selectedQuery.status === 'IN_PROGRESS' && (
                  <Button
                    onClick={() => updateQueryStatus(selectedQuery.id, 'RESOLVED')}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 