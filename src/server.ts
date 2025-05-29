import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';
import { prisma } from './lib/prisma';
import type { AgentStatus, CallStatus, QueryStatus, PauseReason } from '@prisma/client';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const httpServer = createServer(expressApp);
  
  // Initialize Socket.IO with proper configuration
  const io = new Server(httpServer, {
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 45000,
    pingInterval: 25000,
    connectTimeout: 45000,
    allowEIO3: true,
    allowUpgrades: true,
    cookie: {
      name: 'io',
      path: '/',
      httpOnly: true,
      sameSite: 'lax'
    }
  });

  // Socket.IO event handlers
  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    // Validate authentication data
    const { agentId, role } = socket.handshake.auth;
    if (!agentId || !role) {
      console.error('Missing authentication data:', { agentId, role });
      socket.disconnect();
      return;
    }

    try {
      // Verify user exists and has correct role
      const user = await prisma.user.findFirst({
        where: {
          id: agentId,
          role: role
        }
      });

      if (!user) {
        console.error(`User ${agentId} not found or has incorrect role ${role}`);
        socket.disconnect();
        return;
      }

      // Join appropriate room based on role
      if (role === 'SUPERVISOR') {
        socket.join('supervisors');
        console.log(`Supervisor ${agentId} joined supervisors room`);
      }
      
      // Join personal room
      const personalRoom = `${role.toLowerCase()}-${agentId}`;
      socket.join(personalRoom);
      console.log(`${role} ${agentId} joined their personal room`);

      // Handle status changes
      socket.on('status-change', async (data: { status: AgentStatus; pauseReason?: PauseReason }) => {
        try {
          // Fetch previous status before updating
          const prevStatusInfo = await prisma.agentStatusInfo.findUnique({
            where: { userId: agentId },
            select: { status: true }
          });

          // Only proceed if the status is actually changing
          if (prevStatusInfo?.status === data.status) {
            return;
          }

          // Update agent status in database
          const [user, statusInfo] = await prisma.$transaction([
            prisma.user.update({
              where: { id: agentId },
              data: { status: data.status },
            }),
            prisma.agentStatusInfo.upsert({
              where: { userId: agentId },
              update: {
                status: data.status,
                pauseReason: data.status === "PAUSED" ? data.pauseReason : null,
                lastActive: new Date(),
              },
              create: {
                userId: agentId,
                status: data.status,
                pauseReason: data.status === "PAUSED" ? data.pauseReason : null,
              },
            }),
            prisma.agentStatusHistory.create({
              data: {
                userId: agentId,
                status: data.status,
                pauseReason: data.status === "PAUSED" ? data.pauseReason : null,
              },
            }),
          ]);

          // Fetch agent name
          const agent = await prisma.user.findUnique({ where: { id: agentId }, select: { name: true } });

          // Log the status change
          await prisma.userActivityLog.create({
            data: {
              userId: agentId,
              type: "STATUS_CHANGE",
              description: `Status changed to ${data.status}${data.pauseReason ? ` (${data.pauseReason})` : ""}`
            }
          });

          // Broadcast status update
          console.log('[Server] Emitting agent-status-update:', {
            agentId,
            status: data.status,
            pauseReason: data.pauseReason,
            agentName: agent?.name || agentId,
          });
          io.emit('agent-status-update', {
            agentId,
            status: data.status,
            pauseReason: data.pauseReason,
            agentName: agent?.name || agentId,
          });

          // Log to Notification table: login vs. status change
          if (data.status === 'ONLINE' && prevStatusInfo?.status === 'OFFLINE') {
            await prisma.notification.create({
              data: {
                title: 'Agent Login',
                message: `Agent ${agent?.name || agentId} is now ONLINE`,
                visibleTo: 'SUPERVISOR',
              }
            });
          } else {
            await prisma.notification.create({
              data: {
                title: 'Agent Status Change',
                message: `Agent ${agent?.name || agentId} is now ${data.status}${data.pauseReason ? ` (${data.pauseReason})` : ''}`,
                visibleTo: 'SUPERVISOR',
              }
            });
          }
        } catch (error) {
          console.error('Error handling status change:', error);
          socket.emit('error', { message: 'Failed to update status' });
        }
      });

      // Handle call updates
      socket.on('call-update', async (data: { callId: number; status: CallStatus; duration?: number }) => {
        try {
          await prisma.call.update({
            where: { id: data.callId },
            data: {
              status: data.status,
              duration: data.duration,
              updatedAt: new Date(),
            },
          });

          // Broadcast to appropriate rooms
          io.to(personalRoom).emit('call-status-update', data);
          if (role === 'AGENT') {
            io.to('supervisors').emit('call-status-update', { ...data, agentId });
          }
        } catch (error) {
          console.error('Error handling call update:', error);
          socket.emit('error', { message: 'Failed to update call status' });
        }
      });

      // Handle query updates
      socket.on('query-update', async (data: { queryId: number; status: QueryStatus }) => {
        try {
          await prisma.query.update({
            where: { id: data.queryId },
            data: {
              status: data.status,
              updatedAt: new Date(),
            },
          });

          // Broadcast to appropriate rooms
          io.to(personalRoom).emit('query-status-update', data);
          if (role === 'AGENT') {
            io.to('supervisors').emit('query-status-update', { ...data, agentId });
          }
        } catch (error) {
          console.error('Error handling query update:', error);
          socket.emit('error', { message: 'Failed to update query status' });
        }
      });

      // Handle activity log
      socket.on('activity-log', async (data: { type: string; description?: string }) => {
        try {
          const log = await prisma.userActivityLog.create({
            data: {
              userId: agentId,
              type: data.type,
              description: data.description || ''
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          });

          // Emit to all clients
          io.emit('activity-log', log);

          // If it's a status change, emit to specific channels
          if (data.type.startsWith('STATUS_CHANGE')) {
            // Fetch agent name
            const agent = await prisma.user.findUnique({ where: { id: agentId }, select: { name: true } });
            // Emit to supervisors for monitoring
            io.to('supervisors').emit('agent-status-update', {
              agentId,
              status: data.type,
              description: data.description,
              timestamp: new Date(),
              agentName: agent?.name || agentId,
            });

            // Emit to the specific agent
            socket.to(`agent-${agentId}`).emit('status-update', {
              status: data.type,
              description: data.description,
              timestamp: new Date()
            });
          }

          // If it's a supervisor intervention, notify the agent
          if (data.type === 'SUPERVISOR_INTERVENTION') {
            socket.to(`agent-${agentId}`).emit('supervisor-intervention', {
              description: data.description,
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Error handling activity log:', error);
          socket.emit('error', { message: 'Failed to log activity' });
        }
      });

      // Handle agent status change by supervisor
      socket.on('supervisor-status-change', async (data: { agentId: string; newStatus: string; reason?: string }) => {
        try {
          if (role !== 'SUPERVISOR') {
            throw new Error('Unauthorized');
          }

          const agent = await prisma.user.findUnique({
            where: { id: data.agentId },
            select: { name: true },
          });

          if (!agent) {
            throw new Error('Agent not found');
          }

          // Update agent status
          await prisma.agentStatusInfo.update({
            where: { userId: data.agentId },
            data: {
              status: data.newStatus as AgentStatus,
              lastActive: new Date()
            }
          });

          // Create activity log
          const log = await prisma.userActivityLog.create({
            data: {
              userId: data.agentId,
              type: 'STATUS_CHANGE_BY_SUPERVISOR',
              description: `Status changed to ${data.newStatus} by supervisor ${user.name}${data.reason ? `: ${data.reason}` : ''}`
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          });

          // Emit updates
          io.emit('activity-log', log);
          io.to('supervisors').emit('agent-status-update', {
            agentId: data.agentId,
            status: data.newStatus,
            changedBy: user.name,
            timestamp: new Date(),
            agentName: agent?.name || data.agentId,
          });
          socket.to(`agent-${data.agentId}`).emit('status-update', {
            status: data.newStatus,
            changedBy: user.name,
            timestamp: new Date()
          });
          // Log to Notification table
          await prisma.notification.create({
            data: {
              title: 'Agent Status Change by Supervisor',
              message: `Agent ${agent?.name || data.agentId} status changed to ${data.newStatus} by supervisor ${user.name}${data.reason ? `: ${data.reason}` : ''}`,
              visibleTo: 'SUPERVISOR',
            }
          });
        } catch (error) {
          console.error('Error handling supervisor status change:', error);
          socket.emit('error', { message: 'Failed to update agent status' });
        }
      });

      // Handle performance metrics update
      socket.on('performance-update', async (data: { 
        agentId: string;
        metrics: {
          callsHandled: number;
          avgCallTime: number;
          satisfaction: number;
          resolution: number;
        }
      }) => {
        try {
          await prisma.performanceMetrics.create({
            data: {
              userId: data.agentId,
              callsHandled: data.metrics.callsHandled,
              avgCallTime: data.metrics.avgCallTime,
              satisfaction: data.metrics.satisfaction,
              resolution: data.metrics.resolution
            }
          });

          // Create activity log for metrics update
          const log = await prisma.userActivityLog.create({
            data: {
              userId: data.agentId,
              type: 'PERFORMANCE_UPDATE',
              description: `Performance metrics updated: ${data.metrics.callsHandled} calls handled, ${data.metrics.avgCallTime}s avg time`
            },
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
          });

          io.emit('activity-log', log);
          io.to('supervisors').emit('agent-performance-update', {
            agentId: data.agentId,
            metrics: data.metrics,
            timestamp: new Date()
          });
          // Log to Notification table
          const agent = await prisma.user.findUnique({ where: { id: data.agentId }, select: { name: true } });
          await prisma.notification.create({
            data: {
              title: 'Agent Performance Update',
              message: `Agent ${agent?.name || data.agentId} performance updated: ${data.metrics.callsHandled} calls handled, ${data.metrics.avgCallTime}s avg time`,
              visibleTo: 'SUPERVISOR',
            }
          });
        } catch (error) {
          console.error('Error handling performance update:', error);
          socket.emit('error', { message: 'Failed to update performance metrics' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
        try {
          if (role === 'AGENT') {
            // Fetch previous status before updating
            const prevStatusInfo = await prisma.agentStatusInfo.findUnique({
              where: { userId: agentId },
              select: { status: true }
            });
            // Only log if previous status was not already OFFLINE
            if (prevStatusInfo?.status === 'OFFLINE') {
              return;
            }
            // Update agent status to OFFLINE
            await prisma.user.update({
              where: { id: agentId },
              data: { status: 'OFFLINE' }
            });
            // Fetch agent name
            const agent = await prisma.user.findUnique({ where: { id: agentId }, select: { name: true } });
            console.log('[Server] Emitting agent-status-update (disconnect):', {
              agentId,
              status: 'OFFLINE',
              agentName: agent?.name || agentId,
            });
            io.emit('agent-status-update', {
              agentId,
              status: 'OFFLINE',
              agentName: agent?.name || agentId,
            });
            // Log to Notification table
            await prisma.notification.create({
              data: {
                title: 'Agent Status Change',
                message: `Agent ${agent?.name || agentId} is now OFFLINE`,
                visibleTo: 'SUPERVISOR',
              }
            });
          }
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });

    } catch (error) {
      console.error('Error in socket connection handler:', error);
      socket.disconnect();
    }
  });

  async function getAgentMetrics(agentId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const calls = await prisma.call.findMany({
      where: {
        agentId: agentId.toString(),
        timestamp: {
          gte: today,
        },
      },
    });

    const totalCalls = calls.length;
    const averageHandleTime = calls.reduce((acc, call) => acc + (call.duration || 0), 0) / (totalCalls || 1);

    return {
      totalCalls,
      averageHandleTime,
      firstCallResolution: 75,
      customerSatisfaction: 85,
      queueLength: 0,
      callsInQueue: 0,
      averageWaitTime: 0,
    };
  }

  async function getTeamMetrics(supervisorId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agents = await prisma.user.findMany({
      where: {
        supervisorId: supervisorId.toString(),
      },
      include: {
        statusInfo: true,
        calls: {
          where: {
            timestamp: {
              gte: today,
            },
          },
        },
      },
    });

    const activeAgents = agents.filter(agent => agent.statusInfo?.status === 'ONLINE').length;
    const totalCalls = agents.reduce((acc, agent) => acc + (agent.calls?.length || 0), 0);
    const averageHandleTime = agents.reduce((acc, agent) => 
      acc + (agent.calls?.reduce((sum, call) => sum + call.duration, 0) || 0), 0) / (totalCalls || 1);

    return {
      totalCalls,
      averageHandleTime,
      firstCallResolution: 75,
      customerSatisfaction: 85,
      queueLength: 0,
      activeAgents,
      callsInQueue: 0,
      averageWaitTime: 0,
      teamPerformance: 80,
    };
  }

  // Handle all other routes with Next.js
  expressApp.all('*', (req, res) => {
    const parsedUrl = parse(req.url!, true);
    return handle(req, res, parsedUrl);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> WebSocket server running on ws://localhost:${port}/api/socket`);
  });
}); 