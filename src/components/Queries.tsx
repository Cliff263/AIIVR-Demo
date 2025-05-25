'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import type { Query, User } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

interface QueryWithAssignee extends Query {
  assignee: SafeUser;
}

interface QueriesProps {
  queries?: QueryWithAssignee[];
  onStatusChange?: (queryId: number, newStatus: string) => void;
  onAssign?: (queryId: number, assigneeId: number) => void;
  currentUser: SafeUser;
  availableAssignees?: SafeUser[];
}

export default function Queries({ 
  queries = [], 
  onStatusChange, 
  onAssign, 
  currentUser,
  availableAssignees = []
}: QueriesProps) {
  const [selectedQuery, setSelectedQuery] = useState<QueryWithAssignee | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-600';
      case 'in-progress':
        return 'text-yellow-600';
      case 'open':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg divide-y">
        {queries.map((query) => (
          <div
            key={query.id}
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedQuery(query)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{query.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{query.description}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`text-sm font-medium ${getStatusColor(query.status)}`}>
                    {query.status}
                  </span>
                  <span className={`text-sm font-medium ${getPriorityColor(query.priority)}`}>
                    {query.priority} priority
                  </span>
                  <span className="text-sm text-gray-500">
                    Assigned to: {query.assignee.name}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-shrink-0">
                <span className="text-sm text-gray-500">
                  {format(query.createdAt, 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Query Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Title</dt>
                <dd className="mt-1">{selectedQuery.title}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1">{selectedQuery.description}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className={`mt-1 ${getStatusColor(selectedQuery.status)}`}>
                  {selectedQuery.status}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className={`mt-1 ${getPriorityColor(selectedQuery.priority)}`}>
                  {selectedQuery.priority}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1">{selectedQuery.assignee.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1">
                  {format(selectedQuery.createdAt, 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1">
                  {format(selectedQuery.updatedAt, 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedQuery(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              {onStatusChange && (
                <select
                  value={selectedQuery.status}
                  onChange={(e) => onStatusChange(selectedQuery.id, e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  aria-label="Change status"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              )}
              {onAssign && availableAssignees.length > 0 && (
                <select
                  value={selectedQuery.assignedTo}
                  onChange={(e) => onAssign(selectedQuery.id, parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  aria-label="Reassign query"
                >
                  {availableAssignees.map((assignee) => (
                    <option key={assignee.id} value={assignee.id}>
                      {assignee.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 