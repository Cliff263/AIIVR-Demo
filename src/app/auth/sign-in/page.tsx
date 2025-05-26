import { getCurrentSession, signIn } from "@/actions/auth";
import SignIn from "@/components/auth/SignIn";
import { redirect } from "next/navigation";
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
    
    const action = async(formData: FormData) => {
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
            redirect("/");
        }
        return { message: "" };
    }
    
    return <SignIn action={action}/>
} 