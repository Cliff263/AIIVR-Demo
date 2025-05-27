"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/actions/auth";
import Link from "next/link";
import Form from "next/form";
import { Icons } from "@/components/ui/icons";

export default function SignIn() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSignIn(formData: FormData) {
    setIsPending(true);
    setError("");

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn(email, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/");
      router.refresh();
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
        AIIVR CALL CENTER MANAGEMENT SYSTEM
      </div>

      {/* Form Wrapper */}
      <Form action={handleSignIn} className="max-w-md mx-auto my-16 p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl text-rose-600 font-bold text-center mb-2">AIIVR LOGIN</h1>
        <p className="text-center text-sm text-rose-600 font-semibold mb-2">Welcome Back!</p>
        <p className="text-center text-sm text-gray-600 font-semibold mb-6">
          SignIn to Access Your Account!
        </p>

        <div className="space-y-6">
          {/* Email */}
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
              className="w-full px-4 py-3 border border-gray-200 rounded-md bg-gray-50 focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
              placeholder="Enter your Email"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-md bg-gray-50 focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
              placeholder="Enter your Password"
            />
          </div>

          {/* Copywriting */}
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2">⚡Access your call center dashboard</p>
            <p className="text-xs text-gray-500 mb-5">🎖️Manage your calls and team efficiently</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className={`w-full bg-rose-600 text-white py-3 rounded-md hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2 ${
              isPending ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isPending ? (
              <>
                <Icons.spinner className="h-4 w-4 animate-[spin_1s_linear_infinite]" />
                SIGNING IN...
              </>
            ) : (
              "SIGN IN"
            )}
          </button>

          {/* Error Message */}
          {error && (
            <p className="text-center text-sm text-red-700">
              {error}
            </p>
          )}

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="font-medium text-rose-600 hover:text-rose-700">
              Sign up here
            </Link>
          </p>
        </div>
      </Form>
    </div>
  );
}
