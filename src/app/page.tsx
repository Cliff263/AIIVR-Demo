import { getCurrentSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";

export default async function Home() {
  const { user } = await getCurrentSession();
  
  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to AIIVR Demo</h1>
          <p className="text-xl text-gray-600">Your AI-powered virtual reality experience starts here</p>
        </div>
      </main>
    </div>
  );
}
