"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { registerUser, signIn as customSignIn } from "@/actions/auth";
import Form from "next/form";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAuth(formData: FormData) {
    setIsLoading(true);
    setError("");

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (mode === "signin") {
      try {
        const result = await customSignIn(email, password);

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          return;
        }

        if (result.user?.role === "SUPERVISOR") {
          router.push("/supervisor");
        } else {
          router.push("/agent");
        }
        router.refresh();
      } catch (error: any) {
        setError(error.message || "An error occurred during sign in.");
        setIsLoading(false);
      }
    } else {
      const name = formData.get("name") as string;
      const supervisorKey = formData.get("supervisorKey") as string;

      try {
        const result = await registerUser(name, email, password, supervisorKey);

        if (result.error) {
          setError(result.error);
          return;
        }

        router.push("/auth/sign-in");
      } catch (error) {
        setError("An error occurred. Please try again.");
      }
    }

    setIsLoading(false);
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Sign In" : "Create Account"}</CardTitle>
          <CardDescription>
            {mode === "signin"
              ? "Enter your credentials to access your account"
              : "Enter your details to create a new account"}
          </CardDescription>
        </CardHeader>
        <Form action={handleAuth}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              {mode === "signup" && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>
              {mode === "signup" && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="supervisorKey">Supervisor Key (Optional)</Label>
                  <Input
                    id="supervisorKey"
                    name="supervisorKey"
                    placeholder="Enter supervisor key if you are a supervisor"
                  />
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() =>
                router.push(
                  mode === "signin" ? "/auth/sign-up" : "/auth/sign-in"
                )
              }
              type="button"
            >
              {mode === "signin" ? "Create Account" : "Sign In"}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </CardFooter>
        </Form>
      </Card>
    </div>
  );
} 