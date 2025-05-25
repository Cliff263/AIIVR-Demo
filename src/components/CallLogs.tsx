'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

interface Call {
  id: string;
  type: 'inbound' | 'outbound' | 'missed';
  timestamp: Date;
  duration: number;
  number: string;
  contact?: string;
  recordingUrl?: string;
}

const mockCalls: Call[] = [
  {
    id: '1',
    type: 'inbound',
    timestamp: new Date(),
    duration: 120,
    number: '+27 12 345 6789',
    contact: 'John Doe',
    recordingUrl: '/recordings/call1.mp3'
  },
  // Add more mock calls as needed
];

export default function CallLogs() {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Call History</h2>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
            All Calls
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
            Inbound
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
            Outbound
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
            Missed
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number/Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recording
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockCalls.map((call) => (
              <tr
                key={call.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedCall(call)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    call.type === 'inbound' ? 'bg-green-100 text-green-800' :
                    call.type === 'outbound' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {call.type.charAt(0).toUpperCase() + call.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(call.timestamp, 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDuration(call.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{call.contact}</div>
                  <div className="text-sm text-gray-500">{call.number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {call.recordingUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(!isPlaying);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {isPlaying ? (
                        <PauseIcon className="h-5 w-5" />
                      ) : (
                        <PlayIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCall && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium mb-4">Call Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{selectedCall.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{format(selectedCall.timestamp, 'PPpp')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{formatDuration(selectedCall.duration)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contact</p>
                <p className="font-medium">{selectedCall.contact}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number</p>
                <p className="font-medium">{selectedCall.number}</p>
              </div>
              {selectedCall.recordingUrl && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Recording</p>
                  <audio
                    controls
                    className="w-full"
                    src={selectedCall.recordingUrl}
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 