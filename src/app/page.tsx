'use client';

import { useState } from 'react';
import { 
  PhoneIcon, 
  ChartBarIcon, 
  UserGroupIcon, 
  ClipboardDocumentListIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import CallLogs from '@/components/CallLogs';
import Dashboard from '@/components/Dashboard';
import AgentStatus from '@/components/AgentStatus';
import Queries from '@/components/Queries';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Home() {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Available');

  const tabs = [
    { name: 'Calls', icon: PhoneIcon, component: CallLogs },
    { name: 'Dashboard', icon: ChartBarIcon, component: Dashboard },
    { name: 'Agent Status', icon: UserGroupIcon, component: AgentStatus },
    { name: 'Queries', icon: ClipboardDocumentListIcon, component: Queries },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">AIIVR Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`inline-flex items-center px-4 py-2 rounded-md ${
                  isPaused ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {isPaused ? (
                  <>
                    <PauseIcon className="h-5 w-5 mr-2" />
                    Paused
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-5 w-5 mr-2" />
                    Active
                  </>
                )}
              </button>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                aria-label="Select agent status"
              >
                <option>Available</option>
                <option>Lunch</option>
                <option>Bathroom</option>
                <option>Smoke</option>
                <option>On Leave</option>
                <option>Case Work</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                    selected
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  )
                }
              >
                <div className="flex items-center justify-center">
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </div>
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels className="mt-4">
            {tabs.map((tab) => (
              <Tab.Panel
                key={tab.name}
                className="rounded-xl bg-white p-6 shadow"
              >
                <tab.component />
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
  );
}
