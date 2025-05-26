"use client"

import { Form } from '@/components/ui/form';
import { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';

interface SignInProps {
  action: (formData: FormData) => Promise<{ success: boolean; message?: string }>;
}

const SignIn = ({ action }: SignInProps) => {
  const [state, setState] = useState({ message: '' });
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setState({ message: '' });
    
    try {
      const result = await action(formData);
      
      if (result.success) {
        // Use client-side navigation after successful sign-in
        router.push('/');
        router.refresh();
      } else {
        setState({ message: result.message || 'An error occurred' });
      }
    } catch (error) {
      setState({ message: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <Form action={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-bold tracking-tight text-black">
                Sign in to your account
              </h2>
            </div>
            
            {state.message && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{state.message}</div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-black">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border border-black px-3 py-2 shadow-sm text-black placeholder-black focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border border-black px-3 py-2 shadow-sm text-black placeholder-black focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </Form>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-black">
            Don't have an account?{' '}
            <Link href="/auth/sign-up" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;