// src/app/dashboard/live/page.tsx
import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import DashboardLayout from '@/components/DashboardLayout';
import { prisma } from "@/lib/prisma";

// Placeholder component for Live metrics
function LiveDashboard() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-600">Live Overview</h3>
      <p className="text-gray-500">Live metrics and call monitoring coming soon...</p>
    </div>
  );
}

export default async function LiveDashboardPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      statusInfo: true,
    },
  });

  if (!userData) {
     redirect('/auth/sign-in');
  }

  return (
    <DashboardLayout user={{ ...user, status: userData.statusInfo }}>
      <div className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-600">Live Dashboard</h2>
        <LiveDashboard />
      </div>
    </DashboardLayout>
  );
} 