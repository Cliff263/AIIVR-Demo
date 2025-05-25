import { getCurrentSession, registerUser, signIn } from "@/actions/auth";
import SignUp, { SignUpState } from "@/components/auth/Signup";
import { redirect } from "next/navigation";
import React from "react";
import zod from 'zod';

const SignUpSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(8),
    name: zod.string().min(2),
    role: zod.enum(['AGENT', 'SUPERVISOR']).default('AGENT')
});

export default async function SignUpPage() {
    const {user} = await getCurrentSession();
    if(user) {
        return redirect("/");
    }
    
    const action = async(prevState: SignUpState, formData: FormData) => {
        "use server"
        const parsed = SignUpSchema.safeParse(Object.fromEntries(formData));
        if(!parsed.success) {
            return { message: "Invalid form data!" };
        }
        
        const {email, password, name, role} = parsed.data;
        const {user, error} = await registerUser(email, password, name, role);
        
        if(error) {
            return { message: error };
        }
        
        if(user) {
            await signIn(email, password);
            return redirect("/");
        }
        
        return { message: undefined };
    }
    
    return <SignUp action={action}/>;
} 