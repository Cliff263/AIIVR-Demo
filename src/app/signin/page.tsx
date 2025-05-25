import { getCurrentSession, signIn } from "@/actions/auth";
import SignIn, { SignInState } from "@/components/auth/SignIn";
import { redirect } from "next/navigation";
import React from "react";
import zod from 'zod';

const SignInSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(8),
})

export default async function SignInPage() {
    const {user} = await getCurrentSession();
    if(user) {
        return redirect("/");
    }
    const action = async(prevState: SignInState, formData: FormData) => {
        "use server"
        const parsed = SignInSchema.safeParse(Object.fromEntries(formData));
        if(!parsed.success) {
            return { message: "Invalid form data!" };
        }
        const {email, password} = parsed.data; 
        const {user, error} = await signIn(email, password);
        if(error){
            return { message: error };
        }
        if(user) {
            return redirect("/");
        }
        return { message: undefined };
    }
    return <SignIn action={action}/>
} 