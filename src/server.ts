import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';
import { prisma } from './lib/prisma';
import { AgentStatus, CallStatus, QueryStatus, PauseReason } from '@prisma/client';

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
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
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
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join agent's room
    socket.on('join-agent-room', async (agentId: number) => {
      // Validate agentId
      if (isNaN(agentId)) {
        console.error('Invalid agentId received for join-agent-room:', agentId);
        return;
      }

      socket.join(`agent-${agentId}`);
      console.log(`Agent ${agentId} joined their room`);
      
      try {
        // Get current status
        const statusInfo = await prisma.agentStatusInfo.findUnique({
          where: { userId: agentId.toString() },
        });

        // If no status exists or status is OFFLINE, set to ONLINE
        if (!statusInfo || statusInfo.status === 'OFFLINE') {
          await prisma.agentStatusInfo.upsert({
            where: { userId: agentId.toString() },
            update: {
              status: 'ONLINE',
              lastActive: new Date(),
            },
            create: {
              userId: agentId.toString(),
              status: 'ONLINE',
              lastActive: new Date(),
            },
          });

          // Create status history entry
          await prisma.agentStatusHistory.create({
            data: {
              userId: agentId.toString(),
              status: 'ONLINE',
              timestamp: new Date(),
            },
          });

          // Broadcast status update to all connected clients
          io.emit('agent-status-update', {
            agentId: agentId.toString(),
            status: 'ONLINE',
            pauseReason: null,
          });
        } else {
          // Send current status to the connecting client
          socket.emit('agent-status-update', {
            status: statusInfo.status,
            pauseReason: statusInfo.pauseReason,
          });
        }
        
        // Send initial metrics
        const metrics = await getAgentMetrics(agentId);
        socket.emit('metrics-update', metrics);

        // Set up periodic metrics updates
        const metricsInterval = setInterval(async () => {
          const updatedMetrics = await getAgentMetrics(agentId);
          socket.emit('metrics-update', updatedMetrics);
        }, 30000); // Update every 30 seconds

        // Clean up interval on disconnect
        socket.on('disconnect', () => {
          clearInterval(metricsInterval);
          
          // Update status to OFFLINE on disconnect
          prisma.agentStatusInfo.update({
            where: { userId: agentId.toString() },
            data: {
              status: 'OFFLINE',
              lastActive: new Date(),
            },
          }).then(() => {
            // Broadcast status update
            io.emit('agent-status-update', {
              agentId: agentId.toString(),
              status: 'OFFLINE',
              pauseReason: null,
            });
          }).catch(error => {
            console.error('Error updating agent status on disconnect:', error);
          });
        });
      } catch (error) {
        console.error('Error handling agent room join:', error);
        socket.emit('error', { message: 'Failed to join agent room' });
      }
    });

    // Join supervisor's room
    socket.on('join-supervisor-room', async (supervisorId: number) => {
      socket.join(`supervisor-${supervisorId}`);
      console.log(`Supervisor ${supervisorId} joined their room`);
      
      // Send initial team metrics
      const metrics = await getTeamMetrics(supervisorId);
      socket.emit('metrics-update', metrics);
    });

    // Handle status changes
    socket.on('status-change', async (data: { status: AgentStatus; pauseReason?: PauseReason }) => {
      try {
        const agentId = socket.handshake.auth.agentId;
        if (!agentId) {
          console.error('No agentId provided for status change');
          return;
        }

        await prisma.agentStatusInfo.update({
          where: { userId: agentId.toString() },
          data: {
            status: data.status as AgentStatus,
            pauseReason: data.pauseReason as PauseReason | null,
            lastActive: new Date(),
          },
        });

        // Create status history entry
        await prisma.agentStatusHistory.create({
          data: {
            userId: agentId.toString(),
            status: data.status as AgentStatus,
            pauseReason: data.pauseReason as PauseReason | null,
            timestamp: new Date(),
          },
        });

        // Broadcast status update to all connected clients
        io.emit('agent-status-update', {
          agentId: agentId.toString(),
          status: data.status,
          pauseReason: data.pauseReason,
        });
      } catch (error) {
        console.error('Error handling status change:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle call updates
    socket.on('call-update', async (data: { agentId: number; callId: number; status: CallStatus; duration?: number }) => {
      // Validate agentId from data
      if (isNaN(data.agentId)) {
        console.error('Invalid agentId received for call-update:', data.agentId);
        return;
      }

      // Update call in database
      await prisma.call.update({
        where: { id: data.callId },
        data: {
          status: data.status,
          duration: data.duration,
          updatedAt: new Date(),
        },
      });

      // Broadcast call update
      io.to(`agent-${data.agentId}`).emit('call-status-update', data);
      io.to(`supervisor-${data.agentId}`).emit('call-status-update', data);
      
      // Update metrics
      const metrics = await getAgentMetrics(data.agentId);
      io.to(`agent-${data.agentId}`).emit('metrics-update', metrics);
      io.to(`supervisor-${data.agentId}`).emit('metrics-update', metrics);
      
      console.log(`Call ${data.callId} status updated to ${data.status}`);
    });

    // Handle query updates
    socket.on('query-update', async (data: { agentId: number; queryId: number; status: QueryStatus }) => {
      // Validate agentId from data
      if (isNaN(data.agentId)) {
        console.error('Invalid agentId received for query-update:', data.agentId);
        return;
      }

      // Update query in database
      await prisma.query.update({
        where: { id: data.queryId },
        data: {
          status: data.status,
          updatedAt: new Date(),
        },
      });

      // Broadcast query update
      io.to(`agent-${data.agentId}`).emit('query-status-update', data);
      io.to(`supervisor-${data.agentId}`).emit('query-status-update', data);
      console.log(`Query ${data.queryId} status updated to ${data.status}`);
    });

    // Handle activity log
    socket.on('activity-log', async (data: { 
      userId: string;
      action: string;
      details?: string;
      ipAddress?: string;
      userAgent?: string;
    }) => {
      try {
        const log = await prisma.userActivityLog.create({
          data: {
            userId: data.userId,
            action: data.action,
            details: data.details,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
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

        // Broadcast the new log to all connected clients
        io.emit('activity-log', log);
      } catch (error) {
        console.error('Error handling activity log:', error);
        socket.emit('error', { message: 'Failed to log activity' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Handle reconnection
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber} for socket ${socket.id}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts for socket ${socket.id}`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect for socket:', socket.id);
    });
  });

  // Helper functions for metrics
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
    const averageHandleTime = calls.reduce((acc, call) => acc + call.duration, 0) / (totalCalls || 1);
    const firstCallResolution = calls.filter(call => call.outcome === 'SUCCESSFUL').length / (totalCalls || 1) * 100;

    return {
      totalCalls,
      averageHandleTime,
      firstCallResolution,
      customerSatisfaction: 85, // This should be calculated from actual feedback
      queueLength: 0, // This should be calculated from active queue
      activeAgents: 1,
      currentCallDuration: 0, // This should be tracked in real-time
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
      firstCallResolution: 75, // This should be calculated from actual data
      customerSatisfaction: 85, // This should be calculated from actual feedback
      queueLength: 0, // This should be calculated from active queue
      activeAgents,
      callsInQueue: 0, // This should be calculated from active queue
      averageWaitTime: 0, // This should be calculated from queue data
      teamPerformance: 80, // This should be calculated from various metrics
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