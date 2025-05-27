import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma"; // Assuming prisma is needed for user data in the layout
import DashboardLayout from '@/components/DashboardLayout';
import { ActivityLogs } from "@/features/dashboard/components/ActivityLogs";

export default async function ActivityLogsPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Fetch user data including status for Topbar and ActivityLogs
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      statusInfo: true,
    },
  });

  if (!userData) {
     redirect('/auth/sign-in'); // Should not happen if user exists but good practice
  }

  // ActivityLogs component requires userId and role props now
  // You need to ensure these are correctly passed. Assuming user from session has id and role.
  const userId = parseInt(user.id, 10); // Assuming user.id is a string that can be parsed to a number
  const userRole = user.role as 'AGENT' | 'SUPERVISOR'; // Assuming user.role is already 'AGENT' or 'SUPERVISOR'

  return (
    <DashboardLayout user={{ ...user, status: userData.statusInfo }}>
      <div className="">
        {/* <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-600">Activity Logs</h2> */}
        <ActivityLogs userId={userId} role={userRole} />
      </div>
    </DashboardLayout>
  );
} 