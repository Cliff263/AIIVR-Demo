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
import SupervisorDashboard from '@/components/SupervisorDashboard';
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
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await getCurrentSession();
        if (!user) {
          router.push('/signin');
          return;
        }
        setUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/signin');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">AIIVR</h1>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">{user.name}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {user.role === 'SUPERVISOR' ? (
          <SupervisorDashboard user={user} />
        ) : (
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                  ${selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  }`
                }
              >
                Dashboard
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                  ${selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  }`
                }
              >
                Calls
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                  ${selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  }`
                }
              >
                Queries
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <div className="space-y-6">
                  <AgentStatus agent={user} />
                  <Dashboard user={user} />
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <CallLogs currentUser={user} />
              </Tab.Panel>
              <Tab.Panel>
                <Queries currentUser={user} />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        )}
      </main>
    </div>
  );
}
