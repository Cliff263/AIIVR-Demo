'use client';

import { useState, useEffect } from 'react';
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
import { getCurrentSession, signOut } from '@/actions/auth';
import { User, UserRole } from '@prisma/client';
import { useRouter } from 'next/navigation';

type SafeUser = Omit<User, 'passwordHash'>;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Home() {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Available');
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await getCurrentSession();
        if (session?.user) {
          setCurrentUser(session.user);
        } else {
          router.push('/signin');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        router.push('/signin');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

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
              <span className="text-sm text-gray-500">
                {currentUser.name} ({currentUser.role})
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
              {currentUser.role !== 'ADMIN' && (
                <>
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
                </>
              )}
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
                {tab.name === 'Queries' ? (
                  <Queries currentUser={currentUser} />
                ) : (
                  <tab.component currentUser={currentUser} />
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
  );
}
