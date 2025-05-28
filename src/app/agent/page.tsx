import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AgentDashboard from "@/features/dashboard/components/AgentDashboard";
import DashboardLayout from "@/app/dashboard/layout";

export default async function AgentHomePage() {
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

  return (
    <DashboardLayout user={{ ...user, status: agentData.statusInfo }}>
      <AgentDashboard agentData={agentData} />
    </DashboardLayout>
  );
} 