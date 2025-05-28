import { getCurrentSession } from "@/actions/auth";

export const { auth } = {
  auth: async () => {
    const session = await getCurrentSession();
    return session;
  }
};

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session.user;
} 