"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            There was an error during authentication. Please try again.
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/auth/sign-in">Return to Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 