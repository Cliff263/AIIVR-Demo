import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (userId: number, role: 'AGENT' | 'SUPERVISOR') => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only attempt to connect and join rooms if a valid userId is provided
    if (userId <= 0 || isNaN(userId)) {
      console.warn('useSocket: Invalid userId provided, not connecting or joining rooms.', userId);
      // Ensure existing socket is disconnected if userId becomes invalid
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      return;
    }

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
      setIsConnected(true);
       // Join appropriate room based on role after successful connection
      if (role === 'AGENT') {
        socket.emit('join-agent-room', userId);
      } else {
        socket.emit('join-supervisor-room', userId);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`WebSocket reconnection attempt ${attemptNumber}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setIsConnected(false);
    });

    socketRef.current = socket;

    // Cleanup on unmount or when userId/role changes to invalid
    return () => {
      if (socketRef.current && socketRef.current.connected) {
        console.log('Disconnecting WebSocket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId, role]); // Re-run effect if userId or role changes

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
    isConnected,
    emitStatusChange,
    emitCallUpdate,
    emitQueryUpdate,
  };
}; 