"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { UserRole } from "@prisma/client";
import { Search, Filter, Clock, User, AlertCircle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { CreateQueryForm } from './CreateQueryForm';

interface Query {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: Date;
  updatedAt: Date;
  assignedTo: {
    id: string;
    name: string;
  } | null;
  notes: Array<{
    id: string;
    content: string;
    createdAt: Date;
    createdBy: {
      id: string;
      name: string;
    };
  }>;
}

interface QueryManagementProps {
  userRole: UserRole;
  userId: string;
}

export function QueryManagement({ userRole, userId }: QueryManagementProps) {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const { toast } = useToast();
  const { socket } = useSocket(parseInt(userId, 10), userRole);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/users?role=AGENT');
        if (!response.ok) throw new Error('Failed to fetch agents');
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch agents",
          variant: "destructive",
        });
      }
    };

    fetchAgents();
  }, [toast]);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (searchTerm) params.append('search', searchTerm);

        const response = await fetch(`/api/queries?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch queries');
        
        const data = await response.json();
        setQueries(data);
        setLoading(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch queries",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    fetchQueries();
  }, [statusFilter, priorityFilter, searchTerm, toast]);

  useEffect(() => {
    if (!socket) return;

    const handleQueryUpdate = (updatedQuery: Query) => {
      setQueries(queries.map(query => 
        query.id === updatedQuery.id ? updatedQuery : query
      ));
      if (selectedQuery?.id === updatedQuery.id) {
        setSelectedQuery(updatedQuery);
      }
    };

    const handleNewQuery = (newQuery: Query) => {
      setQueries(prev => [newQuery, ...prev]);
    };

    socket.on('query-update', handleQueryUpdate);
    socket.on('new-query', handleNewQuery);

    return () => {
      socket.off('query-update', handleQueryUpdate);
      socket.off('new-query', handleNewQuery);
    };
  }, [socket, queries, selectedQuery]);

  const getStatusColor = (status: Query['status']) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Query['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (queryId: string, newStatus: Query['status']) => {
    try {
      const response = await fetch(`/api/queries/${queryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update query status');

      const updatedQuery = await response.json();
      setQueries(queries.map(query => 
        query.id === queryId ? updatedQuery : query
      ));

      toast({
        title: "Success",
        description: "Query status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update query status",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async (queryId: string, note: string) => {
    try {
      const response = await fetch(`/api/queries/${queryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) throw new Error('Failed to add note');

      const updatedQuery = await response.json();
      setQueries(queries.map(query => 
        query.id === queryId ? updatedQuery : query
      ));
      setSelectedQuery(updatedQuery);

      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  if (userRole !== 'SUPERVISOR') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p>You do not have permission to manage queries.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Query Management</h2>
        <CreateQueryForm agents={agents} onQueryCreated={() => {}} />
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {queries.map((query) => (
                <div
                  key={query.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedQuery?.id === query.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedQuery(query)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{query.title}</h3>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(query.status)}>
                        {query.status}
                      </Badge>
                      <Badge className={getPriorityColor(query.priority)}>
                        {query.priority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{query.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(query.createdAt).toLocaleDateString()}
                    </div>
                    {query.assignedTo && (
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {query.assignedTo.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedQuery && (
          <Card>
            <CardHeader>
              <CardTitle>Query Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <Select
                    value={selectedQuery.status}
                    onValueChange={(value: Query['status']) => handleStatusChange(selectedQuery.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <div className="space-y-2">
                    {selectedQuery.notes.map((note) => (
                      <div key={note.id} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium">{note.createdBy.name}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Add Note</h3>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Enter a note..." 
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedQuery) {
                          const input = e.target as HTMLInputElement;
                          handleAddNote(selectedQuery.id, input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Enter a note..."]') as HTMLInputElement;
                        if (selectedQuery && input.value) {
                          handleAddNote(selectedQuery.id, input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 