import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (userId: string, role: 'AGENT' | 'SUPERVISOR') => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Only attempt to connect if a valid userId is provided
    if (!userId || userId.trim() === '') {
      console.warn('useSocket: Invalid userId provided, not connecting.', userId);
      if (socketRef.current?.connected) {
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
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 45000,
      transports: ['websocket'], // Only use WebSocket transport
      autoConnect: true,
      forceNew: true,
      withCredentials: true,
      auth: {
        agentId: userId,
        role: role
      }
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached, stopping reconnection');
        socket.disconnect();
      }
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      
      // If the disconnect was not initiated by the client, attempt to reconnect
      if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log('Attempting to reconnect...');
        socket.connect();
      }
    });

    socketRef.current = socket;

    // Cleanup on unmount or when userId/role changes
    return () => {
      if (socketRef.current?.connected) {
        console.log('Disconnecting WebSocket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [userId, role]);

  const emitStatusChange = (status: string, pauseReason?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('status-change', {
        status,
        pauseReason,
      });
    } else {
      console.warn('Cannot emit status change: Socket not connected');
    }
  };

  const emitCallUpdate = (callId: number, status: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('call-update', {
        callId,
        status,
      });
    } else {
      console.warn('Cannot emit call update: Socket not connected');
    }
  };

  const emitQueryUpdate = (queryId: number, status: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('query-update', {
        queryId,
        status,
      });
    } else {
      console.warn('Cannot emit query update: Socket not connected');
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