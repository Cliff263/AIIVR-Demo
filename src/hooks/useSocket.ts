import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { UserRole } from '@prisma/client';

export function useSocket(userId: string | null | undefined, role: UserRole) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only attempt to connect if a valid userId is provided
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.warn('useSocket: Invalid userId provided, not connecting.', userId);
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
      return;
    }

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      query: {
        userId,
        role
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [userId, role]);

  const emitStatusChange = (newStatus: string, reason?: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('status-change', {
        status: newStatus,
        reason
      });
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
} 