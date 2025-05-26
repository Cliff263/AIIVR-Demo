import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (userId: number, role: 'AGENT' | 'SUPERVISOR') => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Get the base URL from the environment or use the current origin
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    console.log('Connecting to WebSocket server at:', baseUrl);
    
    // Initialize socket connection
    const socket = io(baseUrl, {
      path: '/api/socket',
      addTrailingSlash: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 45000,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      forceNew: true,
      withCredentials: true,
      upgrade: true,
      rememberUpgrade: true,
      rejectUnauthorized: false,
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
    });

    socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
    });

    socketRef.current = socket;

    // Join appropriate room based on role
    if (role === 'AGENT') {
      socket.emit('join-agent-room', userId);
    } else {
      socket.emit('join-supervisor-room', userId);
    }

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        console.log('Disconnecting WebSocket...');
        socket.disconnect();
      }
    };
  }, [userId, role]);

  const emitStatusChange = (status: string, pauseReason?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('agent-status-change', {
        agentId: userId,
        status,
        pauseReason,
      });
    }
  };

  const emitCallUpdate = (callId: number, status: string) => {
    if (socketRef.current) {
      socketRef.current.emit('call-update', {
        agentId: userId,
        callId,
        status,
      });
    }
  };

  const emitQueryUpdate = (queryId: number, status: string) => {
    if (socketRef.current) {
      socketRef.current.emit('query-update', {
        agentId: userId,
        queryId,
        status,
      });
    }
  };

  return {
    socket: socketRef.current,
    emitStatusChange,
    emitCallUpdate,
    emitQueryUpdate,
  };
}; 