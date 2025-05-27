"use client";

import { useEffect, useState } from "react";
import { getCurrentSession } from "@/actions/auth";
import type { SessionValidationResult } from "@/actions/auth";

export function useAuth() {
  const [session, setSession] = useState<SessionValidationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        const result = await getCurrentSession();
        setSession(result);
      } catch (error) {
        console.error("Failed to load session:", error);
        setSession({ session: null, user: null });
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, []);

  return {
    session,
    loading,
    user: session?.user ?? null,
  };
} 