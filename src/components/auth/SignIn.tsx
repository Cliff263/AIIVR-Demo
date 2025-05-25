"use client"
import React, { useActionState } from "react";
import Form from "next/form";
import {Loader2} from "lucide-react";  
import Link from "next/link";

export type SignInState = { message: string | undefined }
type SignInProps = {
    action: (prevState: SignInState, formData: FormData) => Promise<SignInState>
}

const initialState = { message: '',}
const SignIn = ({action}: SignInProps) => {
    const [state, formAction, isPending] = useActionState(action,initialState)
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8">
            <Form action={formAction} className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                        Welcome Back!
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 sm:text-base">
                        Sign in to access your account
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Email */}
                    <div className="space-y-2">
                        <label htmlFor='email' className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            autoComplete="email" 
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                            placeholder="Enter your email"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label htmlFor='password' className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            autoComplete="current-password" 
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-400"
                            placeholder="Enter your password"
                        />
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={isPending}
                        className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 ease-in-out
                            ${isPending 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                            }`}
                    >
                        {isPending ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            'Sign in'
                        )}
                    </button>

                    {/* Error Message */}
                    {state?.message && state.message.length > 0 && (
                        <div className="rounded-lg bg-red-50 p-4">
                            <p className="text-sm text-red-700 text-center">
                                {state.message}
                            </p>
                        </div>
                    )}

                    {/* Sign Up Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link 
                                href="/signup" 
                                className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Sign up here
                            </Link>
                        </p>
                    </div>
                </div>
            </Form>
        </div>
    )
}

export default SignIn