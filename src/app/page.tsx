import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Redirect based on user role
  switch (user.role) {
    case 'SUPERVISOR':
      redirect('/dashboard/supervisor');
    case 'AGENT':
      redirect('/dashboard/agent');
    default:
      // If role is invalid, clear session and redirect to sign-in
      redirect('/auth/sign-in');
  }
}
