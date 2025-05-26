import { getCurrentSession, registerUser } from "@/actions/auth";
import SignUp from "@/components/auth/SignUp";
import { redirect } from "next/navigation";
import zod from 'zod';

const SignUpSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(8),
    name: zod.string().min(2),
})

export default async function SignUpPage() {
    const {user} = await getCurrentSession();
    if(user) {
        return redirect("/");
    }
    
    const action = async(formData: FormData) => {
        "use server"
        const parsed = SignUpSchema.safeParse(Object.fromEntries(formData));
        if(!parsed.success) {
            return { message: "Invalid form data!" };
        }
        const {email, password, name} = parsed.data; 
        const {user, error} = await registerUser(email, password, name);
        if(error){
            return { message: error };
        }
        if(user) {
            redirect("/");
        }
        return { message: "" };
    }
    
    return <SignUp action={action}/>
} 