import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CallList from "@/features/calls/CallList";
import CallDetails from "@/features/calls/CallDetails";
import DashboardLayout from "@/app/dashboard/layout";
import { useState } from "react";

export default async function SupervisorCallsPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  if (user.role !== 'SUPERVISOR') {
    redirect('/');
  }

  // Fetch all calls for all agents supervised by this supervisor
  const agents = await prisma.user.findMany({
    where: { supervisorId: user.id },
    select: { id: true }
  });
  const agentIds = agents.map(a => a.id);
  const calls = await prisma.call.findMany({
    where: { agentId: { in: agentIds } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <DashboardLayout user={user}>
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold text-blue-900 mb-4">All Calls</h1>
        <div className="bg-white rounded-lg shadow-md p-4">
          <CallList calls={calls} />
        </div>
      </div>
    </DashboardLayout>
  );
} 