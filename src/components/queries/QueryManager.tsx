import { useState, useEffect } from 'react';
import { QueryStatus, QueryPriority } from '@prisma/client';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Query {
  id: number;
  title: string;
  description: string;
  status: QueryStatus;
  priority: QueryPriority;
  assignedTo?: {
    id: number;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface QueryManagerProps {
  role: 'AGENT' | 'SUPERVISOR';
  agentId?: number;
}

export default function QueryManager({ role, agentId }: QueryManagerProps) {
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState([]);
  const [queries, setQueries] = useState<Query[]>([]);

  // Fetch queries and agents on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch queries
        const queriesResponse = await fetch('/api/queries');
        const queriesData = await queriesResponse.json();
        setQueries(queriesData);

        // Fetch agents if user is a supervisor
        if (role === 'SUPERVISOR') {
          const agentsResponse = await fetch('/api/agents');
          const agentsData = await agentsResponse.json();
          setAgents(agentsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [role]);

  // Handle query creation
  const handleCreateQuery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      const response = await fetch('/api/queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.get('title'),
          description: formData.get('description'),
          status: formData.get('status'),
          priority: formData.get('priority'),
          assignedTo: formData.get('assignedTo'),
        }),
      });

      if (response.ok) {
        const newQuery = await response.json();
        setQueries(prev => [...prev, newQuery]);
        setIsCreating(false);
      } else {
        console.error('Failed to create query');
      }
    } catch (error) {
      console.error('Error creating query:', error);
    }
  };

  // Filter queries based on search term
  const filteredQueries = queries.filter(query => 
    query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    query.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: QueryStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-black text-white';
      case 'IN_PROGRESS':
        return 'bg-black text-white';
      case 'RESOLVED':
        return 'bg-black text-white';
      case 'CLOSED':
        return 'bg-black text-white';
      default:
        return 'bg-black text-white';
    }
  };

  const getPriorityColor = (priority: QueryPriority) => {
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

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-sm rounded-xl border border-black overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-xl font-semibold text-black">Query Management</h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <input
            type="text"
            placeholder="Search queries..."
            className="rounded-md border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-black">
            <thead className="bg-black">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-black">
              {filteredQueries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-black">
                    No queries found
                  </td>
                </tr>
              ) : (
                filteredQueries.map((query) => (
                  <tr key={query.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{query.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.priority}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.assignedTo?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href="#" className="text-indigo-600 hover:text-indigo-900">View</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Query Details Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Query Details</h3>
              <button
                onClick={() => setSelectedQuery(null)}
                className="text-black hover:text-black"
                title="Close query details"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-black">Title</p>
                <p className="mt-1 text-sm text-black">{selectedQuery.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Description</p>
                <p className="mt-1 text-sm text-black">{selectedQuery.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedQuery.status)}`}>
                  {selectedQuery.status}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Priority</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedQuery.priority)}`}>
                  {selectedQuery.priority}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-black">Assigned To</p>
                <p className="mt-1 text-sm text-black">{selectedQuery.assignedTo?.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Query Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-black">Create New Query</h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-black hover:text-black"
                title="Close create query form"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleCreateQuery} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-black">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="mt-1 block w-full rounded-md border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-black">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  required
                  className="mt-1 block w-full rounded-md border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-black">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  className="mt-1 block w-full rounded-md border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-black">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  className="mt-1 block w-full rounded-md border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-black">
                  Assign To
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  required
                  className="mt-1 block w-full rounded-md border-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="inline-flex items-center px-4 py-2 border border-black text-sm font-medium rounded-md text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 