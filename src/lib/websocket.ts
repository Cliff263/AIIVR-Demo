// src/lib/websocket.ts
// Emits activity log to all connected clients via Socket.IO
export function emitActivityLog(log: any) {
  // @ts-ignore
  if (global.io) {
    // Emit to all clients
    global.io.emit('activity-log', log);
  } else {
    // Optionally log a warning if socket server is not available
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Socket.IO server not found on global object. Activity log not emitted.');
    }
  }
} 