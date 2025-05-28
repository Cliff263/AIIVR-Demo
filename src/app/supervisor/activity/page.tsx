import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { ActivityLogs } from "@/features/dashboard/components/ActivityLogs";
import DashboardLayout from "@/app/dashboard/layout";

export default async function SupervisorActivityPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  if (user.role !== 'SUPERVISOR') {
    redirect('/');
  }

  return (
    <DashboardLayout user={user}>
      <div className="p-6">
        <ActivityLogs userId={user.id} role={user.role} />
      </div>
    </DashboardLayout>
  );
} 