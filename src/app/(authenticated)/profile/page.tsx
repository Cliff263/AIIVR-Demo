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
      status: true,
      supervisedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      agents: {
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
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
        return 'text-emerald-600 bg-emerald-50';
      case 'PAUSED':
        return 'text-red-600 bg-red-50';
      case 'OFFLINE':
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <main className="p-6">
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Profile Information
            </h1>
            <div className={`px-3 py-1.5 rounded-full ${getStatusColor(userWithStatus.status?.status)}`}>
              <span className="text-sm font-medium">
                {userWithStatus.status?.status || 'OFFLINE'}
                {userWithStatus.status?.pauseReason && ` (${userWithStatus.status.pauseReason})`}
              </span>
            </div>
          </div>
          
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{userWithStatus.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{userWithStatus.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Role</label>
                <p className="mt-1 text-sm font-medium text-gray-900">{userWithStatus.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 