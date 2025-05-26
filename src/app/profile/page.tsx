import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@prisma/client";

export default async function ProfilePage() {
  const { user } = await getCurrentSession();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get user's status information
  const userWithStatus = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      statusInfo: true,
      supervisor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      agents: {
        select: {
          id: true,
          name: true,
          email: true,
          statusInfo: true
        }
      }
    }
  });

  if (!userWithStatus) {
    redirect('/auth/sign-in');
  }

  const getStatusColor = (status?: AgentStatus) => {
    switch (status) {
      case 'ONLINE':
        return 'text-success-700 bg-success-50';
      case 'PAUSED':
        return 'text-warning-700 bg-warning-50';
      case 'OFFLINE':
      default:
        return 'text-secondary-600 bg-secondary-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-black">Profile Information</h3>
          </div>
          <div className="mt-5 border-t border-black">
            <dl className="divide-y divide-black">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-black">Full name</dt>
                <dd className="mt-1 text-sm text-black sm:mt-0 sm:col-span-2">{userWithStatus.name}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-black">Email address</dt>
                <dd className="mt-1 text-sm text-black sm:mt-0 sm:col-span-2">{userWithStatus.email}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-black">Role</dt>
                <dd className="mt-1 text-sm text-black sm:mt-0 sm:col-span-2">{userWithStatus.role}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-black">Status</dt>
                <dd className="mt-1 text-sm text-black sm:mt-0 sm:col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userWithStatus.statusInfo?.status)}`}>
                    {userWithStatus.statusInfo?.status || 'OFFLINE'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {userWithStatus.role === 'AGENT' && userWithStatus.supervisor && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-black">Supervisor Information</h3>
            </div>
            <div className="mt-5 border-t border-black">
              <dl className="divide-y divide-black">
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-black">Name</dt>
                  <dd className="mt-1 text-sm text-black sm:mt-0 sm:col-span-2">{userWithStatus.supervisor.name}</dd>
                </div>
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-black">Email</dt>
                  <dd className="mt-1 text-sm text-black sm:mt-0 sm:col-span-2">{userWithStatus.supervisor.email}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {userWithStatus.role === 'SUPERVISOR' && userWithStatus.agents && userWithStatus.agents.length > 0 && (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-black">Assigned Agents</h3>
            </div>
            <div className="mt-5 border-t border-black">
              <ul className="divide-y divide-black">
                {userWithStatus.agents.map((agent) => (
                  <li key={agent.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-black truncate">{agent.name}</p>
                        <p className="text-sm text-black truncate">{agent.email}</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.statusInfo?.status)}`}>
                          {agent.statusInfo?.status || 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 