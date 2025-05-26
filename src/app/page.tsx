import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import AgentDashboard from '@/components/dashboards/AgentDashboard';
import SupervisorDashboard from '@/components/dashboards/SupervisorDashboard';
import { prisma } from '@/lib/prisma';

export default async function Home() {
  const { user } = await getCurrentSession();
  
  if (!user) {
    redirect('/auth/signin');
  }

  // Fetch additional user data based on role
  if (user.role === 'AGENT') {
    const agentData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        status: true,
      },
    });

    if (!agentData) {
      redirect('/auth/signin');
    }

    // Type assertion for agent data
    const typedAgentData = {
      id: agentData.id,
      name: agentData.name,
      role: 'AGENT' as const,
      status: agentData.status ? {
        status: agentData.status.status,
        pauseReason: agentData.status.pauseReason?.toString(),
      } : null,
    };

    return (
      <main className="min-h-screen bg-gray-50">
        <AgentDashboard user={typedAgentData} />
      </main>
    );
  } else if (user.role === 'SUPERVISOR') {
    const supervisorData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        agents: {
          include: {
            status: true,
          },
        },
      },
    });

    if (!supervisorData) {
      redirect('/auth/signin');
    }

    // Type assertion for supervisor data
    const typedSupervisorData = {
      id: supervisorData.id,
      name: supervisorData.name,
      role: 'SUPERVISOR' as const,
      agents: supervisorData.agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        email: agent.email,
        role: 'AGENT' as const,
        status: agent.status ? {
          status: agent.status.status,
          pauseReason: agent.status.pauseReason?.toString(),
        } : null,
      })),
    };

    return (
      <main className="min-h-screen bg-gray-50">
        <SupervisorDashboard user={typedSupervisorData} />
      </main>
    );
  }

  // If user has no role, redirect to sign in
  redirect('/auth/signin');
}
