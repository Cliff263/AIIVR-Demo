import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SupervisorDashboard from "@/features/dashboard/components/SupervisorDashboard";

export default async function SupervisorDashboardPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  if (user.role !== 'SUPERVISOR') {
    redirect('/');
  }

  const supervisorData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      calls: true,
      agents: {
        include: {
          calls: true,
          statusInfo: true,
        },
      },
      statusInfo: true,
    },
  });

  if (!supervisorData) {
    redirect('/auth/sign-in');
  }

  return <SupervisorDashboard supervisorData={supervisorData} />;
} 