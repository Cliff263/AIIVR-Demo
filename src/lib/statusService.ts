import { AgentStatus, PauseReason } from "@prisma/client";
import { prisma } from "./prisma";

export interface StatusUpdate {
  status: AgentStatus;
  pauseReason?: PauseReason;
  lastActive?: Date;
}

export class StatusService {
  static async updateAgentStatus(userId: string, update: StatusUpdate) {
    try {
      // Update current status
      const statusInfo = await prisma.agentStatusInfo.upsert({
        where: { userId },
        update: {
          status: update.status,
          pauseReason: update.pauseReason || 'LUNCH',
          lastActive: update.lastActive || new Date(),
        },
        create: {
          userId,
          status: update.status,
          pauseReason: update.pauseReason || 'LUNCH',
          lastActive: update.lastActive || new Date(),
        },
      });

      // Create status history entry
      await prisma.agentStatusHistory.create({
        data: {
          userId,
          status: update.status,
          pauseReason: update.pauseReason || 'LUNCH',
          createdAt: new Date(),
        },
      });

      return statusInfo;
    } catch (error) {
      console.error('Error updating agent status:', error);
      throw error;
    }
  }

  static async getAgentStatus(userId: string) {
    try {
      return await prisma.agentStatusInfo.findUnique({
        where: { userId },
      });
    } catch (error) {
      console.error('Error getting agent status:', error);
      throw error;
    }
  }

  static async getAgentStatusHistory(userId: string, limit = 10) {
    try {
      return await prisma.agentStatusHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('Error getting agent status history:', error);
      throw error;
    }
  }
} 