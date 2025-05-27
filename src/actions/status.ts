"use server"

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "./auth";

export async function getAgentStatus(userId: string) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // If user is an agent, they can only view their own status
    if (user.role === "AGENT" && user.id !== userId) {
      throw new Error("Unauthorized");
    }

    const status = await prisma.agentStatusInfo.findUnique({
      where: { userId },
    });

    return { status, error: null };
  } catch (error) {
    console.error("Error getting agent status:", error);
    return { status: null, error: "Failed to get agent status" };
  }
} 