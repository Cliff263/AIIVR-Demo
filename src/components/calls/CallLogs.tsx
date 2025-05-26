import { useState } from 'react';
import { CallType, CallStatus, CallOutcome } from '@prisma/client';
import { format } from 'date-fns';

interface Call {
  id: number;
  type: CallType;
  status: CallStatus;
  outcome: CallOutcome;
  startTime: Date;
  endTime: Date;
  duration: number;
  phoneNumber: string;
  recordingUrl?: string;
  agentId?: number;
}

interface CallLogsProps {
  role: 'AGENT' | 'SUPERVISOR';
  agentId?: number;
}

export default function CallLogs({ role, agentId }: CallLogsProps) {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [callType, setCallType] = useState<string>('all');
  const [callDate, setCallDate] = useState<string>('');

  // Example calls data
  const exampleCalls: Call[] = [
    {
      id: 1,
      type: 'INBOUND',
      status: 'COMPLETED',
      outcome: 'SUCCESSFUL',
      startTime: new Date(),
      endTime: new Date(),
      duration: 330,
      phoneNumber: '+1234567890',
      agentId: agentId
    }
  ];

  // Filter calls based on role and agentId
  const filterCalls = (calls: Call[]): Call[] => {
    return calls.filter(call => {
      if (role === 'AGENT' && call.agentId !== agentId) return false;
      if (callType !== 'all' && call.type !== callType.toUpperCase()) return false;
      if (callDate && !format(new Date(call.startTime), 'yyyy-MM-dd').includes(callDate)) return false;
      return true;
    });
  };

  const filteredCalls = filterCalls(exampleCalls);

  const getStatusColor = (status: CallStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success-100 text-success-800';
      case 'IN_PROGRESS':
        return 'bg-primary-100 text-primary-800';
      case 'QUEUED':
        return 'bg-warning-100 text-warning-800';
      case 'FAILED':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getTypeColor = (type: CallType) => {
    switch (type) {
      case 'INBOUND':
        return 'text-primary-600';
      case 'OUTBOUND':
        return 'text-success-600';
      case 'MISSED':
        return 'text-danger-600';
      default:
        return 'text-secondary-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-soft rounded-xl border border-secondary-200 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">Call Logs</h2>
            <div className="flex items-center space-x-4">
              <select 
                className="rounded-lg border-secondary-200 shadow-soft focus:border-primary-500 focus:ring-primary-500"
                aria-label="Filter calls by type"
                value={callType}
                onChange={(e) => setCallType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="missed">Missed</option>
              </select>
              <input
                type="date"
                className="rounded-lg border-secondary-200 shadow-soft focus:border-primary-500 focus:ring-primary-500"
                aria-label="Filter calls by date"
                value={callDate}
                onChange={(e) => setCallDate(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                    Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                    Outcome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredCalls.length > 0 ? (
                  filteredCalls.map((call: Call) => (
                    <tr key={call.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {format(new Date(call.startTime), 'PPpp')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${getTypeColor(call.type)}`}>
                          {call.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {call.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {Math.floor(call.duration / 60)}m {call.duration % 60}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                          {call.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                        {call.outcome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedCall(call)}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-secondary-500">
                      No calls recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-secondary-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-strong">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">Call Details</h3>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-secondary-400 hover:text-secondary-500 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-secondary-500">Call Type</p>
                  <p className="mt-1 text-sm text-secondary-900">{selectedCall.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-500">Phone Number</p>
                  <p className="mt-1 text-sm text-secondary-900">{selectedCall.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-500">Start Time</p>
                  <p className="mt-1 text-sm text-secondary-900">
                    {format(selectedCall.startTime, 'PPpp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-500">Duration</p>
                  <p className="mt-1 text-sm text-secondary-900">
                    {Math.floor(selectedCall.duration / 60)}m {selectedCall.duration % 60}s
                  </p>
                </div>
              </div>

              {selectedCall.recordingUrl && (
                <div>
                  <p className="text-sm font-medium text-secondary-500 mb-2">Recording</p>
                  <audio controls className="w-full">
                    <source src={selectedCall.recordingUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 