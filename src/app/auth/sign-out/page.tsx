import { signOut } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function SignOutPage() {
  await signOut();
  redirect("/auth/sign-in");
} 