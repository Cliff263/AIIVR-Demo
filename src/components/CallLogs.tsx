'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import type { Call, Recording, CallType, User } from '@prisma/client';

type SafeUser = Omit<User, 'passwordHash'>;

interface CallWithRecording extends Call {
  recording?: Recording | null;
}

interface CallLogsProps {
  calls?: CallWithRecording[];
  currentUser: SafeUser;
  onPlayRecording?: (recordingUrl: string) => void;
}

export default function CallLogs({ calls = [], currentUser, onPlayRecording }: CallLogsProps) {
  const [selectedCall, setSelectedCall] = useState<CallWithRecording | null>(null);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallTypeColor = (type: CallType) => {
    switch (type) {
      case 'INBOUND':
        return 'text-green-600';
      case 'OUTBOUND':
        return 'text-blue-600';
      case 'MISSED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg divide-y">
        {calls.map((call) => (
          <div
            key={call.id}
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedCall(call)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`font-medium ${getCallTypeColor(call.type)}`}>
                  {call.type}
                </span>
                <span className="text-gray-900">{call.phoneNumber}</span>
                {call.contact && (
                  <span className="text-gray-500">({call.contact})</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {format(call.timestamp, 'MMM d, h:mm a')}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDuration(call.duration)}
                </span>
                {call.recording && (
                  <button type='button' title='Play Recording'
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayRecording?.(call.recording!.url);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PlayIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium mb-4">Call Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className={`mt-1 ${getCallTypeColor(selectedCall.type)}`}>
                  {selectedCall.type}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1">{selectedCall.phoneNumber}</dd>
              </div>
              {selectedCall.contact && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact</dt>
                  <dd className="mt-1">{selectedCall.contact}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Time</dt>
                <dd className="mt-1">
                  {format(selectedCall.timestamp, 'MMM d, yyyy h:mm a')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Duration</dt>
                <dd className="mt-1">{formatDuration(selectedCall.duration)}</dd>
              </div>
            </dl>
            {selectedCall.recording && (
              <div className="mt-4">
                <button
                  onClick={() => onPlayRecording?.(selectedCall.recording!.url)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Play Recording
                </button>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedCall(null)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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