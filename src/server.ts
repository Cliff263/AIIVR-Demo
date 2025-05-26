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
        // Optionally, disconnect the socket or send an error back to the client
        return;
      }

      socket.join(`agent-${agentId}`);
      console.log(`Agent ${agentId} joined their room`);
      
      // Get current status
      const statusInfo = await prisma.agentStatusInfo.findUnique({
        where: { userId: agentId.toString() },
      });

      // If no status exists or status is OFFLINE, set to ONLINE
      if (!statusInfo || statusInfo.status === 'OFFLINE') {
        const updatedStatus = await prisma.agentStatusInfo.upsert({
          where: { userId: agentId.toString() },
          update: {
            status: 'ONLINE',
            lastActive: new Date(),
          },
          create: {
            userId: agentId.toString(),
            status: 'ONLINE',
          },
        });

        // Create status history entry
        await prisma.agentStatusHistory.create({
          data: {
            userId: agentId.toString(),
            status: 'ONLINE',
          },
        });

        // Broadcast status update
        io.to(`agent-${agentId}`).emit('agent-status-update', {
          status: 'ONLINE',
          pauseReason: null,
        });
      } else {
        // Send current status
        socket.emit('agent-status-update', {
          status: statusInfo.status,
          pauseReason: statusInfo.pauseReason,
        });
      }
      
      // Send initial metrics
      const metrics = await getAgentMetrics(agentId);
      socket.emit('metrics-update', metrics);
    });

    // Join supervisor's room
    socket.on('join-supervisor-room', async (supervisorId: number) => {
      socket.join(`supervisor-${supervisorId}`);
      console.log(`Supervisor ${supervisorId} joined their room`);
      
      // Send initial team metrics
      const metrics = await getTeamMetrics(supervisorId);
      socket.emit('metrics-update', metrics);
    });

    // Handle agent status changes
    socket.on('agent-status-change', async (data: { agentId: number; status: AgentStatus; pauseReason?: PauseReason }) => {
      // Validate agentId from data
      if (isNaN(data.agentId)) {
        console.error('Invalid agentId received for agent-status-change:', data.agentId);
        return;
      }

      // Check if the user exists
      const userExists = await prisma.user.count({
        where: { id: data.agentId.toString() },
      });

      if (userExists === 0) {
        console.error('User not found for agent-status-change with agentId:', data.agentId);
        return;
      }

      // Update status in database
      await prisma.agentStatusInfo.upsert({
        where: { userId: data.agentId.toString() },
        update: {
          status: data.status,
          pauseReason: data.pauseReason,
          lastActive: new Date(),
        },
        create: {
          userId: data.agentId.toString(),
          status: data.status,
          pauseReason: data.pauseReason,
        },
      });

      // Create status history entry
      await prisma.agentStatusHistory.create({
        data: {
          userId: data.agentId.toString(),
          status: data.status,
          pauseReason: data.pauseReason,
        },
      });

      // Broadcast status update to all relevant rooms
      io.to(`agent-${data.agentId}`).emit('agent-status-update', {
        status: data.status,
        pauseReason: data.pauseReason !== undefined ? data.pauseReason : null,
      });
      
      // If agent has a supervisor, notify them
      const agent = await prisma.user.findUnique({
        where: { id: data.agentId.toString() },
        select: { supervisorId: true },
      });

      if (agent?.supervisorId) {
        io.to(`supervisor-${agent.supervisorId}`).emit('agent-status-update', {
          agentId: data.agentId,
          status: data.status,
          pauseReason: data.pauseReason !== undefined ? data.pauseReason : null,
        });
      }

      console.log(`Agent ${data.agentId} status changed to ${data.status}`);
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