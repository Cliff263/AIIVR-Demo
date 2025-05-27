import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentDashboard from "@/features/dashboard/components/AgentDashboard";

export default async function AgentDashboardPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  if (user.role !== 'AGENT') {
    redirect('/');
  }

  const agentData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      calls: true,
      statusInfo: true,
    },
  });

  if (!agentData) {
    redirect('/auth/sign-in');
  }

  return <AgentDashboard agentData={agentData} />;
} 