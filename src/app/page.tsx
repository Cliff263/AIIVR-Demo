import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import AgentDashboard from '@/components/dashboards/AgentDashboard';
import SupervisorDashboard from '@/components/dashboards/SupervisorDashboard';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const { user } = await getCurrentSession();
  
  // If no user is found, redirect to sign in
  if (!user) {
    redirect('/auth/signin');
  }

  // Fetch additional user data based on role
  if (user.role === 'AGENT') {
    const agentData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        statusInfo: true,
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
    });

    if (!agentData) {
      redirect('/auth/signin');
    }

    // Transform user data to match AgentDashboard's expected type
    const transformedUser = {
      ...agentData,
      agentStatus: agentData.statusInfo ? {
        status: agentData.statusInfo.status,
        pauseReason: agentData.statusInfo.pauseReason?.toString(),
      } : null,
    };

    return (
      <main className="min-h-screen bg-gray-50">
        <AgentDashboard user={transformedUser} />
      </main>
    );
  }

  // Handle supervisor role
  const supervisorData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });

  if (!supervisorData) {
    redirect('/auth/sign-in');
  }

  // Fetch all agents for the supervisor dashboard
  const allAgents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    include: {
      statusInfo: true,
    },
  });

  // Transform supervisor data (simplified as agents are now fetched separately)
  const transformedSupervisor = {
    id: supervisorData.id,
    name: supervisorData.name,
    role: 'SUPERVISOR' as const,
    agents: allAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: 'AGENT' as const,
      status: agent.statusInfo ? {
        status: agent.statusInfo.status,
        pauseReason: agent.statusInfo.pauseReason?.toString(),
      } : null,
    })),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <SupervisorDashboard user={transformedSupervisor} />
    </main>
  );
}
