// src/app/dashboard/analytics/page.tsx
import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import DashboardLayout from '@/components/DashboardLayout';
import { prisma } from "@/lib/prisma";

// Placeholder component for Analytics
function AnalyticsDashboard() {
  // Add logic for displaying analytics data
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-blue-600">Analytics Overview</h3>
      <p className="text-gray-500">Detailed analytics and reporting coming soon...</p>
    </div>
  );
}

export default async function AnalyticsDashboardPage() {
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
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-600">Analytics Dashboard</h2>
        <AnalyticsDashboard />
      </div>
    </DashboardLayout>
  );
} 