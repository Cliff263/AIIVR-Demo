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
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket'],
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

          // Log the status change
          await prisma.userActivityLog.create({
            data: {
              userId: agentId,
              type: "STATUS_CHANGE",
              description: `Status changed to ${data.status}${data.pauseReason ? ` (${data.pauseReason})` : ""}`
            }
          });

          // Broadcast status update
          io.emit('agent-status-update', {
            agentId,
            status: data.status,
            pauseReason: data.pauseReason,
          });
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

          io.emit('activity-log', log);
        } catch (error) {
          console.error('Error handling activity log:', error);
          socket.emit('error', { message: 'Failed to log activity' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', async (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
        
        try {
          if (role === 'AGENT') {
            // Update agent status to OFFLINE
            await prisma.user.update({
              where: { id: agentId },
              data: { status: 'OFFLINE' }
            });

            io.emit('agent-status-update', {
              agentId,
              status: 'OFFLINE'
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