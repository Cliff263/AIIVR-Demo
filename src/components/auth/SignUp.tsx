"use client"

import { Form } from '@/components/ui/form';
import { useState } from 'react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';

interface SignUpProps {
  action: (formData: FormData) => Promise<{ message: string }>;
}

const SignUp = ({ action }: SignUpProps) => {
  const [state, setState] = useState({ message: '' });
  const [isPending, setIsPending] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('AGENT');

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    try {
      const result = await action(formData);
      setState(result);
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
              <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-black">
                Create your account
              </h2>
            </div>
            
            {state.message && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{state.message}</div>
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-black">
                Full name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-md border border-black px-3 py-2 shadow-sm text-black placeholder-black focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-md border border-black px-3 py-2 shadow-sm text-black placeholder-black focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-black">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="block w-full rounded-md border border-black px-3 py-2 shadow-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="AGENT">Agent</option>
                  <option value="SUPERVISOR">Supervisor</option>
                </select>
              </div>
            </div>

            {selectedRole === 'SUPERVISOR' && (
              <div>
                <label htmlFor="supervisorKey" className="block text-sm font-medium text-black">
                  Supervisor Key (required for supervisor role)
                </label>
                <div className="mt-1">
                  <input
                    id="supervisorKey"
                    name="supervisorKey"
                    type="text"
                    className="block w-full rounded-md border border-black px-3 py-2 shadow-sm text-black placeholder-black focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </Form>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-black">
            Already have an account?{' '}
            <Link href="/auth/sign-in" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 