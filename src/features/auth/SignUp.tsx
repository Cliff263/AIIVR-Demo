"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/actions/auth";
import Link from "next/link";
import Form from "next/form";
import { Icons } from "@/components/ui/icons";

export default function SignUp() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSignUp(formData: FormData) {
    setIsPending(true);
    setError("");

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supervisorKey = formData.get("supervisorKey") as string;

    try {
      const result = await registerUser(name, email, password, supervisorKey);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/auth/sign-in");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Banner */}
      <div className="w-full bg-black text-white text-center text-sm py-2">
        AIIR CALL MANAGEMENT SYSTEM
      </div><br></br>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-lg p-8">
          <h1 className="text-2xl font-bold text-rose-600 text-center mb-2">
            Join the AIIVR Team!
          </h1>
          <p className="text-center text-sm text-rose-600 font-semibold mb-2">
            🔥START YOUR JOURNEY🔥
          </p>
          <p className="text-center text-sm text-gray-600 font-semibold mb-6">
            Create your account to begin managing calls and teams
          </p>
          <Form action={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                autoComplete="name"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter your Email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Create Password"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="supervisorKey" className="block text-sm font-medium text-gray-700">
                Supervisor Key (Optional)
              </label>
              <input
                type="text"
                id="supervisorKey"
                name="supervisorKey"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                placeholder="Enter supervisor key if you are a supervisor"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className={`w-full bg-rose-600 text-white py-3 rounded-md hover:bg-rose-700 transition-colors font-medium
                ${isPending ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Icons.spinner className="h-4 w-4 animate-[spin_1s_linear_infinite]" />
                  CREATING ACCOUNT...
                </span>
              ) : (
                'CREATE ACCOUNT'
              )}
            </button>

            {error && (
              <p className="text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="font-medium text-rose-600 hover:text-rose-700">
                Sign in here
              </Link>
            </p>
          </Form>
        </div>
      </div>
    </div>
  );
} 