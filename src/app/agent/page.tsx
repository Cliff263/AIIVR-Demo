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

  const agentDataWithStringIds = {
    ...agentData,
    calls: agentData.calls.map(call => ({
      ...call,
      id: call.id.toString(),
      agentId: call.agentId?.toString?.() ?? call.agentId,
    })),
  };

  return (
    <DashboardLayout user={{ ...user, status: agentData.statusInfo }}>
      <AgentDashboard agentData={agentDataWithStringIds} />
    </DashboardLayout>
  );
} 