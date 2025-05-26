import { getCurrentSession, registerUser } from "@/actions/auth";
import SignUp from "@/components/auth/SignUp";
import { redirect } from "next/navigation";
import zod from 'zod';
import prisma from "@/lib/prisma";

const SignUpSchema = zod.object({
    email: zod.string().email(),
    password: zod.string().min(8),
    name: zod.string().min(2),
    role: zod.enum(['AGENT', 'SUPERVISOR']),
    supervisorKey: zod.string().optional(),
});

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
        const {email, password, name, role, supervisorKey} = parsed.data;
        
        // If trying to register as supervisor, validate the key
        if (role === 'SUPERVISOR') {
            if (!supervisorKey) {
                return { message: "Supervisor key is required for supervisor role" };
            }

            // Check if the key exists and is unused
            const key = await prisma.supervisorKey.findUnique({
                where: { key: supervisorKey },
                include: { usedBy: true }
            });

            if (!key) {
                return { message: "Invalid supervisor key" };
            }

            if (key.used) {
                return { message: "This supervisor key has already been used" };
            }
        }
        
        const {user, error} = await registerUser(email, password, name, role);
        if(error) {
            return { message: error };
        }

        // If registration successful and user is a supervisor, mark the key as used
        if (user && role === 'SUPERVISOR' && supervisorKey) {
            await prisma.supervisorKey.update({
                where: { key: supervisorKey },
                data: { 
                    used: true,
                    usedById: user.id
                }
            });
        }

        if(user) {
            redirect("/");
        }
        return { message: "" };
    }
    
    return <SignUp action={action}/>
} 