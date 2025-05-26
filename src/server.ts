import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';

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
    socket.on('join-agent-room', (agentId: number) => {
      socket.join(`agent-${agentId}`);
      console.log(`Agent ${agentId} joined their room`);
    });

    // Join supervisor's room
    socket.on('join-supervisor-room', (supervisorId: number) => {
      socket.join(`supervisor-${supervisorId}`);
      console.log(`Supervisor ${supervisorId} joined their room`);
    });

    // Handle agent status changes
    socket.on('agent-status-change', (data: { agentId: number; status: string; pauseReason?: string }) => {
      io.to(`supervisor-${data.agentId}`).emit('agent-status-update', data);
      console.log(`Agent ${data.agentId} status changed to ${data.status}`);
    });

    // Handle call updates
    socket.on('call-update', (data: { agentId: number; callId: number; status: string }) => {
      io.to(`agent-${data.agentId}`).emit('call-status-update', data);
      io.to(`supervisor-${data.agentId}`).emit('call-status-update', data);
      console.log(`Call ${data.callId} status updated to ${data.status}`);
    });

    // Handle query updates
    socket.on('query-update', (data: { agentId: number; queryId: number; status: string }) => {
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