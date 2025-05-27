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
        return 'text-green-700 bg-green-50';
      case 'PAUSED':
        return 'text-yellow-700 bg-yellow-50';
      case 'OFFLINE':
      default:
        return 'text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
          </div>
          <div className="border-t border-gray-200">
            <dl className="divide-y divide-gray-200">
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userWithStatus.name}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Email address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userWithStatus.email}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Role</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{userWithStatus.role}</dd>
              </div>
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-700">Status</dt>
                <dd className="mt-1 text-sm sm:mt-0 sm:col-span-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userWithStatus.statusInfo?.status)}`}>
                    {userWithStatus.statusInfo?.status || 'OFFLINE'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {userWithStatus.role === 'SUPERVISOR' && userWithStatus.agents && userWithStatus.agents.length > 0 && (
          <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Agents</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {userWithStatus.agents.map((agent) => (
                  <li key={agent.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                        <p className="text-sm text-gray-500">{agent.email}</p>
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