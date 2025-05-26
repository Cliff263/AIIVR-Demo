import { getCurrentSession, signIn } from "@/actions/auth";
import SignIn from "@/components/auth/SignIn";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const { user } = await getCurrentSession();
  
  // If user is already signed in, redirect to home
  if (user) {
    redirect("/");
  }
  
  async function handleSignIn(formData: FormData) {
    "use server"
    
    try {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      
      if (!email || !password) {
        return { success: false, message: "Email and password are required" };
      }
      
      const { user, error } = await signIn(email, password);
      
      if (error) {
        return { success: false, message: error };
      }
      
      if (user) {
        return { success: true };
      }
      
      return { success: false, message: "Sign in failed. Please try again." };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, message: "An unexpected error occurred. Please try again." };
    }
  }
  
  return <SignIn action={handleSignIn} />;
} 