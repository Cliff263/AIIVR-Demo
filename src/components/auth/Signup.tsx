"use client"
import React, { useActionState } from "react";
import Form from "next/form";
import {Loader2} from "lucide-react";  

export type SignUpState = { message: string | undefined }
type SignUpProps = {
    action: (prevState: SignUpState, formData: FormData) => Promise<SignUpState>
}

const initialState = { message: '' }

const SignUp = ({action}: SignUpProps) => {
    const [state, formAction, isPending] = useActionState(action, initialState)
    return (
        <Form action={formAction} className="max-w-md mx-auto my-16 p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center mb-2">
                Join the AIIVR Revolution!
            </h1>
            <p className="text-center text-sm text-gray-600 font-semibold mb-2">
                SignUp now & GET STARTED!
            </p>
            <div className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                    <label htmlFor='name' className="block text-sm font-medium text-gray-700">
                        Full Name
                    </label>
                    <input type="text" id="name" name="name" autoComplete="name" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter your full name"/>
                </div>
                {/* Email */}
                <div className="space-y-2">
                    <label htmlFor='email' className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input type="email" id="email" name="email" autoComplete="email" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Enter your Email"/>
                </div>
                {/* Password */}
                <div className="space-y-2">
                    <label htmlFor='password' className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input type="password" id="password" name="password" autoComplete="new-password" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
                    placeholder="Create Password"/>
                </div>
                {/* Role */}
                <div className="space-y-2">
                    <label htmlFor='role' className="block text-sm font-medium text-gray-700">
                        Role
                    </label>
                    <select id="role" name="role" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-black focus:border-transparent transition-colors">
                        <option value="AGENT">Agent</option>
                        <option value="SUPERVISOR">Supervisor</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                {/* Submit Button */}
                <button type="submit" disabled={isPending}
                    className={`w-full bg-rose-600 text-white py-3 rounded-md hover:bg-rose-750 transition-colors font-medium flex items-center justify-center gap-2
                    ${isPending ? 'cursor-not-allowed' : ''}`}
                    >{isPending ? (
                        <React.Fragment>
                            <Loader2 className='h-4 w-4 animate-spin' />
                            CREATING ACCOUNT...
                        </React.Fragment>
                    ) : (
                        'CREATE ACCOUNT'
                    )}
                </button>
                {state?.message && state.message.length > 0 && (
                    <p className="text-center text-sm text-red-700">
                        {state.message}
                    </p>
                )}
            </div>
        </Form>
    )
}

export default SignUp