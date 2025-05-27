import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Redirect based on user role
  if (user.role === 'SUPERVISOR') {
    redirect('/dashboard/supervisor');
  } else if (user.role === 'AGENT') {
    redirect('/dashboard/agent');
  }

  // Fallback redirect to sign-in if role is not recognized
  redirect('/auth/sign-in');
}
